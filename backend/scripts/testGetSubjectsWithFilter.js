const supabase = require('../config/supabase');

async function testQuery() {
  try {
    const branch = 'CSE';
    const year = '1';
    const semester = '1';

    let query = supabase.from('subjects').select('*');
    query = query.or(`branch.eq.${branch},branch.ilike.%,${branch},%`);
    query = query.eq('year', year);
    query = query.eq('semester', semester);

    const { data, error } = await query;
    if (error) throw error;

    console.log(`Query results for branch=${branch}, year=${year}, sem=${semester}:`, data);
  } catch (err) {
    console.error('Query failed:', err.message);
  }
}

testQuery();
