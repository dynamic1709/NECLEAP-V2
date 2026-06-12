const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function runTest() {
  try {
    console.log('Logging in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'necleap@gmail.com',
      password: 'necleap@123'
    });

    if (authError) {
      console.error('Login failed:', authError.message);
      return;
    }

    const token = authData.session.access_token;
    
    // Test Scenario 1: Missing required field (semester)
    console.log('\nScenario 1: Uploading with missing required field...');
    const form1 = new FormData();
    const dummyBlob = new Blob(['%PDF-1.4 dummy'], { type: 'application/pdf' });
    form1.append('pdfFile', dummyBlob, 'test.pdf');
    form1.append('teacher_name', 'System Admin');
    form1.append('branch', 'CSE');
    form1.append('year', '1');
    // semester is missing
    form1.append('subject', 'LA&C');
    form1.append('pdf_title', 'Unit 1: Test');

    const res1 = await fetch('http://localhost:5000/api/pdfs/upload', {
      method: 'POST',
      body: form1,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Response Status (Expected 400):', res1.status);
    console.log('Response Body:', await res1.json());

    // Test Scenario 2: Invalid file extension (non-PDF)
    console.log('\nScenario 2: Uploading a non-PDF file...');
    const form2 = new FormData();
    const badBlob = new Blob(['hello world text'], { type: 'text/plain' });
    form2.append('pdfFile', badBlob, 'test.txt');
    form2.append('teacher_name', 'System Admin');
    form2.append('branch', 'CSE');
    form2.append('year', '1');
    form2.append('semester', '1');
    form2.append('subject', 'LA&C');
    form2.append('pdf_title', 'Unit 1: Text file');

    const res2 = await fetch('http://localhost:5000/api/pdfs/upload', {
      method: 'POST',
      body: form2,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Response Status (Expected 400):', res2.status);
    console.log('Response Body:', await res2.json());

  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

runTest();
