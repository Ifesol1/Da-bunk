import React, { useEffect, useState } from "react";
import { collection, onSnapshot, setDoc, doc } from "firebase/firestore";
import { firestore } from "../firebase";
import { useParams, useLocation } from "react-router-dom";

const ChatScreen = () => {
    const { roomId } = useParams(); // Get the roomId from the URL
    const location = useLocation();
    const username = location.state?.username; // Extract username from the previous route
    const [members, setMembers] = useState([]); // State to keep track of room members

    useEffect(() => {
        const membersRef = collection(firestore, `rooms/${roomId}/members`);

        // Listen for new members being added to the room
        const unsubscribe = onSnapshot(membersRef, (snapshot) => {
            const newMembers = snapshot.docs.map(doc => doc.data().username);
            setMembers(newMembers);
        });

        return () => {
            unsubscribe(); // Clean up the listener on unmount
        };
    }, [roomId]);

    const handleSendMessage = async (message) => {
        const messagesRef = collection(firestore, `rooms/${roomId}/messages`);
        const newMessage = {
            username,
            content: message,
            timestamp: new Date(),
        };
        await setDoc(doc(messagesRef), newMessage);
    };

    return (
        <div>
            <h1>Room: {roomId}</h1>
            <h2>Username: {username}</h2>

            {/* Chat UI */}
            <div className="chat-container">
                <div className="members-list">
                    <h3>Members in Room:</h3>
                    <ul>
                        {members.map((member, index) => (
                            <li key={index}>{member}</li>
                        ))}
                    </ul>
                </div>

                {/* Chat input */}
                <div className="message-input">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        onKeyPress={(e) => {
                            if (e.key === "Enter" && e.target.value.trim()) {
                                handleSendMessage(e.target.value);
                                e.target.value = ""; // Clear the input field
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatScreen;
