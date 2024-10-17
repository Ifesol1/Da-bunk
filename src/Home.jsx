import React, { useEffect, useState } from 'react';
import { auth } from './firebase'; // Assuming Firebase is configured in this file
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [username, setUsername] = useState('');
    const [livestreams, setLivestreams] = useState([]);
    const navigate = useNavigate();

    // Fetch current user details and set username using Firebase Auth
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUsername(user.displayName || user.email);
            } else {
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // Fetch available livestreams (rooms) from LiveKit backend
    useEffect(() => {
        const fetchLivestreams = async () => {
            try {
                const response = await fetch('http://localhost:3000/listRooms'); // Replace with your API URL
                const data = await response.json();
                setLivestreams(data.rooms);
                console.log(livestreams)
            } catch (error) {
                console.error('Error fetching livestreams:', error);
            }
        };

        fetchLivestreams();
    }, []);

    // Navigate to the Prelive screen before starting a stream
    const navigateToPrelive = () => {
        navigate(`/prelive`);
    };

    const handleStartStream = async () => {
        try {
            navigateToPrelive();
        } catch (error) {
            console.error('Error starting stream:', error);
        }
    };

    const handleJoinStream = async (roomName) => {
        const response = await fetch(`http://localhost:3000/getToken?room=${roomName}&username=${username}`);
        const token = await response.text();

        navigate(`/livestream/${roomName}`, { state: { token, username } });
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center flex-col">
            <header className="bg-indigo-600 text-white py-4 shadow-md">
                <div className="container mx-auto flex justify-between items-center px-6">
                    <h1 className="text-2xl font-bold">LiveStream Platform</h1>
                    <div className="flex items-center">
                        <span className="mr-4">Welcome, {username}!</span>
                        <button
                            onClick={() => { auth.signOut(); navigate('/login'); }}
                            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex flex-grow container mx-auto px-6 py-8">
                <aside className="w-1/4 bg-gray-100 p-6 rounded-lg shadow-md">
                    <ul className="space-y-4">
                        <li className="text-lg font-semibold">Home</li>
                        <li className="text-lg">Following</li>
                        <li className="text-lg">Categories</li>
                        <li className="text-lg">Settings</li>
                    </ul>
                </aside>

                <section className="w-3/4 pl-6">
                    <h2 className="text-2xl font-bold mb-6">Available Livestreams</h2>
                    {livestreams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {livestreams.map((stream) => (
                                <div className="bg-white p-4 rounded-lg shadow-md" key={stream.name}>
                                    <img
                                        src={`http://localhost:3000/thumbnail/${stream.name}`}
                                        alt={stream.name}
                                        className="w-full h-48 object-cover rounded-t-lg mb-4"
                                    />
                                    <div className="text-center">
                                        <h3 className="text-lg font-semibold mb-2">
                                            {stream.metadata ? (JSON.parse(stream.metadata)?.title || 'No title available') : 'No metadata'}
                                        </h3>
                                        <p className="text-gray-600 mb-4">Max Participants: {stream.maxParticipants}</p>
                                        <button
                                            onClick={() => handleJoinStream(stream.name)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded"
                                        >
                                            Join Stream
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600">No livestreams available</p>
                    )}
                </section>
            </main>

            <footer className="bg-gray-800 text-white py-4">
                <div className="container mx-auto text-center">
                    <button
                        onClick={handleStartStream}
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded"
                    >
                        Start Your Stream
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default Home;
