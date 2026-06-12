const supabase = require('../config/supabase');

async function testJsFilter() {
  try {
    const branch = 'CSE';
    const year = '1';
    const semester = '1';

    let query = supabase.from('subjects').select('*');
    query = query.eq('year', year);
    query = query.eq('semester', semester);

    const { data, error } = await query;
    if (error) throw error;

    let filtered = data;
    if (branch) {
      filtered = data.filter(sub => {
        if (!sub.branch) return false;
        if (sub.branch.startsWith(',') && sub.branch.endsWith(',')) {
          return sub.branch.split(',').filter(Boolean).includes(branch);
        }
        return sub.branch === branch;
      });
    }

    console.log('Filtered subjects using JS logic:', filtered);
  } catch (err) {
    console.error('JS filtering failed:', err.message);
  }
}

testJsFilter();
