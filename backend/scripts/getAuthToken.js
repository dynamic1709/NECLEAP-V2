const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function getToken() {
  const email = `test.admin.${Date.now()}@gmail.com`;
  const password = 'TestPassword123!';

  console.log(`Signing up new user: ${email}`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: 'Test Administrator',
        role: 'super_admin'
      }
    }
  });

  if (signUpError) {
    console.error('Sign up failed:', signUpError.message);
    return;
  }

  console.log('Sign up successful!');
  const session = signUpData.session;
  if (session) {
    console.log('Access Token:', session.access_token);
  } else {
    console.log('No session returned. Please check if email confirmation is required.');
  }
}

getToken();
