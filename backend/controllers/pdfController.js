const supabaseGlobal = require('../config/supabase');
const getClient = (req) => supabaseGlobal.getClientForRequest ? supabaseGlobal.getClientForRequest(req) : supabaseGlobal;
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const generateSlug = (authorName, pdfTitle, branch) => {
    const cleanPart = (str) => (str || '').trim().replace(/[^a-zA-Z0-9]/g, '');
    let cleanBranch = branch || '';
    if (cleanBranch.startsWith(',') && cleanBranch.endsWith(',')) {
        cleanBranch = cleanBranch.split(',').filter(Boolean)[0] || '';
    }
    return `${cleanPart(authorName)}_${cleanPart(pdfTitle)}_${cleanPart(cleanBranch)}`;
};

const deleteFileFromStorage = async (supabase, storageUrl) => {
    if (!storageUrl) return;

    const supabaseIndicator = '/storage/v1/object/public/necleap-pdfs/';
    if (storageUrl.includes(supabaseIndicator)) {
        try {
            const pathParts = storageUrl.split(supabaseIndicator);
            if (pathParts.length > 1) {
                const storagePath = decodeURIComponent(pathParts[1]);
                console.log(`Deleting file from Supabase storage: ${storagePath}`);
                const { error } = await supabase.storage
                    .from('necleap-pdfs')
                    .remove([storagePath]);
                if (error) {
                    console.error('Failed to delete file from Supabase storage:', error.message);
                } else {
                    console.log('Successfully deleted file from Supabase storage');
                }
            }
        } catch (err) {
            console.error('Error parsing/deleting Supabase file:', err.message);
        }
    } else if (storageUrl.includes('/uploads/')) {
        try {
            const urlParts = storageUrl.split('/uploads/');
            if (urlParts.length > 1) {
                const fileName = decodeURIComponent(urlParts[1]);
                const filePath = path.join(__dirname, '../uploads', fileName);
                console.log(`Deleting file locally: ${filePath}`);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('Successfully deleted local file');
                } else {
                    console.warn('Local file not found for deletion:', filePath);
                }
            }
        } catch (err) {
            console.error('Error deleting local file:', err.message);
        }
    }
};

// Upload PDF to Supabase Storage and Save to Database
const uploadPdf = async (req, res) => {
    try {
        const supabase = getClient(req);
        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        const { teacher_name, author_name, branch, year, semester, subject, pdf_title, description } = req.body;
        const finalAuthor = author_name || teacher_name || 'Admin';

        // Validation checks
        if (!branch || !year || !semester || !subject || !pdf_title) {
            return res.status(400).json({ message: 'Missing required fields: branch, year, semester, subject, and pdf_title are all required.' });
        }

        let viewUrl = '';

        const hasSupabaseConfig = process.env.SUPABASE_URL &&
            !process.env.SUPABASE_URL.includes('placeholder') &&
            process.env.SUPABASE_SERVICE_ROLE_KEY &&
            !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder');

        if (hasSupabaseConfig) {
            try {
                const cleanSubject = subject.toLowerCase().replace(/[^a-z0-9]/g, '');
                const safeOriginalName = req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                const fileName = `${uuidv4()}-${safeOriginalName}`;
                const storagePath = `${branch.toLowerCase()}/${year}-${semester}/${cleanSubject}/${fileName}`;

                // 1. Upload to Supabase Storage
                const { data: storageData, error: storageError } = await supabase.storage
                    .from('necleap-pdfs')
                    .upload(storagePath, req.file.buffer, {
                        contentType: 'application/pdf',
                        upsert: true
                    });

                if (storageError) throw storageError;

                // 2. Get Public URL
                const { data: publicUrlData } = supabase.storage
                    .from('necleap-pdfs')
                    .getPublicUrl(storagePath);

                viewUrl = publicUrlData.publicUrl;
            } catch (storageError) {
                console.error('Supabase Storage upload failed, falling back to local file storage:', storageError.message);
            }
        }

        // If local storage fallback is needed
        if (!viewUrl) {
            const uploadDir = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const safeOriginalName = req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const fileName = `${uuidv4()}-${safeOriginalName}`;
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, req.file.buffer);

            // Serve URL from express backend
            const localUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
            viewUrl = localUrl;
            console.log(`Saved file locally: ${localUrl}`);
        }

        // Auto-register subject in subjects table if it does not exist
        try {
            const { data: existingSubject } = await supabase
                .from('subjects')
                .select('*')
                .eq('branch', branch)
                .eq('year', year)
                .eq('semester', semester)
                .ilike('subject_name', subject)
                .maybeSingle();

            if (!existingSubject) {
                console.log(`Auto-registering new subject in database: ${subject}`);
                await supabase
                    .from('subjects')
                    .insert([{
                        branch: branch.startsWith(',') && branch.endsWith(',') ? branch : `,${branch},`,
                        year,
                        semester,
                        subject_name: subject
                    }]);
            }
        } catch (subErr) {
            console.error('Failed to auto-register subject:', subErr.message);
        }

        // 2. Save metadata to Supabase (Merge branches for same subject if mapped)
        let mappedBranch = branch;
        try {
            const { data: matchedSubjects } = await supabase
                .from('subjects')
                .select('branch')
                .eq('year', year)
                .eq('semester', semester)
                .ilike('subject_name', subject);

            if (matchedSubjects && matchedSubjects.length > 0) {
                const branchSet = new Set();
                if (branch && typeof branch === 'string') {
                    if (branch.startsWith(',') && branch.endsWith(',')) {
                        branch.split(',').filter(Boolean).forEach(b => branchSet.add(b));
                    } else {
                        branchSet.add(branch);
                    }
                }

                for (const sub of matchedSubjects) {
                    if (sub.branch && typeof sub.branch === 'string') {
                        if (sub.branch.startsWith(',') && sub.branch.endsWith(',')) {
                            sub.branch.split(',').filter(Boolean).forEach(b => branchSet.add(b));
                        } else {
                            branchSet.add(sub.branch);
                        }
                    }
                }
                mappedBranch = `,${Array.from(branchSet).join(',')},`;
            } else {
                if (branch && typeof branch === 'string' && !branch.startsWith(',')) {
                    mappedBranch = `,${branch},`;
                }
            }
        } catch (err) {
            console.error('Failed to lookup matched subjects for branches:', err.message);
            if (branch && typeof branch === 'string' && !branch.startsWith(',')) {
                mappedBranch = `,${branch},`;
            }
        }

        const slug = `${generateSlug(finalAuthor, pdf_title, branch)}_${uuidv4().substring(0, 6)}`;

        const { data, error } = await supabase
            .from('pdfs')
            .insert([{
                teacher_name: finalAuthor,
                branch: mappedBranch,
                year,
                semester,
                subject,
                pdf_title,
                description: description || '',
                slug,
                storage_url: viewUrl,
                status: 'Approved',
                uploaded_by: req.user.id
            }])
            .select();

        if (error) throw error;

        // Log activity
        await supabase.from('activity_logs').insert([{
            user_id: req.user.id,
            action: `Uploaded PDF: ${pdf_title}`
        }]);

        res.status(201).json({ message: 'Upload successful', data });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Server error during upload', error: error.message });
    }
};

const getPdfs = async (req, res) => {
    try {
        const supabase = getClient(req);
        let query = supabase.from('pdfs').select('*');

        // Apply filters
        const { branch, year, semester, subject, search, status } = req.query;

        if (year) query = query.eq('year', year);
        if (semester) query = query.eq('semester', semester);
        if (subject) query = query.eq('subject', subject);
        if (status) {
            if (status !== 'all') {
                query = query.eq('status', status);
            }
        } else {
            query = query.eq('status', 'Approved'); // Default to approved for public
        }

        if (search) {
            query = query.or(`pdf_title.ilike.%${search}%,teacher_name.ilike.%${search}%,subject.ilike.%${search}%`);
        }

        const { data, error } = await query.order('uploaded_at', { ascending: false });
        if (error) throw error;

        let filteredData = data;
        if (branch) {
            filteredData = data.filter(pdf => {
                if (!pdf.branch) return false;
                if (pdf.branch.startsWith(',') && pdf.branch.endsWith(',')) {
                    return pdf.branch.split(',').filter(Boolean).includes(branch);
                }
                return pdf.branch === branch;
            });
        }

        res.status(200).json(filteredData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const approvePdf = async (req, res) => {
    try {
        const supabase = getClient(req);
        const { id } = req.params;
        const { data, error } = await supabase
            .from('pdfs')
            .update({ status: 'Approved' })
            .eq('id', id)
            .select();

        if (error) throw error;

        await supabase.from('activity_logs').insert([{
            user_id: req.user.id,
            action: `Approved PDF ID: ${id}`
        }]);

        res.status(200).json({ message: 'Approved successfully', data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPdfBySlug = async (req, res) => {
    try {
        const supabase = getClient(req);
        const { slug } = req.params;
        const { data, error } = await supabase
            .from('pdfs')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'PDF not found' });

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deletePdf = async (req, res) => {
    try {
        const supabase = getClient(req);
        const { id } = req.params;

        const { data: pdf, error: fetchError } = await supabase
            .from('pdfs')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !pdf) {
            return res.status(404).json({ message: 'PDF not found' });
        }

        // Super admin can delete any PDF; teacher_admin can only delete their own
        if (req.user.role !== 'super_admin' && pdf.uploaded_by !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this PDF' });
        }

        // Delete file from Supabase storage or local uploads
        await deleteFileFromStorage(supabase, pdf.storage_url);

        const { error } = await supabase
            .from('pdfs')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await supabase.from('activity_logs').insert([{
            user_id: req.user.id,
            action: `Deleted PDF ID: ${id}`
        }]);

        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAdminPdfs = async (req, res) => {
    try {
        const supabase = getClient(req);
        let query = supabase.from('pdfs').select('*');

        // Super admin sees ALL PDFs; teacher_admin sees only their own uploads
        if (req.user.role !== 'super_admin') {
            query = query.eq('uploaded_by', req.user.id);
        }

        const { data, error } = await query.order('uploaded_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updatePdf = async (req, res) => {
    try {
        const supabase = getClient(req);
        const { id } = req.params;
        const { teacher_name, author_name, branch, year, semester, subject, pdf_title, description, status } = req.body;
        const finalAuthor = author_name || teacher_name || 'Admin';

        // Validation checks
        if (!branch || !year || !semester || !subject || !pdf_title) {
            return res.status(400).json({ message: 'Missing required fields: branch, year, semester, subject, and pdf_title are all required.' });
        }

        // 1. Fetch current PDF metadata
        const { data: oldPdf, error: fetchError } = await supabase
            .from('pdfs')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !oldPdf) {
            return res.status(404).json({ message: 'PDF not found' });
        }

        // Super admin can edit any PDF; teacher_admin can only edit their own
        if (req.user.role !== 'super_admin' && oldPdf.uploaded_by !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to edit this PDF' });
        }

        // 2. Format mapped branch list
        let mappedBranch = branch;
        try {
            const { data: matchedSubjects } = await supabase
                .from('subjects')
                .select('branch')
                .eq('year', year)
                .eq('semester', semester)
                .ilike('subject_name', subject);

            if (matchedSubjects && matchedSubjects.length > 0) {
                const branchSet = new Set();
                if (branch && typeof branch === 'string') {
                    if (branch.startsWith(',') && branch.endsWith(',')) {
                        branch.split(',').filter(Boolean).forEach(b => branchSet.add(b));
                    } else {
                        branchSet.add(branch);
                    }
                }

                for (const sub of matchedSubjects) {
                    if (sub.branch && typeof sub.branch === 'string') {
                        if (sub.branch.startsWith(',') && sub.branch.endsWith(',')) {
                            sub.branch.split(',').filter(Boolean).forEach(b => branchSet.add(b));
                        } else {
                            branchSet.add(sub.branch);
                        }
                    }
                }
                mappedBranch = `,${Array.from(branchSet).join(',')},`;
            } else {
                if (branch && typeof branch === 'string' && !branch.startsWith(',')) {
                    mappedBranch = `,${branch},`;
                }
            }
        } catch (err) {
            console.error('Failed to lookup matched subjects for branches:', err.message);
            if (branch && typeof branch === 'string' && !branch.startsWith(',')) {
                mappedBranch = `,${branch},`;
            }
        }

        const slug = `${generateSlug(finalAuthor, pdf_title, branch)}_${uuidv4().substring(0, 6)}`;

        const updateData = {
            teacher_name: finalAuthor,
            branch: mappedBranch,
            year,
            semester,
            subject,
            pdf_title,
            description: description || '',
            slug
        };

        if (status) {
            updateData.status = status;
        }

        const { data, error } = await supabase
            .from('pdfs')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await supabase.from('activity_logs').insert([{
            user_id: req.user.id,
            action: `Updated PDF: ${pdf_title}`
        }]);

        res.status(200).json({ message: 'Update successful', data });
    } catch (error) {
        console.error('Update PDF Error:', error);
        res.status(500).json({ message: 'Server error during PDF update', error: error.message });
    }
};

module.exports = { uploadPdf, getPdfs, approvePdf, getPdfBySlug, deletePdf, getAdminPdfs, updatePdf, deleteFileFromStorage };
