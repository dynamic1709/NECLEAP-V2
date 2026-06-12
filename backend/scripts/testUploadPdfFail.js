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
    
    // Simulate empty description, and other potential inputs
    const uploadFormData = new FormData();
    const dummyBlob = new Blob(['%PDF-1.4 dummy'], { type: 'application/pdf' });
    uploadFormData.append('pdfFile', dummyBlob, 'test_blank_desc.pdf');
    uploadFormData.append('teacher_name', 'System Admin');
    uploadFormData.append('branch', 'CSE');
    uploadFormData.append('year', '1');
    uploadFormData.append('semester', '1');
    uploadFormData.append('subject', 'LA&C');
    uploadFormData.append('pdf_title', 'Unit 1: Test blank');
    uploadFormData.append('description', ''); // empty description

    console.log('Sending upload request with empty description...');
    const res = await fetch('http://localhost:5000/api/pdfs/upload', {
      method: 'POST',
      body: uploadFormData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Response Status:', res.status);
    console.log('Response Body:', await res.text());
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

runTest();
