const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testPost() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  console.log('Logging in to Supabase Auth with necleap@gmail.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'necleap@gmail.com',
    password: 'necleap@123'
  });

  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }

  const token = authData.session.access_token;
  console.log('Login successful! Using access token.');

  const formData = new FormData();
  formData.append('branch', ',AI,');
  formData.append('year', '1');
  formData.append('semester', '1');
  formData.append('subject_name', 'Test Subject ' + Date.now());
  
  // Create a dummy PDF blob
  const dummyPdf = new Blob(['%PDF-1.4 ... dummy content ...'], { type: 'application/pdf' });
  formData.append('pdfFiles', dummyPdf, 'test_notes.pdf');
  formData.append('pdfTitles', 'Test Unit 1');

  try {
    console.log('Sending test POST request to http://localhost:5000/api/subjects using native fetch...');
    const response = await fetch('http://localhost:5000/api/subjects', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const status = response.status;
    const data = await response.text();
    console.log('Response Status:', status);
    console.log('Response Body:', data);
  } catch (error) {
    console.error('Fetch request failed:', error.message);
  }
}

testPost();
