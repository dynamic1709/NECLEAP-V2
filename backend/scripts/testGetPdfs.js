const supabase = require('../config/supabase');

async function getPdfs() {
  try {
    const { data, error } = await supabase
      .from('pdfs')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    console.log('Latest PDFs in database:', data);
  } catch (err) {
    console.error('Error fetching PDFs:', err.message);
  }
}

getPdfs();
