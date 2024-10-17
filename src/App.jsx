import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignUp from './SignUp';
import Login from './Login';
import Home from './Home';
import Livestream from './Livestream'; // Import the Livestream component
import Prelive from './prelive';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/home" element={<Home />} />

                <Route path="/prelive/" element={<Prelive />} />
                <Route path="/livestream/:roomName" element={<Livestream />} /> {/* Fixed: added roomName parameter */}
            </Routes>
        </Router>
    );
};

export default App;
