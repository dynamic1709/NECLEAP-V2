const supabaseGlobal = require('../config/supabase');
const getClient = (req) => supabaseGlobal.getClientForRequest ? supabaseGlobal.getClientForRequest(req) : supabaseGlobal;
const { deleteFileFromStorage } = require('./pdfController');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const generateSlug = (teacherName, subject, title) => {
    const cleanStr = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return `${cleanStr(teacherName)}_${cleanStr(subject)}_${cleanStr(title)}`;
};

const getSubjects = async (req, res) => {
    try {
        const supabase = getClient(req);
        let query = supabase.from('subjects').select('*');
        const { branch, year, semester } = req.query;

        if (year) query = query.eq('year', year);
        if (semester) query = query.eq('semester', semester);

        const { data, error } = await query;
        if (error) throw error;

        let filteredData = data;
        if (branch) {
            filteredData = data.filter(sub => {
                if (!sub.branch) return false;
                if (sub.branch.startsWith(',') && sub.branch.endsWith(',')) {
                    return sub.branch.split(',').filter(Boolean).includes(branch);
                }
                return sub.branch === branch;
            });
        }

        res.status(200).json(filteredData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addSubject = async (req, res) => {
    try {
        const supabase = getClient(req);
        const { branch, year, semester, subject_name } = req.body;

        // Insert the subject
        const { data: createdSubjectArr, error } = await supabase
            .from('subjects')
            .insert([{ branch, year, semester, subject_name }])
            .select();
        
        if (error) throw error;
        const createdSubject = createdSubjectArr[0];

        // If multiple PDF files are attached, upload each and register in pdfs table
        if (req.files && req.files.length > 0) {
            const pdfTitles = Array.isArray(req.body.pdfTitles) 
                ? req.body.pdfTitles 
                : (req.body.pdfTitles ? [req.body.pdfTitles] : []);

            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const rawTitle = pdfTitles[i] || file.originalname.replace('.pdf', '');
                const pdf_title = `${rawTitle}`;
                
                let viewUrl = '';
                const hasSupabaseConfig = process.env.SUPABASE_URL && 
                                          !process.env.SUPABASE_URL.includes('placeholder') &&
                                          process.env.SUPABASE_SERVICE_ROLE_KEY && 
                                          !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder');

                const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                const fileName = `${uuidv4()}-${safeOriginalName}`;
                const cleanSubject = subject_name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const cleanBranch = branch.replace(/,/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
                const storagePath = `${cleanBranch}/${year}-${semester}/${cleanSubject}/${fileName}`;

                if (hasSupabaseConfig) {
                    try {
                        const { data: storageData, error: storageError } = await supabase.storage
                            .from('necleap-pdfs')
                            .upload(storagePath, file.buffer, {
                                contentType: 'application/pdf',
                                upsert: true
                            });

                        if (storageError) throw storageError;

                        const { data: publicUrlData } = supabase.storage
                            .from('necleap-pdfs')
                            .getPublicUrl(storagePath);
                        
                        viewUrl = publicUrlData.publicUrl;
                    } catch (storageError) {
                        console.error('Supabase Storage upload failed during subject create, falling back locally:', storageError.message);
                    }
                }

                if (!viewUrl) {
                    const uploadDir = path.join(__dirname, '../uploads');
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    const filePath = path.join(uploadDir, fileName);
                    fs.writeFileSync(filePath, file.buffer);
                    viewUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
                }

                const teacher_name = req.user.name || req.user.email || 'Admin';
                const baseSlug = generateSlug(teacher_name, subject_name, pdf_title);
                const slug = `${baseSlug}_${uuidv4().substring(0, 6)}`;

                const { error: insertPdfError } = await supabase
                    .from('pdfs')
                    .insert([{
                        teacher_name,
                        branch,
                        year,
                        semester,
                        subject: subject_name,
                        pdf_title,
                        description: `Reference notes for ${subject_name}`,
                        slug,
                        storage_url: viewUrl,
                        status: 'Approved',
                        uploaded_by: req.user.id
                    }]);

                if (insertPdfError) {
                    console.error('Failed to upload PDF during subject creation:', insertPdfError.message);
                }
            }
        }

        res.status(201).json(createdSubject);
    } catch (error) {
        console.error('Add Subject Error:', error);
        res.status(500).json({ message: error.message });
    }
};

const updateSubject = async (req, res) => {
    try {
        const supabase = getClient(req);
        const { id } = req.params;
        const { branch, year, semester, subject_name } = req.body;

        // Fetch old subject
        const { data: oldSubject, error: fetchError } = await supabase
            .from('subjects')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !oldSubject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Update subject details
        const { data: updatedSubject, error: updateError } = await supabase
            .from('subjects')
            .update({ branch, year, semester, subject_name })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Cascade changes to pdfs table matching old metadata
        const { error: cascadeError } = await supabase
            .from('pdfs')
            .update({
                branch,
                year,
                semester,
                subject: subject_name
            })
            .eq('branch', oldSubject.branch)
            .eq('year', oldSubject.year)
            .eq('semester', oldSubject.semester)
            .eq('subject', oldSubject.subject_name);

        if (cascadeError) {
            console.error('Failed to cascade subject updates to pdfs table:', cascadeError.message);
        }

        // Handle additional PDF files upload if req.files is provided
        if (req.files && req.files.length > 0) {
            const pdfTitles = Array.isArray(req.body.pdfTitles) 
                ? req.body.pdfTitles 
                : (req.body.pdfTitles ? [req.body.pdfTitles] : []);

            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const rawTitle = pdfTitles[i] || file.originalname.replace('.pdf', '');
                const pdf_title = `${rawTitle}`;
                
                let viewUrl = '';
                const hasSupabaseConfig = process.env.SUPABASE_URL && 
                                          !process.env.SUPABASE_URL.includes('placeholder') &&
                                          process.env.SUPABASE_SERVICE_ROLE_KEY && 
                                          !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder');

                const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                const fileName = `${uuidv4()}-${safeOriginalName}`;
                const cleanSubject = subject_name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const cleanBranch = branch.replace(/,/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
                const storagePath = `${cleanBranch}/${year}-${semester}/${cleanSubject}/${fileName}`;

                if (hasSupabaseConfig) {
                    try {
                        const { data: storageData, error: storageError } = await supabase.storage
                            .from('necleap-pdfs')
                            .upload(storagePath, file.buffer, {
                                contentType: 'application/pdf',
                                upsert: true
                            });

                        if (storageError) throw storageError;

                        const { data: publicUrlData } = supabase.storage
                            .from('necleap-pdfs')
                            .getPublicUrl(storagePath);
                        
                        viewUrl = publicUrlData.publicUrl;
                    } catch (storageError) {
                        console.error('Supabase Storage upload failed during subject update, falling back locally:', storageError.message);
                    }
                }

                if (!viewUrl) {
                    const uploadDir = path.join(__dirname, '../uploads');
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    const filePath = path.join(uploadDir, fileName);
                    fs.writeFileSync(filePath, file.buffer);
                    viewUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
                }

                const teacher_name = req.user.name || req.user.email || 'Admin';
                const baseSlug = generateSlug(teacher_name, subject_name, pdf_title);
                const slug = `${baseSlug}_${uuidv4().substring(0, 6)}`;

                const { error: insertPdfError } = await supabase
                    .from('pdfs')
                    .insert([{
                        teacher_name,
                        branch,
                        year,
                        semester,
                        subject: subject_name,
                        pdf_title,
                        description: `Reference notes for ${subject_name}`,
                        slug,
                        storage_url: viewUrl,
                        status: 'Approved',
                        uploaded_by: req.user.id
                    }]);

                if (insertPdfError) {
                    console.error('Failed to create/replace PDF metadata for subject:', insertPdfError.message);
                }
            }
        }

        res.status(200).json(updatedSubject);
    } catch (error) {
        console.error('Update Subject Error:', error);
        res.status(500).json({ message: error.message });
    }
};

const deleteSubject = async (req, res) => {
    try {
        const supabase = getClient(req);
        const { id } = req.params;

        // Fetch subject details first
        const { data: subject, error: fetchError } = await supabase
            .from('subjects')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Retrieve associated PDFs to clean their storage files
        const { data: pdfs, error: fetchPdfsError } = await supabase
            .from('pdfs')
            .select('*')
            .eq('branch', subject.branch)
            .eq('year', subject.year)
            .eq('semester', subject.semester)
            .eq('subject', subject.subject_name);

        if (fetchPdfsError) {
            console.error('Failed to retrieve associated PDFs for subject deletion:', fetchPdfsError.message);
        }

        if (pdfs && pdfs.length > 0) {
            for (const pdf of pdfs) {
                await deleteFileFromStorage(supabase, pdf.storage_url);
            }

            const pdfIds = pdfs.map(p => p.id);
            const { error: deletePdfsError } = await supabase
                .from('pdfs')
                .delete()
                .in('id', pdfIds);

            if (deletePdfsError) {
                console.error('Failed to delete PDFs from database during subject deletion:', deletePdfsError.message);
            }
        }

        // Delete subject
        const { error: deleteSubjectError } = await supabase
            .from('subjects')
            .delete()
            .eq('id', id);

        if (deleteSubjectError) throw deleteSubjectError;

        res.status(200).json({ message: 'Subject and all associated PDFs deleted successfully' });
    } catch (error) {
        console.error('Delete Subject Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getSubjects, addSubject, updateSubject, deleteSubject };
