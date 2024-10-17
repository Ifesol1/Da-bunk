import React, { useState, useEffect } from 'react';

const Step4 = ({ nextStep, prevStep, role, peerConnection }) => {
    const [localICE, setLocalICE] = useState('');
    const [remoteICE, setRemoteICE] = useState('');
    const [iceCandidatesList, setIceCandidatesList] = useState([]); // Store multiple ICE candidates

    useEffect(() => {
        if (!peerConnection) {
            console.error('No peer connection found.');
            return;
        } else {
            console.log('Peer connection in Step 4:', peerConnection);
        }

        // Monitor ICE gathering state
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('New ICE candidate generated:', event.candidate);
                setIceCandidatesList((prev) => [...prev, event.candidate]);

                // Display the most recent ICE candidate
                setLocalICE(JSON.stringify(event.candidate));
            } else {
                console.log('All ICE candidates have been generated.');
            }
        };

        peerConnection.addEventListener('iceconnectionstatechange', () => {
            console.log('ICE Connection State:', peerConnection.iceConnectionState);
        });

    }, [peerConnection]);

    // Function to add the remote ICE candidate to the peer connection
    const addRemoteICECandidate = async () => {
        if (remoteICE) {
            try {
                const candidate = new RTCIceCandidate(JSON.parse(remoteICE));
                await peerConnection.addIceCandidate(candidate);
                console.log('Remote ICE candidate added successfully');
            } catch (error) {
                console.error('Error adding remote ICE candidate:', error);
            }
        }
    };

    return (
        <div>
            <h1>Step 4: Exchange ICE Candidates</h1>

            <button onClick={() => console.log('Logging ICE Candidates:', iceCandidatesList)}>
                Log ICE Candidates
            </button>

            {/* Display the local ICE candidate */}
            <textarea
                value={localICE}
                readOnly
                placeholder="Local ICE candidate will appear here..."
                style={{ width: '100%', height: '100px', marginTop: '10px' }}
            />
            <p>Copy and share this ICE candidate with the other peer.</p>

            {/* Input for remote ICE candidate */}
            <textarea
                value={remoteICE}
                onChange={(e) => setRemoteICE(e.target.value)}
                placeholder="Paste the other peer's ICE candidate here..."
                style={{ width: '100%', height: '100px', marginTop: '10px' }}
            />
            <button
                onClick={addRemoteICECandidate}
                disabled={!remoteICE}
                style={{ marginTop: '10px' }}
            >
                Add Remote ICE Candidate
            </button>

            <button onClick={prevStep} style={{ marginTop: '20px' }}>
                Back
            </button>
            <button onClick={nextStep} style={{ marginLeft: '10px', marginTop: '20px' }}>
                Next
            </button>
        </div>
    );
};

export default Step4;
