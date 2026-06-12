const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function run() {
  const email = 'test.admin.1781248548249@gmail.com'; // Use the email from the previous getAuthToken output
  const password = 'TestPassword123!';

  console.log(`Attempting to sign in with: ${email}`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Sign in failed:', error.message);
  } else {
    console.log('Sign in successful! Session info:', data.session ? 'Valid' : 'None');
  }
}

run();
