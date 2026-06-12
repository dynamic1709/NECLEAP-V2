const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes('YOUR-PASSWORD')) {
  console.error('Error: DATABASE_URL is missing or placeholder. Cannot update database policies.');
  process.exit(1);
}

async function fixRlsPolicies() {
  console.log('Connecting to database to update RLS policies...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully!');

    // SQL statements to drop existing policies and create updated ones
    const sql = `
      -- 1. Subjects RLS Policies Update
      DROP POLICY IF EXISTS "Super admin can manage subjects" ON subjects;
      DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;

      -- Allow both super_admin and teacher_admin profiles to manage subjects
      CREATE POLICY "Admins can manage subjects" ON subjects 
      FOR ALL 
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super_admin', 'teacher_admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super_admin', 'teacher_admin')
        )
      );

      -- 2. PDFs RLS Policies Update
      DROP POLICY IF EXISTS "Super admin can view all PDFs" ON pdfs;
      DROP POLICY IF EXISTS "Super admin can update any PDF" ON pdfs;
      DROP POLICY IF EXISTS "Super admin and owner can delete PDF" ON pdfs;
      DROP POLICY IF EXISTS "Users can delete their own PDFs or Super Admin" ON pdfs;
      DROP POLICY IF EXISTS "Admins can view all PDFs" ON pdfs;
      DROP POLICY IF EXISTS "Admins can update any PDF" ON pdfs;
      DROP POLICY IF EXISTS "Admins or owners can delete PDFs" ON pdfs;

      -- Allow admins/teachers to see all PDFs in admin view
      CREATE POLICY "Admins can view all PDFs" ON pdfs 
      FOR SELECT 
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super_admin', 'teacher_admin')
        )
      );

      -- Allow admins/teachers to update any PDF (e.g. status)
      CREATE POLICY "Admins can update any PDF" ON pdfs 
      FOR UPDATE 
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super_admin', 'teacher_admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super_admin', 'teacher_admin')
        )
      );

      -- Allow owner or admins to delete a PDF
      CREATE POLICY "Admins or owners can delete PDFs" ON pdfs 
      FOR DELETE 
      TO authenticated
      USING (
        auth.uid() = uploaded_by OR 
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super_admin', 'teacher_admin')
        )
      );
    `;

    console.log('Executing RLS Policy Update Query...');
    await client.query(sql);
    console.log('RLS Policies successfully updated to allow teacher_admin role!');

  } catch (err) {
    console.error('Error updating RLS policies:', err.message);
  } finally {
    await client.end();
  }
}

fixRlsPolicies();
