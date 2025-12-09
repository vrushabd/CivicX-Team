
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://adumjjzvxavxczlhomjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdW1qanp2eGF2eGN6bGhvbWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyODczOTIsImV4cCI6MjA4MDg2MzM5Mn0.nqXszenkrptzCo9RC1_rIAeBI8WVWkIUF31qVxSCxdg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createVrushabh() {
    const email = 'vrushabh@gmail.com';
    const password = 'vrushabh';

    console.log(`Attempting to CREATE user: ${email} with password: ${password}`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error('Sign Up Error:', error.message);
        if (error.message.includes('already registered')) {
            console.log('User ALREADY EXISTS. Trying compatibility sign-in...');
            // Optional: Try sign in if it already exists to confirm password matches
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (signInError) {
                console.log('Sign In Failed: Password might be different.');
            } else {
                console.log('Sign In SUCCESS: User exists and password is correct.');
            }
        }
    } else {
        console.log('Sign Up SUCCEEDED. User created!');
        console.log('User ID:', data.user ? data.user.id : 'No ID returned');
    }
}

createVrushabh();
