const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        let authResult;
        let authError;

        try {
            authResult = await supabase.auth.signInWithPassword({
                email,
                password
            });
        } catch (err) {
            authError = err;
        }

        const data = authResult?.data;
        const error = authResult?.error || authError;

        if (error) {
            throw error;
        }

        // Fetch profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            // If profile does not exist, create a temporary one for safety
            const tempProfile = {
                id: data.user.id,
                name: data.user.email.split('@')[0],
                email: data.user.email,
                role: 'teacher_admin'
            };
            return res.status(200).json({
                user: { ...data.user, ...tempProfile },
                session: data.session
            });
        }

        res.status(200).json({
            user: { ...data.user, ...profile },
            session: data.session
        });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

const logout = async (req, res) => {
    try {
        await supabase.auth.signOut();
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { login, logout };
