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

    // Fetch the latest PDF entry
    const { data: pdfs, error: fetchError } = await supabase
      .from('pdfs')
      .select('id, pdf_title, subject')
      .order('uploaded_at', { ascending: false })
      .limit(1);

    if (fetchError || !pdfs || pdfs.length === 0) {
      console.error('No PDFs found in database to test updates on.');
      return;
    }

    const targetPdf = pdfs[0];
    const newTitle = `Updated Title ${Date.now()}`;
    console.log(`Updating PDF ID: ${targetPdf.id} ("${targetPdf.pdf_title}") to "${newTitle}"...`);

    const updateRes = await fetch(`http://localhost:5000/api/pdfs/${targetPdf.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        teacher_name: 'Updated Teacher Name',
        branch: 'CSE',
        year: '1',
        semester: '1',
        subject: targetPdf.subject,
        pdf_title: newTitle,
        description: 'Updated description details',
        status: 'Approved'
      })
    });

    console.log('Update Response Status:', updateRes.status);
    console.log('Update Response Body:', await updateRes.json());

  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

runTest();
