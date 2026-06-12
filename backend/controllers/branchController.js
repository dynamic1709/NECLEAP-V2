const supabaseGlobal = require('../config/supabase');
const getClient = (req) => supabaseGlobal.getClientForRequest ? supabaseGlobal.getClientForRequest(req) : supabaseGlobal;
const { deleteFileFromStorage } = require('./pdfController');

const DEFAULT_BRANCHES = ['CSE', 'AIML', 'AI', 'DS', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];

const getBranches = async (req, res) => {
    try {
        const supabase = getClient(req);
        const { data, error } = await supabase
            .from('branches')
            .select('*')
            .order('name');
        
        if (error) {
            // Check if error is due to missing table (PGRST205) or similar database issues
            console.warn('Could not select from branches table, falling back to static defaults:', error.message);
            const fallbackList = DEFAULT_BRANCHES.map((name, idx) => ({ id: idx + 1, name }));
            return res.status(200).json(fallbackList);
        }

        // If table exists but is empty, seed defaults in response (client won't notice database is empty)
        if (!data || data.length === 0) {
            const fallbackList = DEFAULT_BRANCHES.map((name, idx) => ({ id: idx + 1, name }));
            return res.status(200).json(fallbackList);
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addBranch = async (req, res) => {
    try {
        const supabase = getClient(req);
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Branch name is required' });
        }

        const { data, error } = await supabase
            .from('branches')
            .insert([{ name: name.trim().toUpperCase() }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateBranch = async (req, res) => {
    try {
        const supabase = getClient(req);
        const { id } = req.params;
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Branch name is required' });
        }

        const newName = name.trim().toUpperCase();

        // 1. Fetch old branch to get its name
        const { data: oldBranch, error: fetchError } = await supabase
            .from('branches')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !oldBranch) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        // 2. Update branch name in branches table
        const { data: updatedBranch, error: updateError } = await supabase
            .from('branches')
            .update({ name: newName })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // 3. Cascade updates to subjects
        const { error: subjectCascadeError } = await supabase
            .from('subjects')
            .update({ branch: newName })
            .eq('branch', oldBranch.name);

        if (subjectCascadeError) {
            console.error('Failed to cascade branch update to subjects:', subjectCascadeError.message);
        }

        // 4. Cascade updates to pdfs
        const { error: pdfCascadeError } = await supabase
            .from('pdfs')
            .update({ branch: newName })
            .eq('branch', oldBranch.name);

        if (pdfCascadeError) {
            console.error('Failed to cascade branch update to pdfs:', pdfCascadeError.message);
        }

        res.status(200).json(updatedBranch);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteBranch = async (req, res) => {
    try {
        const supabase = getClient(req);
        const { id } = req.params;

        // 1. Fetch branch to get its name
        const { data: branch, error: fetchError } = await supabase
            .from('branches')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        // 2. Retrieve all PDFs under this branch to clean their storage files
        const { data: pdfs, error: fetchPdfsError } = await supabase
            .from('pdfs')
            .select('*')
            .eq('branch', branch.name);

        if (fetchPdfsError) {
            console.error('Failed to fetch PDFs for branch deletion:', fetchPdfsError.message);
        }

        if (pdfs && pdfs.length > 0) {
            for (const pdf of pdfs) {
                await deleteFileFromStorage(supabase, pdf.storage_url);
            }

            // Delete PDF database records
            const pdfIds = pdfs.map(p => p.id);
            const { error: deletePdfsError } = await supabase
                .from('pdfs')
                .delete()
                .in('id', pdfIds);

            if (deletePdfsError) {
                console.error('Failed to delete PDFs from database:', deletePdfsError.message);
            }
        }

        // 3. Delete associated subjects
        const { error: deleteSubjectsError } = await supabase
            .from('subjects')
            .delete()
            .eq('branch', branch.name);

        if (deleteSubjectsError) {
            console.error('Failed to delete subjects during branch deletion:', deleteSubjectsError.message);
        }

        // 4. Delete the branch row itself
        const { error: deleteBranchError } = await supabase
            .from('branches')
            .delete()
            .eq('id', id);

        if (deleteBranchError) throw deleteBranchError;

        res.status(200).json({ message: 'Branch and all associated subjects and PDFs deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getBranches, addBranch, updateBranch, deleteBranch };
