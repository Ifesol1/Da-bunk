import React, { useEffect, useState } from 'react';
import { auth } from './firebase'; // Assuming Firebase is configured in this file
import { useNavigate } from 'react-router-dom';
import { PreJoin } from '@livekit/components-react'; // Import PreJoin from LiveKit
import { v4 as uuidv4 } from 'uuid'; // Import UUID
import { BiImageAdd } from 'react-icons/bi'; // For image icon
import { FaRandom } from 'react-icons/fa'; // For random icon

const Prelive = () => {
    const [username, setUsername] = useState('');
    const navigate = useNavigate();
    const [roomName, setRoomName] = useState(uuidv4()); // Generate a UUID as the room name
    const [title, setTitle] = useState(''); // Title of the livestream
    const [maxParticipants, setMaxParticipants] = useState(''); // Max number of participants
    const [thumbnail, setThumbnail] = useState(null); // Thumbnail image

    // Fetch current user details and set username using Firebase Auth
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                // Set the user's display name or email as the username
                setUsername(user.displayName || user.email);
            } else {
                // Redirect to login if not authenticated
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // Handle joining a stream (get a token and redirect to the room)
    const handleJoinMeeting = async (values) => {
        try {
            // Step 1: Send room metadata including title and max participants
            const response1 = await fetch(`http://localhost:3000/createRoom`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomName,
                    metadata: {
                        title: title,
                        roles: [{ username: username, role: 'host' }]
                    },
                    numOfParticipants: maxParticipants === 'unlimited' ? undefined : maxParticipants
                })
            });

            // Step 2: Check if the room creation was successful
            if (!response1.ok) {
                throw new Error(`Room creation failed: ${response1.statusText}`);
            }

            const data = await response1.json();
            console.log(data);

            // Step 3: Fetch the token for the room only after successful room creation
            const response2 = await fetch(`http://localhost:3000/getToken?room=${roomName}&username=${username}`);
            if (!response2.ok) {
                throw new Error(`Token fetch failed: ${response2.statusText}`);
            }

            const token = await response2.text();

            // Step 4: Navigate after receiving the token
            navigate(`/livestream/${roomName}`, { state: { token, username } });
        } catch (error) {
            console.error('Error joining stream:', error);
        }
    };


    // Handle thumbnail image selection
    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setThumbnail(URL.createObjectURL(file)); // Show the thumbnail preview
        }
    };

    // Handle generating a random thumbnail
    const handleRandomThumbnail = () => {
        // Example random image logic (you can replace it with a real API call)
        const randomImage = 'https://source.unsplash.com/random/400x200';
        setThumbnail(randomImage);
    };
    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gray-900 text-white">
            <div className="w-full max-w-5xl p-8 bg-gray-800 rounded-lg shadow-lg space-y-6 mx-4">
                <h2 className="text-3xl font-semibold text-center">Livestream Setup</h2>

                {/* Username Field */}
                <div className="w-full">
                    <label className="block text-sm mb-2">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 text-black rounded-md border border-gray-300"
                        placeholder="Enter your username"
                    />
                </div>

                {/* Title Field */}
                <div className="w-full">
                    <label className="block text-sm mb-2">Livestream Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 text-black rounded-md border border-gray-300"
                        placeholder="Enter a title for your stream"
                    />
                </div>

                {/* Max Participants Field */}
                <div className="w-full">
                    <label className="block text-sm mb-2">Max Number of Participants</label>
                    <input
                        type="number"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(e.target.value)}
                        className="w-full px-3 py-2 text-black rounded-md border border-gray-300"
                        placeholder="Enter max number of participants or 'unlimited'"
                    />
                </div>

                {/* Thumbnail Upload */}
                <div className="space-y-2 w-full">
                    <label className="block text-sm">Thumbnail</label>
                    <div className="flex items-center space-x-4">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            className="hidden"
                            id="thumbnail-upload"
                        />
                        <label htmlFor="thumbnail-upload" className="flex items-center space-x-2 px-3 py-2 border border-blue-500 rounded-md cursor-pointer hover:bg-blue-500">
                            <BiImageAdd size={20} />
                            <span>Upload Thumbnail</span>
                        </label>
                        <button
                            onClick={handleRandomThumbnail}
                            className="flex items-center space-x-2 px-3 py-2 border border-green-500 rounded-md hover:bg-green-500"
                        >
                            <FaRandom size={20} />
                            <span>Choose for Me</span>
                        </button>
                    </div>

                    {/* Thumbnail Preview */}
                    {thumbnail && (
                        <div className="mt-4">
                            <img src={thumbnail} alt="Thumbnail Preview" className="w-full h-40 object-cover rounded-md" />
                        </div>
                    )}
                </div>

                {/* LiveKit PreJoin Component */}
                <div className="w-full">
                    <PreJoin
                        userLabel="Enter your name"
                        micLabel="Microphone"
                        camLabel="Camera"
                        joinLabel="Join Meeting"
                        onSubmit={handleJoinMeeting}
                        defaults={{ username: username }} // Prefill the username
                    />
                </div>
            </div>
        </div>
    );

};

export default Prelive;
