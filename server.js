import express from 'express';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import cors from 'cors'; // Import cors

// LiveKit configuration
const livekitHost = 'wss://debate-ekfkwj0c.livekit.cloud';  // Replace with your LiveKit host
const livekitApiKey = "APIyEaYLoFU2Kpv";
const livekitApiSecret = "q0VKovJGwgwjQJlT5Mq4YfaqcqHlLVpmn05xBMGjPZR";

// Room service client
const roomService = new RoomServiceClient(livekitHost, livekitApiKey, livekitApiSecret);

// Function to create an access token
const createToken = async (participantName = 'quickstart-username', roomName = 'quickstart-room') => {
    const at = new AccessToken(livekitApiKey, livekitApiSecret, {
        identity: participantName,
        ttl: '10m',  // Token expires after 10 minutes
    });
    at.addGrant({ roomJoin: true, room: roomName });
    return await at.toJwt();
};

// Initialize Express
const app = express();
const port = 3000;
app.use(express.json());

// Enable CORS for all routes
app.use(cors());


// Endpoint to generate a token
app.get('/getToken', async (req, res) => {
    const participantName = req.query.username || 'quickstart-username';
    const roomName = req.query.room || 'quickstart-room';
    res.send(await createToken(participantName, roomName));
});

// Endpoint to create a new room
app.post('/createRoom', async (req, res) => {
    const { roomName = 'myroom', metadata, numOfParticipants = 20 } = req.body;

    const opts = {
        name: roomName,
        emptyTimeout: 10 * 60,  // 10 minutes timeout after all participants leave
        maxParticipants: Number(numOfParticipants),  // Use provided number or default to 20
        metadata: JSON.stringify(metadata)  // Store metadata such as title and roles
    };

    try {
        const room = await roomService.createRoom(opts);
        console.log(`Room '${roomName}' created successfully with metadata:`, opts.metadata);
        res.status(200).json({ message: 'Room created', room });
    } catch (error) {
        console.error(`Error creating room '${roomName}':`, error.message);
        res.status(500).json({ message: 'Error creating room', error: error.message });
    }
});
app.put('/updateRoomMetadata', async (req, res) => {
    const { roomName, metadata } = req.body;

    try {
        // Update room metadata using roomName and metadata string
        const updatedRoom = await roomService.updateRoomMetadata(roomName, metadata);
        res.status(200).json({ message: 'Room metadata updated successfully', room: updatedRoom });
    } catch (error) {
        console.error('Error updating room metadata:', error);
        res.status(500).json({ message: 'Error updating room metadata' });
    }
});

// Endpoint to list all rooms
app.get('/listRooms', async (req, res) => {
    try {
        const rooms = await roomService.listRooms();
        console.log(`Rooms listed successfully.`);
        res.status(200).json({ rooms });
    } catch (error) {
        console.log('Error listing rooms:', error.message);
        res.status(500).json({ message: 'Error listing rooms', error });
    }
});

// Endpoint to delete a room
app.delete('/deleteRoom', async (req, res) => {
    const roomName = req.query.room;
    if (!roomName) {
        return res.status(400).json({ message: 'Room name is required' });
    }
    try {
        await roomService.deleteRoom(roomName);
        console.log(`Room '${roomName}' deleted successfully.`);
        res.status(200).json({ message: 'Room deleted' });
    } catch (error) {
        console.log(`Error deleting room '${roomName}':`, error.message);
        res.status(500).json({ message: 'Error deleting room', error });
    }
});

// Endpoint to list participants in a room
app.get('/listParticipants', async (req, res) => {
    const roomName = req.query.room;
    try {
        const participants = await roomService.listParticipants(roomName);

        res.status(200).json({ participants });
    } catch (error) {
        console.error(`Error listing participants in room '${roomName}':`, error.message);
        res.status(500).json({ message: 'Error listing participants', error });
    }
});

// Endpoint to update participant permissions (e.g., promote to speaker)
app.put('/updateParticipant', async (req, res) => {
    const { room, identity, canPublish } = req.query;
    try {
        await roomService.updateParticipant(room, identity, undefined, {
            canPublish: canPublish === 'true',
            canSubscribe: true,
            canPublishData: true,
        });
        res.status(200).json({ message: 'Participant updated' });
    } catch (error) {
        console.error(`Error updating participant '${identity}' in room '${room}':`, error.message);
        console.error(`Available participants are ${ await roomService.listParticipants(room) }`);
        res.status(500).json({ message: 'Error updating participant', error });
    }
});

// Endpoint to remove a participant
app.delete('/removeParticipant', async (req, res) => {
    const { room, identity } = req.query;
    try {
        await roomService.removeParticipant(room, identity);
        res.status(200).json({ message: 'Participant removed' });
    } catch (error) {
        console.error(`Error removing participant '${identity}' from room '${room}':`, error.message);
        res.status(500).json({ message: 'Error removing participant', error });
    }
});

// Endpoint to mute/unmute a participant's track
app.put('/muteParticipant', async (req, res) => {
    const { room, identity, trackSid, mute } = req.query;
    try {
        await roomService.mutePublishedTrack(room, identity, trackSid, mute === 'true');
        res.status(200).json({ message: `Track ${mute === 'true' ? 'muted' : 'unmuted'}` });
    } catch (error) {
        console.error(`Error muting/unmuting track '${trackSid}' for participant '${identity}' in room '${room}':`, error.message);
        res.status(500).json({ message: 'Error muting/unmuting track', error });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
