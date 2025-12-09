
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://adumjjzvxavxczlhomjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdW1qanp2eGF2eGN6bGhvbWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyODczOTIsImV4cCI6MjA4MDg2MzM5Mn0.nqXszenkrptzCo9RC1_rIAeBI8WVWkIUF31qVxSCxdg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    const email = 'yash@gmail.com';
    const password = 'Password123!';

    console.log(`Attempting to sign up user: ${email}`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error('Sign Up Error:', error.message);
        if (error.message.includes('already registered')) {
            console.log('User ALREADY EXISTS. Password reset required or try correct password.');
        }
    } else {
        console.log('Sign Up SUCCEEDED. User created.');
        if (data.user && !data.user.identities?.length) {
            console.log('WARNING: User created but identity missing (maybe duplicate email logic handled silently?) or needs confirmation.');
        } else {
            console.log('User ID:', data.user.id);
        }
    }
}

checkUser();
