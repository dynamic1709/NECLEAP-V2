const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key length:', supabaseAnonKey ? supabaseAnonKey.length : 0);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('\nChecking if database tables exist...');
  
  // 1. Check profiles
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('❌ Table "profiles" check failed:', error.message);
    } else {
      console.log('✅ Table "profiles" exists! Count:', data);
    }
  } catch (e) {
    console.log('❌ Table "profiles" check failed with exception:', e.message);
  }

  // 2. Check subjects
  try {
    const { data, error } = await supabase.from('subjects').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('❌ Table "subjects" check failed:', error.message);
    } else {
      console.log('✅ Table "subjects" exists! Count:', data);
    }
  } catch (e) {
    console.log('❌ Table "subjects" check failed with exception:', e.message);
  }

  // 3. Check pdfs
  try {
    const { data, error } = await supabase.from('pdfs').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('❌ Table "pdfs" check failed:', error.message);
    } else {
      console.log('✅ Table "pdfs" exists! Count:', data);
    }
  } catch (e) {
    console.log('❌ Table "pdfs" check failed with exception:', e.message);
  }
}

checkTables();
