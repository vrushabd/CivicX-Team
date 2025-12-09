
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://adumjjzvxavxczlhomjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdW1qanp2eGF2eGN6bGhvbWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyODczOTIsImV4cCI6MjA4MDg2MzM5Mn0.nqXszenkrptzCo9RC1_rIAeBI8WVWkIUF31qVxSCxdg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    const email = 'yash@gmail.com';
    const password = 'Password123!';

    console.log(`[TEST 1] Attempting to SIGN IN: ${email}`);
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: 'WrongPasswordByIntent',
    });

    if (signInError) {
        console.log('SignIn Result:', signInError.message);
        console.log('SignIn Code:', signInError.code);
    } else {
        console.log('SignIn Result: SUCCESS (Unexpected)');
    }

    const testEmail = `yash.test.${Date.now()}@gmail.com`;
    console.log(`\n[TEST 2] Attempting to SIGN UP: ${testEmail}`);
    const { error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password,
    });

    if (signUpError) {
        console.log('SignUp Result:', signUpError.message);
    } else {
        console.log('SignUp Result: SUCCESS');
    }
}

checkUser();
