const supabase = require('../config/supabase');

async function getProfiles() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) throw error;
    console.log('Profiles found in database:', data);
  } catch (err) {
    console.error('Error fetching profiles:', err.message);
  }
}

getProfiles();
