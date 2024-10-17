import React, { useEffect, useState } from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {
    LiveKitRoom,
    RoomAudioRenderer,
    ControlBar,
    GridLayout,
    ParticipantTile,
    useTracks,
    useParticipants,
    Chat,
    LayoutContextProvider,
    ParticipantName,
    useRoomInfo,ChatEntry,useChat,ConnectionState,useConnectionState,
} from '@livekit/components-react';

import { Track } from 'livekit-client';
import '@livekit/components-styles';

const Livestream = () => {
    const location = useLocation();
    const {roomName} = useParams();

    const {token, username} = location.state || {};
    const serverUrl = 'wss://debate-ekfkwj0c.livekit.cloud';



    return (
        <LiveKitRoom
            video={true}
            audio={true}
            token={token}
            serverUrl={serverUrl}
            data-lk-theme="default"
            style={{ height: '100vh', display: 'flex' }}
        >
            <Disconnected roomName={roomName}/>

            <ChatContent username={username} roomName={roomName} />


            {/* Video conference */}
            <MyVideoConference />
            <RoomContent username={username} roomName={roomName} />

            {/* Handle the room-wide audio */}
            <RoomAudioRenderer />
            <ConnectionState />

            {/* Control Bar */}
            <ControlBar />
        </LiveKitRoom>
    );
};
const Disconnected = ({  roomName }) => {

    const connectionState = useConnectionState();
    const navigate = useNavigate();
    console.log(roomName,connectionState)

    if (connectionState === 'disconnected'){
        navigate('/home')
    }

}

const ChatContent = ({ username, roomName }) => {
    const { send, chatMessages, isSending } = useChat();  // useChat inside the LiveKitRoom context
    const [message, setMessage] = useState('');

    const handleSendMessage = async () => {
        if (message.trim()) {
            try {
                await send(username + ": " + message);
                setMessage('');  // Clear input after sending
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col flex-3 h-full p-4"> {/* Added padding here */}
            <div className="flex-1 overflow-y-auto p-2"> {/* Added padding here */}
                {/* Display chat messages */}
                {chatMessages.map((msg, index) => (
                    <div key={index} className="mb-2"> {/* Added margin-bottom here for spacing between messages */}
                        <ChatEntry
                            entry={msg}
                            hideName={true}
                            hideTimestamp={true}
                        />
                    </div>
                ))}
            </div>

            {/* Input box to send a new message */}
            <div className="flex p-2">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="flex-1 mr-2 p-3 border border-gray-300 rounded" // Adjusted padding here
                />
                <button
                    onClick={handleSendMessage}
                    disabled={isSending || !message.trim()}
                    className="bg-blue-500 text-white p-3 rounded disabled:bg-gray-300" // Adjusted padding here
                >
                    Send
                </button>
            </div>
        </div>
    );
};
const RoomContent = ({ username, roomName }) => {
    const [roles, setRoles] = useState([]);
    const [isHostOrCoHost, setIsHostOrCoHost] = useState(false);
    const [participantsLoaded, setParticipantsLoaded] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isHost, setIsHost] = useState(false);
    const [isCoHost, setIsCoHost] = useState(false);

    const participants = useParticipants(); // Get participants
    const {metadata} = useRoomInfo(); // Use room info to get metadata

    // Check if participants list is loaded and has more than 0 participants
    useEffect(() => {
        if (participants.length > 0) {
            setParticipantsLoaded(true); // Set flag once participants are loaded and list is not empty
        }
    }, [participants]);

    // Check roles and update participant permissions after metadata and participants are loaded
    useEffect(() => {
        // Early exit if metadata or participants haven't loaded yet
        if (!metadata || !participantsLoaded) return;

        // Parse the metadata and roles
        const parsedMetadata = JSON.parse(metadata || '{}');
        const fetchedRoles = parsedMetadata.roles || [];

        // Update roles in state
        setRoles(fetchedRoles);

        // Check if current user is a Host or Co-Host
        const isCurrentUserHost = fetchedRoles.some(
            (role) => role.username === username && role.role === 'host'
        );
        const isCurrentUserCoHost = fetchedRoles.some(
            (role) => role.username === username && role.role === 'co-host'
        );

        setIsHostOrCoHost(isCurrentUserHost || isCurrentUserCoHost);

        // If you need isHost specifically, define it here
        setIsHost(isCurrentUserHost);
        setIsCoHost(isCurrentUserCoHost);

        console.log(isHost);

        // Only update participant permissions if participants are loaded and non-empty
        if (participants.length > 0) {
            updateParticipantPermissions(username, isCurrentUserHost || isCurrentUserCoHost);
        }
    }, [metadata, participantsLoaded, participants, username,isHost]);


    const updateParticipantPermissions = async (identity, canPublish) => {
        try {
            const response = await fetch(
                `http://localhost:3000/updateParticipant?room=${roomName}&identity=${identity}&canPublish=${canPublish}`,
                {
                    method: 'PUT',
                }
            );

            if (response.ok) {
                console.log('Participant permissions updated');
            } else {
                const errorData = await response.json();
                console.error('Error updating participant permissions:', errorData.message);
            }
        } catch (error) {
            console.error('Error updating participant permissions:', error.message);
        }
    };

    const handleKick = async (identity) => {
        try {
            const response = await fetch(
                `http://localhost:3000/removeParticipant?room=${roomName}&identity=${identity}`,
                {
                    method: 'DELETE',
                }
            );

            if (response.ok) {
                console.log(`Participant ${identity} removed from room.`);
            } else {
                const errorData = await response.json();
                console.error(`Error removing participant: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error removing participant:', error.message);
        }
    };

    const handleTimeout = (identity) => {
        console.log(`Timeout ${identity}`);
        // Implement actual timeout functionality
    };

    const handlePromote = async (identity, newRole) => {
        try {
            // Update roles locally
            const parsedMetadata = metadata ? JSON.parse(metadata) : {};
            let rolesToUpdate = parsedMetadata.roles || [];

            const participant = rolesToUpdate.find((r) => r.username === identity);
            if (participant) {
                participant.role = newRole;
            } else {
                rolesToUpdate.push({username: identity, role: newRole});
            }

            // Convert updated metadata to a string and send to server
            const updatedMetadataString = JSON.stringify({...parsedMetadata, roles: rolesToUpdate});

            await updateMetadataOnServer(roomName, updatedMetadataString);

            // Update the local state
            setRoles(rolesToUpdate);

            console.log(`Participant ${identity} promoted to ${newRole}`);
        } catch (error) {
            console.error('Error promoting participant:', error.message);
        }
    };

    // Function to send updated metadata to the server
    const updateMetadataOnServer = async (roomName, updatedMetadataString) => {
        try {
            const response = await fetch('http://localhost:3000/updateRoomMetadata', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomName: roomName,
                    metadata: updatedMetadataString,
                }),
            });

            if (response.ok) {
                console.log('Metadata updated on the server');
            } else {
                const errorData = await response.json();
                console.error('Error updating metadata on server:', errorData.message);
            }
        } catch (error) {
            console.error('Error sending updated metadata to server:', error.message);
        }
    };

    // Filter participants by search term
    const filteredParticipants = participants.filter((participant) =>
        participant.identity.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
        <div className="flex flex-row flex-grow h-screen">
            {/* List of Participants */}
            <div className="flex-1 p-4 border-r border-gray-300 shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Participants</h2>

                {/* Search input */}
                <input
                    type="text"
                    placeholder="Search participants"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4 p-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />

                {/* Participant list */}
                {filteredParticipants.map((participant) => {
                    const participantRole = roles.find((r) => r.username === participant.identity)?.role || 'participant';

                    return (
                        <div key={participant.identity}
                             className="flex justify-between items-center mb-3 p-2 rounded-lg hover:bg-indigo-50 transition ease-in-out">
                            <div className="flex items-center space-x-2">
                                <span className="text-lg font-medium text-gray-800">{participant.identity}</span>
                                <span className="text-xs text-gray-500">({participantRole})</span>
                            </div>

                            {/* Actions for host/co-host */}
                            {isHostOrCoHost && participant.identity !== username && (
                                <div className="relative group">
                                    <button className="text-gray-500 hover:text-indigo-600 focus:outline-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                                             viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                  d="M6 12l6 6m0 0l6-6m-6 6V6"/>
                                        </svg>
                                    </button>

                                    {/* Dropdown menu */}
                                    <div
                                        className="absolute right-0 hidden group-hover:block border border-gray-200 bg-white rounded-lg shadow-lg p-2 space-y-1 z-10 w-36 text-sm">
                                        {/* Kick participant */}
                                        {(participantRole !== 'host' && participantRole !== 'co-host') && (
                                            <button
                                                className="flex items-center text-red-600 hover:bg-red-100 px-2 py-1 rounded transition-all"
                                                onClick={() => handleKick(participant.identity)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1"
                                                     fill="none"
                                                     viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                          d="M6 18L18 6M6 6l12 12"/>
                                                </svg>
                                                Kick
                                            </button>
                                        )}

                                        {/* Add/Remove roles based on permissions */}
                                        {isHost && participantRole === 'participant' && (
                                            <button
                                                className="flex items-center text-blue-500 hover:bg-blue-100 px-2 py-1 rounded transition-all"
                                                onClick={() => handlePromote(participant.identity, 'co-host')}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1"
                                                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                          strokeWidth="2" d="M5 13l4 4L19 7"/>
                                                </svg>
                                                Promote to Co-Host
                                            </button>
                                        )}

                                        {(isHost || isCoHost) && participantRole === 'participant' && (
                                            <button
                                                className="flex items-center text-green-500 hover:bg-green-100 px-2 py-1 rounded transition-all"
                                                onClick={() => handlePromote(participant.identity, 'admin')}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1"
                                                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                          strokeWidth="2" d="M5 13l4 4L19 7"/>
                                                </svg>
                                                Promote to Admin
                                            </button>
                                        )}

                                        {/* Remove Roles */}
                                        {participantRole === 'co-host' && isHost && (
                                            <button
                                                className="flex items-center text-red-500 hover:bg-red-100 px-2 py-1 rounded transition-all"
                                                onClick={() => handleRemoveRole(participant.identity, 'co-host')}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1"
                                                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                          strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                                </svg>
                                                Remove Co-Host
                                            </button>
                                        )}

                                        {participantRole === 'admin' && (isHost || isCoHost) && (
                                            <button
                                                className="flex items-center text-red-500 hover:bg-red-100 px-2 py-1 rounded transition-all"
                                                onClick={() => handleRemoveRole(participant.identity, 'admin')}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1"
                                                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                          strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                                </svg>
                                                Remove Admin
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

    function MyVideoConference() {
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false }
    );

    // Filter tracks where the participant can publish
    const filteredTracks = tracks.filter(track => track.participant.permissions?.canPublish === true);

    return (
        <GridLayout
            tracks={filteredTracks || []}
            style={{ height: 'calc(100vh - var(--lk-control-bar-height))' }}
        >
            <ParticipantTile />
        </GridLayout>
    );
}

export default Livestream;
