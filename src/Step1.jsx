import React from 'react';

const Step1 = ({ nextStep, setRole }) => {
    return (
        <div>
            <h1>Step 1: Select Your Role</h1>
            <p>Select if you are the person creating the offer (Offerer) or the person answering (Answerer).</p>

            <button onClick={() => { setRole('offerer'); nextStep(); }}>
                I am the Offerer (Client 1)
            </button>
            <button onClick={() => { setRole('answerer'); nextStep(); }} style={{ marginLeft: '10px' }}>
                I am the Answerer (Client 2)
            </button>
        </div>
    );
};

export default Step1;
