import React, { useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://192.168.151.21:5000");

function App() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [callFrom, setCallFrom] = useState(null);
  const [inCall, setInCall] = useState(false);

  const [myId, setMyId] = useState("");

  useEffect(() => {
    socket.on("connect", () => {
      setMyId(socket.id);
    });
  }, []);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
      });

    socket.on("incoming-call", async ({ from, offer }) => {
      setCallFrom(from);
      peerConnection.current = createPeerConnection(from);
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit("answer-call", { to: from, answer });
      setInCall(true);
    });

    socket.on("call-answered", async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (peerConnection.current) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
  }, []);

  const createPeerConnection = (to) => {
    const pc = new RTCPeerConnection();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { to, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    const stream = localVideoRef.current.srcObject;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    return pc;
  };

  const startCall = async () => {
    const to = prompt("Enter Socket ID to call:");
    peerConnection.current = createPeerConnection(to);
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    socket.emit("call-user", { to, offer });
    setInCall(true);
  };

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h2>Video Call App (MERN + WebRTC)</h2>
      <p>Your Socket ID: {myId}</p>
      <video ref={localVideoRef} autoPlay playsInline muted width={300} />
      <video ref={remoteVideoRef} autoPlay playsInline width={300} />
      {!inCall && <button onClick={startCall}>Start Call</button>}
    </div>
  );
}

export default App;
