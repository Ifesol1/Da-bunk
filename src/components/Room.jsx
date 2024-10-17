// src/components/Room.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // useNavigate instead of useHistory

const Room = () => {
    const [roomId, setRoomId] = useState("");
    const [username, setUsername] = useState(""); // New state for username
    const navigate = useNavigate(); // Updated hook

    const handleJoinRoom = () => {
        if (roomId && username) {
            // Navigate to the room with username in the state
            navigate(`/room/${roomId}`, { state: { username } });
        }
    };

    const handleCreateRoom = () => {
        if (username) {
            const newRoomId = Math.random().toString(36).substring(2, 7);
            // Navigate to the newly created room with username in the state
            navigate(`/room/${newRoomId}`, { state: { username } });
        }
    };

    return (
        <div>
            <h1>Create or Join a Room</h1>
            <input
                type="text"
                placeholder="Enter Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
            />
            <button onClick={handleJoinRoom}>Join Room</button>
            <button onClick={handleCreateRoom}>Create Room</button>
        </div>
    );
};

export default Room;
