import React, { useState } from 'react';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const availableTags = ['React', 'Firebase', 'CSS', 'Node', 'Flutter'];

    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            // Sign up user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update profile with the username
            await updateProfile(user, {
                displayName: username,
            });

            // Save selected tags (you can save them in Firestore or another database)
            console.log('Selected Tags:', selectedTags);

            // Navigate to home page
            navigate('/home');
        } catch (error) {
            // Display error message based on Firebase error codes
            if (error.code === 'auth/email-already-in-use') {
                setErrorMessage('Email already in use.');
            } else if (error.code === 'auth/invalid-email') {
                setErrorMessage('Invalid email address.');
            } else if (error.code === 'auth/weak-password') {
                setErrorMessage('Password should be at least 6 characters.');
            } else {
                setErrorMessage('Error signing up: ' + error.message);
            }
        }
    };

    const handleGoogleSignUp = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            navigate('/home');
        } catch (error) {
            console.error('Error with Google Auth:', error);
            setErrorMessage('Error with Google Sign Up: ' + error.message);
        }
    };

    const toggleTag = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    return (
        <div>
            <h2>Sign Up</h2>
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>} {/* Display error message */}
            <form onSubmit={handleSignUp}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                />
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

                <h4>Select Tags:</h4>
                <div>
                    {availableTags.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            className={selectedTags.includes(tag) ? 'selected' : ''}
                            onClick={() => toggleTag(tag)}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                <button type="submit">Sign Up</button>
            </form>

            <h4>Or Sign Up with Google:</h4>
            <button onClick={handleGoogleSignUp}>Sign Up with Google</button>
        </div>
    );
};

export default SignUp;
