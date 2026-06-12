const supabaseGlobal = require('../config/supabase');
const getClient = (req) => supabaseGlobal.getClientForRequest ? supabaseGlobal.getClientForRequest(req) : supabaseGlobal;

const getTeachers = async (req, res) => {
    try {
        const supabase = getClient(req);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'teacher_admin')
            .order('name');

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createTeacher = async (req, res) => {
    const { name, email, department, designation, role, password } = req.body;
    try {
        const supabase = getClient(req);
        
        // Sign up the new teacher in Supabase Auth with a custom password if provided, or default fallback.
        // This triggers public.handle_new_user() in PostgreSQL to create the profiles entry.
        const defaultPassword = password || 'necleap@123';
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password: defaultPassword,
            options: {
                data: {
                    name,
                    role: role || 'teacher_admin'
                }
            }
        });

        if (authError) throw authError;

        if (!authData || !authData.user) {
            throw new Error('User account could not be created');
        }

        // Update the auto-generated profile row to populate department and designation
        const userId = authData.user.id;
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .update({
                department,
                designation
            })
            .eq('id', userId)
            .select();

        if (profileError) {
            console.error('Profile update failed:', profileError.message);
            // Non-blocking fallback: return default profile if update fails
            return res.status(201).json([{
                id: userId,
                name,
                email,
                role: role || 'teacher_admin',
                department,
                designation
            }]);
        }

        res.status(201).json(profileData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteTeacher = async (req, res) => {
    try {
        const supabase = getClient(req);
        const { id } = req.params;

        // Try calling the RPC function first (purges auth.users and cascades to profiles)
        const { error: rpcError } = await supabase.rpc('delete_user_by_admin', { target_user_id: id });

        if (rpcError) {
            console.warn('RPC delete failed, trying direct profiles deletion fallback:', rpcError.message);
            
            // Fallback: delete row directly from profiles table
            const { error: deleteError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
        }

        res.status(200).json({ message: 'Teacher profile deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getTeachers, createTeacher, deleteTeacher };
