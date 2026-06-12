const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_supabase_url_here')) {
  console.error('Error: Please fill in your real SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env before running this script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedAdmin() {
  console.log('Attempting to create admin account in Supabase Auth...');
  
  try {
    const email = 'necleap@gmail.com';
    const password = 'necleap@123';
    
    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: 'System Admin',
          role: 'super_admin'
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`User ${email} is already registered in Supabase Auth.`);
      } else {
        throw authError;
      }
    } else {
      console.log('Admin user signed up successfully in Supabase Auth!');
    }

    // Double check profiles entry (it is created by database trigger, but let's make sure it is super_admin)
    console.log('Verifying profiles role configuration...');
    
    const userId = authData?.user?.id;
    if (userId) {
      // Check if profile exists
      const { data: profileCheck, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking profile:', checkError.message);
      } else if (!profileCheck) {
        console.log('Profile row not found in profiles table. Creating profile row...');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            name: 'System Admin',
            email: email,
            role: 'super_admin'
          });

        if (insertError) {
          console.warn('Could not insert profile row (likely due to RLS). Ensure SQL schema is run.');
        } else {
          console.log('Profile row successfully created as super_admin.');
        }
      } else {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'super_admin' })
          .eq('id', userId);

        if (updateError) {
          console.warn('Could not update profiles table role to super_admin.');
        } else {
          console.log('Forced profiles table role to super_admin.');
        }
      }
    } else {
      // If user was already signed up, find user id and update role
      console.log('Finding existing user to verify super_admin role...');
      
      // Let's attempt to sign in to fetch user id
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (!signInError && signInData?.user) {
        // Check if profile exists
        const { data: profileCheck, error: checkError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking profile:', checkError.message);
        } else if (!profileCheck) {
          console.log('Profile row not found in profiles table. Creating profile row...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: signInData.user.id,
              name: 'System Admin',
              email: email,
              role: 'super_admin'
            });

          if (insertError) {
            console.error('Failed to create profile row:', insertError.message);
          } else {
            console.log('Profile row successfully created as super_admin.');
          }
        } else {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ role: 'super_admin' })
            .eq('id', signInData.user.id);
            
          if (profileError) {
            console.warn('Could not update role. Ensure RLS policies permit update:');
            console.log(`UPDATE profiles SET role = 'super_admin' WHERE email = '${email}';`);
          } else {
            console.log('Profile successfully configured as super_admin.');
          }
        }
      }
    }

    console.log('\nSetup finished! You can now log in using necleap@gmail.com / necleap@123.');

  } catch (error) {
    console.error('Error seeding admin account:', error.message);
  }
}

seedAdmin();
