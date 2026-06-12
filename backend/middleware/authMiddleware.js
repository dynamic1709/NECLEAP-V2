const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        // Try local JWT decode first (for override / mock login credentials)
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret');
            if (decoded && decoded.id === '00000000-0000-0000-0000-000000000000') {
                req.user = {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role,
                    name: 'System Admin'
                };
                return next();
            }
        } catch (jwtErr) {
            // Ignore and fall back to Supabase check
        }

        // Standard Supabase Auth check
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }

        // Fetch additional user details from profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            // Return base user if profile is missing
            req.user = { ...user, role: 'teacher_admin' };
        } else {
            req.user = { ...user, ...profile };
        }
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Server error in auth middleware' });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role ${req.user?.role} is not authorized to access this route` });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };
