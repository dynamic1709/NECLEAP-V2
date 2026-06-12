const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Use service role key if available, otherwise try anon key with admin login
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

const useServiceKey = serviceKey && !serviceKey.includes('your_supabase') && !serviceKey.includes('placeholder');

async function cleanTestData() {
  let supabase;

  if (useServiceKey) {
    console.log('Using service role key for admin access...');
    supabase = createClient(supabaseUrl, serviceKey);
  } else {
    console.log('Service role key not available. Logging in as admin...');
    supabase = createClient(supabaseUrl, anonKey);
    
    // Login as super admin to get proper permissions
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: 'necleap@gmail.com',
      password: 'necleap@123'
    });
    
    if (authErr) {
      console.error('Login failed:', authErr.message);
      console.log('Please provide SUPABASE_SERVICE_ROLE_KEY in .env or check login credentials.');
      return;
    }
    console.log('Logged in as:', authData.user.email);
  }

  // 1. Delete all PDFs
  console.log('\n=== Deleting all PDFs ===');
  const { data: pdfs, error: pdfErr } = await supabase.from('pdfs').select('id, pdf_title, storage_url');
  
  if (pdfErr) {
    console.error('Error fetching PDFs:', pdfErr.message);
    return;
  }

  console.log(`Found ${pdfs.length} PDFs to delete`);

  // Delete storage files
  for (const pdf of pdfs) {
    if (pdf.storage_url && pdf.storage_url.includes('/storage/v1/object/public/necleap-pdfs/')) {
      const storagePath = decodeURIComponent(pdf.storage_url.split('/storage/v1/object/public/necleap-pdfs/')[1]);
      const { error } = await supabase.storage.from('necleap-pdfs').remove([storagePath]);
      if (error) console.warn(`  Storage delete failed for "${pdf.pdf_title}": ${error.message}`);
      else console.log(`  ✓ Deleted file: ${storagePath}`);
    }
  }

  // Delete DB records
  if (pdfs.length > 0) {
    const { error: delErr, count } = await supabase.from('pdfs').delete().in('id', pdfs.map(p => p.id));
    if (delErr) {
      console.error('Error deleting PDFs from DB:', delErr.message);
    } else {
      console.log(`✅ Deleted ${pdfs.length} PDF records from database`);
    }
  }

  // 2. Clean up test/duplicate subjects
  console.log('\n=== Cleaning subjects ===');
  const { data: subjects, error: subErr } = await supabase.from('subjects').select('*');
  if (subErr) {
    console.error('Error fetching subjects:', subErr.message);
    return;
  }

  // Remove test subjects
  const testSubjects = subjects.filter(s => 
    s.subject_name.toLowerCase().includes('admin verification') ||
    s.subject_name.toLowerCase().includes('test')
  );
  for (const s of testSubjects) {
    const { error } = await supabase.from('subjects').delete().eq('id', s.id);
    if (error) console.warn(`  Failed to delete test subject "${s.subject_name}": ${error.message}`);
    else console.log(`  ✓ Deleted test subject: "${s.subject_name}"`);
  }

  // Remove duplicates (keep first, delete rest)
  const remaining = subjects.filter(s => !testSubjects.some(t => t.id === s.id));
  const seen = new Map();
  for (const s of remaining) {
    const key = `${s.subject_name.toLowerCase()}_${s.year}_${s.semester}`;
    if (seen.has(key)) {
      const { error } = await supabase.from('subjects').delete().eq('id', s.id);
      if (error) console.warn(`  Failed to delete duplicate "${s.subject_name}": ${error.message}`);
      else console.log(`  ✓ Deleted duplicate subject: "${s.subject_name}" (branch: ${s.branch})`);
    } else {
      seen.set(key, s);
    }
  }

  // 3. Final state
  console.log('\n=== Final State ===');
  const { data: finalPdfs } = await supabase.from('pdfs').select('id, pdf_title');
  const { data: finalSubs } = await supabase.from('subjects').select('id, subject_name, branch');
  console.log(`PDFs: ${finalPdfs?.length || 0}`);
  console.log(`Subjects: ${finalSubs?.length || 0}`);
  if (finalSubs) finalSubs.forEach(s => console.log(`  - "${s.subject_name}" (${s.branch})`));
  
  console.log('\n✅ Cleanup complete!');
}

cleanTestData().catch(err => console.error('Fatal:', err));
