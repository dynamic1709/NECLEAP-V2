const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function runVerification() {
  try {
    console.log('Logging in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'necleap@gmail.com',
      password: 'necleap@123'
    });

    if (authError) {
      console.error('Login failed:', authError.message);
      return;
    }

    const token = authData.session.access_token;
    console.log('Login successful! Testing subject insertion...');

    // 1. Insert a subject mapped to CSE, ECE, and IT
    const uniqueSubjectName = `LA_C_Test_${Date.now()}`;
    const branchString = ',CSE,ECE,IT,';
    
    const formData = new FormData();
    formData.append('branch', branchString);
    formData.append('year', '1');
    formData.append('semester', '1');
    formData.append('subject_name', uniqueSubjectName);
    
    // Create a dummy PDF blob to attach during subject creation
    const dummyBlob = new Blob(['%PDF-1.4 dummy'], { type: 'application/pdf' });
    formData.append('pdfFiles', dummyBlob, 'unit1_intro.pdf');
    formData.append('pdfTitles', 'Unit 1: Introduction');

    console.log(`Creating subject "${uniqueSubjectName}" mapped to ${branchString}...`);
    const createRes = await fetch('http://localhost:5000/api/subjects', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (createRes.status !== 201) {
      console.error('Failed to create subject:', await createRes.text());
      return;
    }

    console.log('Subject and PDF created successfully. Verifying propagation...');

    // 2. Query subjects for CSE, ECE, and IT
    const branchesToTest = ['CSE', 'ECE', 'IT'];
    for (const br of branchesToTest) {
      const subRes = await fetch(`http://localhost:5000/api/subjects?branch=${br}&year=1&semester=1`);
      const subjects = await subRes.json();
      const matchedSub = subjects.find(s => s.subject_name === uniqueSubjectName);
      if (matchedSub) {
        console.log(`✓ Subject is visible in branch ${br}`);
      } else {
        console.error(`✗ Subject is NOT visible in branch ${br}!`);
      }

      const pdfRes = await fetch(`http://localhost:5000/api/pdfs?branch=${br}&year=1&semester=1&subject=${uniqueSubjectName}`);
      const pdfs = await pdfRes.json();
      const matchedPdf = pdfs.find(p => p.pdf_title === 'Unit 1: Introduction');
      if (matchedPdf) {
        console.log(`   ✓ PDF is visible in branch ${br}`);
      } else {
        console.error(`   ✗ PDF is NOT visible in branch ${br}!`);
      }
    }

    // 3. Now test uploading a PDF for this subject via the standalone upload endpoint
    console.log('\nTesting standalone PDF upload for same subject...');
    const uploadFormData = new FormData();
    uploadFormData.append('pdfFile', dummyBlob, 'unit2_advanced.pdf');
    uploadFormData.append('teacher_name', 'System Admin');
    uploadFormData.append('branch', 'CSE'); // Uploaded under CSE
    uploadFormData.append('year', '1');
    uploadFormData.append('semester', '1');
    uploadFormData.append('subject', uniqueSubjectName);
    uploadFormData.append('pdf_title', 'Unit 2: Advanced');
    uploadFormData.append('description', 'Unit 2 details');

    const uploadRes = await fetch('http://localhost:5000/api/pdfs/upload', {
      method: 'POST',
      body: uploadFormData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (uploadRes.status !== 201) {
      console.error('Failed to upload standalone PDF:', await uploadRes.text());
      return;
    }

    console.log('Standalone PDF uploaded successfully. Verifying propagation of Unit 2 notes...');

    for (const br of branchesToTest) {
      const pdfRes = await fetch(`http://localhost:5000/api/pdfs?branch=${br}&year=1&semester=1&subject=${uniqueSubjectName}`);
      const pdfs = await pdfRes.json();
      const matchedPdf = pdfs.find(p => p.pdf_title === 'Unit 2: Advanced');
      if (matchedPdf) {
        console.log(`✓ Unit 2 PDF is visible in branch ${br} (successfully propagated from CSE!)`);
      } else {
        console.error(`✗ Unit 2 PDF is NOT visible in branch ${br}!`);
      }
    }

  } catch (err) {
    console.error('Verification failed:', err.message);
  }
}

runVerification();
