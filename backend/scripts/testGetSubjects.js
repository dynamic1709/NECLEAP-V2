const supabase = require('../config/supabase');

async function getSubjects() {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    console.log('All subjects in database:', data);
  } catch (err) {
    console.error('Error fetching subjects:', err.message);
  }
}

getSubjects();
