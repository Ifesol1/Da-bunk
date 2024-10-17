import React, { useEffect, useRef } from 'react';

const Step2 = ({ nextStep, prevStep, role }) => {
    const localConnection = useRef(null);
    const remoteConnection = useRef(null);

    useEffect(() => {
        localConnection.current = new RTCPeerConnection();
        remoteConnection.current = new RTCPeerConnection();

        console.log(`You are the ${role === 'offerer' ? 'Offerer' : 'Answerer'}.`);

        localConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Local ICE candidate:', event.candidate);
            }
        };

        remoteConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Remote ICE candidate:', event.candidate);
            }
        };
    }, [role]);

    return (
        <div>
            <h1>Step 2: Set Up Peer Connections</h1>
            <p>Connections initialized. Now let's move on to offer/answer creation.</p>

            <button onClick={prevStep}>Back</button>
            <button onClick={nextStep} style={{ marginLeft: '10px' }}>Next</button>
        </div>
    );
};

export default Step2;
