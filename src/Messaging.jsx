import { useRef, useState } from "react";
import { doc, setDoc, onSnapshot, collection, getDocs, addDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { firestore } from "./firebase";
import "./App.css";

// Initialize WebRTC
const servers = {
    iceServers: [
        {
            urls: [
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
            ],
        },
    ],
    iceCandidatePoolSize: 10,
};

const pc = new RTCPeerConnection(servers);

function App() {
    const [currentPage, setCurrentPage] = useState("home");
    const [joinCode, setJoinCode] = useState("");

    return (
        <div className="app">
            {currentPage === "home" ? (
                <Menu
                    joinCode={joinCode}
                    setJoinCode={setJoinCode}
                    setPage={setCurrentPage}
                />
            ) : (
                <Videos
                    mode={currentPage}
                    callId={joinCode}
                    setPage={setCurrentPage}
                />
            )}
        </div>
    );
}

function Menu({ joinCode, setJoinCode, setPage }) {
    return (
        <div className="home">
            <div className="create box">
                <button onClick={() => setPage("create")}>Create Call</button>
            </div>

            <div className="answer box">
                <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Join with code"
                />
                <button onClick={() => setPage("join")}>Answer</button>
            </div>
        </div>
    );
}

function Videos({ mode, callId, setPage }) {
    const [webcamActive, setWebcamActive] = useState(false);
    const [roomId, setRoomId] = useState(callId);
    const [micEnabled, setMicEnabled] = useState(true);
    const [camEnabled, setCamEnabled] = useState(true);  // For toggling camera
    const [sharingScreen, setSharingScreen] = useState(false);

    const localRef = useRef();
    const remoteRef = useRef();
    const localStreamRef = useRef(null); // Ref to store local stream

    const setupSources = async () => {
        const localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });

        localStreamRef.current = localStream; // Store local stream in ref

        const remoteStream = new MediaStream();

        localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
        });

        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
                remoteStream.addTrack(track);
            });
        };

        localRef.current.srcObject = localStream;
        remoteRef.current.srcObject = remoteStream;

        setWebcamActive(true);

        if (mode === "create") {
            const callDoc = doc(collection(firestore, "calls"));
            const offerCandidates = collection(callDoc, "offerCandidates");
            const answerCandidates = collection(callDoc, "answerCandidates");

            setRoomId(callDoc.id);

            pc.onicecandidate = async (event) => {
                if (event.candidate) {
                    await addDoc(offerCandidates, event.candidate.toJSON());
                }
            };

            const offerDescription = await pc.createOffer();
            await pc.setLocalDescription(offerDescription);

            const offer = {
                sdp: offerDescription.sdp,
                type: offerDescription.type,
            };
            await setDoc(callDoc, { offer });

            onSnapshot(callDoc, (snapshot) => {
                const data = snapshot.data();
                if (!pc.currentRemoteDescription && data?.answer) {
                    const answerDescription = new RTCSessionDescription(data.answer);
                    pc.setRemoteDescription(answerDescription);
                }
            });

            onSnapshot(answerCandidates, (snapshot) => {
                snapshot.docChanges().forEach(async (change) => {
                    if (change.type === "added") {
                        const candidate = new RTCIceCandidate(change.doc.data());
                        await pc.addIceCandidate(candidate);
                    }
                });
            });
        } else if (mode === "join") {
            const callDoc = doc(firestore, "calls", callId);
            const answerCandidates = collection(callDoc, "answerCandidates");
            const offerCandidates = collection(callDoc, "offerCandidates");

            pc.onicecandidate = async (event) => {
                if (event.candidate) {
                    await addDoc(answerCandidates, event.candidate.toJSON());
                }
            };

            const callSnapshot = await getDoc(callDoc);
            const callData = callSnapshot.data();

            const offerDescription = callData.offer;
            await pc.setRemoteDescription(
                new RTCSessionDescription(offerDescription)
            );

            const answerDescription = await pc.createAnswer();
            await pc.setLocalDescription(answerDescription);

            const answer = {
                type: answerDescription.type,
                sdp: answerDescription.sdp,
            };

            await updateDoc(callDoc, { answer });

            onSnapshot(offerCandidates, (snapshot) => {
                snapshot.docChanges().forEach(async (change) => {
                    if (change.type === "added") {
                        const candidate = new RTCIceCandidate(change.doc.data());
                        await pc.addIceCandidate(candidate);
                    }
                });
            });
        }

        pc.onconnectionstatechange = (event) => {
            if (pc.connectionState === "disconnected") {
                hangUp();
            }
        };
    };

    const toggleMic = () => {
        if (localStreamRef.current) {
            const audioTracks = localStreamRef.current.getAudioTracks();
            audioTracks.forEach((track) => (track.enabled = !track.enabled));
            setMicEnabled(!micEnabled);
        }
    };

    const blackCanvas = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 640; // Set width and height to match video stream dimensions
        canvas.height = 480;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return canvas.captureStream().getVideoTracks()[0]; // Get a black video frame
    };

    const toggleCam = () => {
        if (localStreamRef.current) {
            const videoTracks = localStreamRef.current.getVideoTracks();
            if (camEnabled) {
                // Turn off the camera by replacing the video track with a black frame
                const blackTrack = blackCanvas();
                pc.getSenders().forEach((sender) => {
                    if (sender.track.kind === "video") {
                        sender.replaceTrack(blackTrack); // Replace video with black frame
                    }
                });
                videoTracks.forEach((track) => track.stop()); // Stop the actual video track
            } else {
                // Turn the camera back on by re-enabling the video stream
                navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
                    const newVideoTrack = stream.getVideoTracks()[0];
                    localStreamRef.current.addTrack(newVideoTrack);
                    pc.getSenders().forEach((sender) => {
                        if (sender.track.kind === "video") {
                            sender.replaceTrack(newVideoTrack); // Replace black frame with real video
                        }
                    });
                    localRef.current.srcObject = stream;  // Update local video feed
                });
            }
            setCamEnabled(!camEnabled);
        }
    };



    const shareScreen = async () => {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        pc.getSenders().forEach((sender) => {
            if (sender.track.kind === "video") {
                sender.replaceTrack(screenTrack);
            }
        });

        screenTrack.onended = () => {
            pc.getSenders().forEach((sender) => {
                if (sender.track.kind === "video") {
                    sender.replaceTrack(localStreamRef.current.getVideoTracks()[0]);
                }
            });
            setSharingScreen(false);
        };

        setSharingScreen(true);
    };

    const hangUp = async () => {
        pc.close();

        if (roomId) {
            const roomRef = doc(firestore, "calls", roomId);

            const answerCandidatesSnapshot = await getDocs(collection(roomRef, "answerCandidates"));
            answerCandidatesSnapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            });

            const offerCandidatesSnapshot = await getDocs(collection(roomRef, "offerCandidates"));
            offerCandidatesSnapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            });

            await deleteDoc(roomRef);
        }
        window.location.reload();
    };

    const copyCode = () => {
        navigator.clipboard.writeText(roomId).then(() => {
            alert("Room code copied to clipboard");
        });
    };

    return (
        <div className="videos">
            <video ref={localRef} autoPlay playsInline className="local" muted />
            <video ref={remoteRef} autoPlay playsInline className="remote" />

            <div className="buttonsContainer">
                <button onClick={hangUp} disabled={!webcamActive} className="button">Hang Up</button>

                <button onClick={toggleMic} disabled={!webcamActive} className="button">
                    {micEnabled ? "Turn Off Mic" : "Turn On Mic"}
                </button>

                <button onClick={toggleCam} disabled={!webcamActive} className="button">
                    {camEnabled ? "Turn Off Camera" : "Turn On Camera"}
                </button>

                <button onClick={shareScreen} disabled={!webcamActive || sharingScreen} className="button">
                    {sharingScreen ? "Sharing Screen" : "Share Screen"}
                </button>

                <button onClick={copyCode} className="button">
                    Copy Code
                </button>
            </div>

            {!webcamActive && (
                <div className="modalContainer">
                    <div className="modal">
                        <h3>Turn on your camera and microphone and start the call</h3>
                        <div className="container">
                            <button onClick={() => setPage("home")} className="secondary">Cancel</button>
                            <button onClick={setupSources}>Start</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
