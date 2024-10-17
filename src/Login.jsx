import React, { useState } from 'react';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');  // State to handle error messages
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');  // Clear previous errors
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/home');
        } catch (error) {
            handleAuthError(error);  // Handle error based on code
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        setError('');  // Clear previous errors
        try {
            await signInWithPopup(auth, provider);
            navigate('/home');
        } catch (error) {
            handleAuthError(error);  // Handle error based on code
        }
    };

    // Function to handle and display specific error messages
    const handleAuthError = (error) => {
        if (error.code === 'auth/user-not-found') {
            setError('No account found with this email.');
        } else if (error.code === 'auth/wrong-password') {
            setError('Incorrect password. If you signed up with Google, please use the "Login with Google" button.');
        } else if (error.code === 'auth/invalid-email') {
            setError('Invalid email format.');
        } else {
            setError('Error logging in: ' + error.message);
        }
    };

    return (
        <div>
            <h2>Login</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}  {/* Display error message if any */}
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                />
                <button type="submit">Login</button>
            </form>

            <h4>Or Login with Google:</h4>
            <button onClick={handleGoogleLogin}>Login with Google</button>
        </div>
    );
};

export default Login;
