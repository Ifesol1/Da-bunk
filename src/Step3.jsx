import React, { useState } from 'react';

const Step3 = ({ nextStep, prevStep, role, setPeerConnection, peerConnection }) => {
    const [localOffer, setLocalOffer] = useState('');
    const [remoteAnswer, setRemoteAnswer] = useState('');
    const [remoteOffer, setRemoteOffer] = useState('');
    const [localAnswer, setLocalAnswer] = useState('');
    const [copied, setCopied] = useState(false);

    const servers = {
        iceServers: [
            {
                urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
            },
        ],
        iceCandidatePoolSize: 10,
    };    const createPeerConnection = () => {
        const pc = new RTCPeerConnection(servers);

        // Monitor the ICE connection state change
        pc.addEventListener('iceconnectionstatechange', () => {
            console.log('ICE Connection State:', pc.iceConnectionState);

            if (pc.iceConnectionState === 'connected') {
                console.log('Peer connection successful.');
            } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                console.error('Peer connection failed.');
            }
        });

        setPeerConnection(pc); // Store connection instance in App component
        return pc;
    };

    // Offerer creates the offer
    const createOffer = async () => {
        try {
            const pc = createPeerConnection();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            setLocalOffer(JSON.stringify(offer));
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    };

    // Offerer sets the remote answer provided by the answerer
    const handleRemoteAnswer = async () => {
        try {
            const answer = JSON.parse(remoteAnswer); // Answer provided by the Answerer
            if (peerConnection) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                console.log('Remote answer successfully set.');
            } else {
                console.error('No peer connection found.');
            }
        } catch (error) {
            console.error('Error setting remote answer:', error);
        }
    };

    // Answerer inputs offer, creates answer
    const handleOffer = async () => {
        try {
            const pc = createPeerConnection();
            const offer = JSON.parse(remoteOffer); // Offer provided by the Offerer
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            setLocalAnswer(JSON.stringify(answer)); // Set the answer directly
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    };

    // Copy function for clipboard
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div>
            <h1>Step 3: {role === 'offerer' ? 'Create Offer' : 'Input Offer & Create Answer'}</h1>

            {role === 'offerer' ? (
                <div>
                    <button onClick={createOffer}>Create Offer</button>
                    <textarea
                        value={localOffer}
                        readOnly
                        placeholder="Offer will appear here..."
                        style={{ width: '100%', height: '100px', marginTop: '10px' }}
                    />
                    <button
                        onClick={() => copyToClipboard(localOffer)}
                        disabled={!localOffer} // Disable if no offer is generated yet
                        style={{ marginTop: '10px' }}
                    >
                        {copied ? 'Copied!' : 'Copy Offer'}
                    </button>
                    <p>Copy and share this offer with the Answerer.</p>

                    <textarea
                        value={remoteAnswer}
                        onChange={(e) => setRemoteAnswer(e.target.value)}
                        placeholder="Paste the answer here..."
                        style={{ width: '100%', height: '100px', marginTop: '10px' }}
                    />
                    <button
                        onClick={handleRemoteAnswer}
                        disabled={!remoteAnswer} // Disable if no answer is provided yet
                        style={{ marginTop: '10px' }}
                    >
                        Set Remote Answer
                    </button>
                    <p>Paste the answer from the Answerer here to complete the connection.</p>
                </div>
            ) : (
                <div>
                    <textarea
                        value={remoteOffer}
                        onChange={(e) => setRemoteOffer(e.target.value)}
                        placeholder="Paste the offer here..."
                        style={{ width: '100%', height: '100px' }}
                    />
                    <button onClick={handleOffer} style={{ marginTop: '10px' }}>
                        Create Answer
                    </button>
                    <textarea
                        value={localAnswer}
                        readOnly
                        placeholder="Answer will appear here..."
                        style={{ width: '100%', height: '100px', marginTop: '10px' }}
                    />
                    <button
                        onClick={() => copyToClipboard(localAnswer)}
                        disabled={!localAnswer} // Disable if no answer is generated yet
                        style={{ marginTop: '10px' }}
                    >
                        {copied ? 'Copied!' : 'Copy Answer'}
                    </button>
                    <p>Copy and share this answer with the Offerer.</p>
                </div>
            )}

            <button onClick={prevStep} style={{ marginTop: '20px' }}>Back</button>
            <button onClick={nextStep} style={{ marginLeft: '10px', marginTop: '20px' }}>Next</button>
        </div>
    );
};

export default Step3;
