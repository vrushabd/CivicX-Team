
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://adumjjzvxavxczlhomjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdW1qanp2eGF2eGN6bGhvbWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyODczOTIsImV4cCI6MjA4MDg2MzM5Mn0.nqXszenkrptzCo9RC1_rIAeBI8WVWkIUF31qVxSCxdg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    const email = 'civicx.test.user.' + Date.now() + '@gmail.com';
    const password = 'Password123!';

    console.log(`Attempting to sign up user: ${email}`);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        console.error('Sign Up Error:', signUpError);
        return;
    }

    console.log('Sign Up Successful:', signUpData.user ? signUpData.user.id : 'No user object?');

    console.log('Attempting to sign in with WRONG credentials...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email, // Valid email from above
        password: 'WrongPassword123!',
    });

    if (signInError) {
        console.error('Sign In Error details:', JSON.stringify(signInError, null, 2));
        console.log('Error Code:', signInError.code);
        console.log('Error Message:', signInError.message);
    } else {
        console.log('Sign In somehow succeeded?');
    }
}

testLogin();
