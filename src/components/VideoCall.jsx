import React, { useEffect, useRef, useState } from "react";
import { doc, setDoc, onSnapshot, collection, getDocs, addDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import { useParams, useLocation } from "react-router-dom";

const servers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }, // Google STUN server
    ],
};

const VideoCall = () => {
    const [role, setRole] = useState("presenter");
    const [pc, setPc] = useState(null);
    const userVideo = useRef();
    const partnerVideo = useRef();
    const { roomId } = useParams();
    const location = useLocation();
    const username = location.state?.username;

    useEffect(() => {
        const initWebRTC = async () => {

            // Create a new peer connection


            // Get user media
            const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            userVideo.current.srcObject = localStream;

            // Add local stream tracks to peer connection

            // Listen for remote stream tracks

        };

        initWebRTC();
    }, [roomId]);
    const handleJoinCall = async () => {
        const membersRef = collection(firestore, `rooms/${roomId}/members`);
        const userDocRef = doc(membersRef, username);

        // Add user with their role (presenter/spectator) to the "members" collection
        await setDoc(userDocRef, { username, role });
        const offersRef = collection(firestore, `rooms/${roomId}/members/${username}/queuedOffers`);
        const answersRef = collection(firestore, `rooms/${roomId}/members/${username}/queuedAnswers`);

        // Create document references with the ID "temp"
        const offerDocRef = doc(offersRef, "temp");
        const answerDocRef = doc(answersRef, "temp");

        // Add the offer and answer documents with empty data
        await setDoc(offerDocRef, {});
        await setDoc(answerDocRef, {});

        const peerConnection = new RTCPeerConnection(servers);
        setPc(peerConnection);

        // Get user media
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        userVideo.current.srcObject = localStream;

        // Add local stream tracks to peer connection
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // Create an offer
        const offerDescription = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offerDescription);

        // Send offer to all presenters if user is a spectator
        const membersSnapshot = await getDocs(membersRef);
        membersSnapshot.forEach(async (docSnapshot) => {
            const memberData = docSnapshot.data();
            if (role === "spectator" && memberData.role === "presenter") {
                // Create a queuedOffer subcollection under the presenter's document
                await addDoc(collection(firestore, `rooms/${roomId}/members/${docSnapshot.id}/queuedOffers`), {
                    offer: offerDescription,
                    from: username,
                });
            }
        });

        // Listen for queued offers from presenters
        onSnapshot(collection(firestore, `rooms/${roomId}/members/${username}/queuedOffers`), async (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === "added" && change.doc.id !== "temp") {
                    const offerData = change.doc.data();
                    const offerDescription = new RTCSessionDescription(offerData.offer);

                    // Set the remote offer as the remote description
                    await peerConnection.setRemoteDescription(offerDescription);

                    // Create an answer
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);

                    // Save the answer back to Firestore in the presenter's queuedAnswers
                    await addDoc(collection(firestore, `rooms/${roomId}/members/${offerData.from}/queuedAnswers`), {
                        answer, // Store the serialized answer
                        from: username
                    });

                    console.log("Answer created and saved:", username);
                }
            });
        });

        // Listen for queued answers for the current user
        onSnapshot(collection(firestore, `rooms/${roomId}/members/${username}/queuedAnswers`), async (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === "added" && change.doc.id !== "temp") {
                    const answerData = change.doc.data();
                    const answerDescription = new RTCSessionDescription(answerData.answer);
                    await peerConnection.setRemoteDescription(answerDescription);
                    console.log("Answer received and applied:", username);
                }
            });
        });
    };


    return (
        <div>
            <h1>Room: {roomId}</h1>
            <h2>Username: {username}</h2>
            <div>
                <label>
                    Join as:
                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="presenter">Presenter</option>
                        <option value="spectator">Spectator</option>
                    </select>
                </label>
            </div>
            <div>
                <video ref={userVideo} autoPlay muted />
                <video ref={partnerVideo} autoPlay />
            </div>
            <button onClick={handleJoinCall}>Join Call</button>
        </div>
    );
};

export default VideoCall;
