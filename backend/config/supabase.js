const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

const supabaseKey = serviceKey && !serviceKey.includes('placeholder') && !serviceKey.includes('your_supabase_service_role_key_here')
  ? serviceKey 
  : anonKey;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here') {
  console.warn('Supabase URL or Key is missing. Supabase will not function correctly.');
}

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder_key');

const getClientForRequest = (req) => {
  const token = req?.headers?.authorization?.split(' ')[1];
  
  let isLocalToken = false;
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret');
      isLocalToken = true;
    } catch (e) {
      // Not a local token
    }
  }

  if (token && token !== 'mock_offline_token_jwt' && !isLocalToken && supabaseKey === anonKey) {
    return createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  }
  return supabase;
};

module.exports = supabase;
module.exports.getClientForRequest = getClientForRequest;
