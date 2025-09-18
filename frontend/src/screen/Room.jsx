import React, { useCallback, useEffect, useRef, useState } from "react";
import peer from "../service/peer.js";
import {
  userJoined,
  usercall,
  incomingcall,
  callrequestaccepted,
  callAccepting,
  negotiation,
  negotiationIncoming,
  negotiationDone,
  negotiationFinal,
} from "../config/socket";

const RoomPage = () => {
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // stable refs to avoid stale closures and to allow dedup
  const myStreamRef = useRef(null);
  const lastAppliedAnswerRef = useRef(null);

  // keep remoteMediaStream for tracks
  const remoteMediaStreamRef = useRef(new MediaStream());

  // -----------------------
  // Handlers (stable)
  // -----------------------
  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined the room`);
    setRemoteSocketId(id);
  }, []);

  const handleIncomingCall = useCallback(async ({ from, offer }) => {
    setRemoteSocketId(from);

    // create new PC for each incoming call
    peer.resetPeer();

    // get local media (do NOT add tracks to PC yet; pass to getAnswer)
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setMyStream(stream);
      myStreamRef.current = stream;
    } catch (err) {
      console.error("[handleIncomingCall] getUserMedia failed:", err);
      return;
    }

    console.log("Incoming Call ", from, offer);

    // pass stream into getAnswer so PeerService calls setRemoteDescription first then add tracks
    const ans = await peer.getAnswer(offer, stream);

    if (!ans) {
      console.error("[handleIncomingCall] Failed to create answer. Not emitting call:request");
      return;
    }

    console.log("this is the incoming call ans ", ans);
    callrequestaccepted("call:request", { to: from, ans });
  }, []);

  const handleCallUser = useCallback(async () => {
    if (!remoteSocketId) {
      console.warn("Cannot call — no remoteSocketId yet");
      return;
    }

    // fresh peer for the outgoing call
    peer.resetPeer();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setMyStream(stream);
      myStreamRef.current = stream;

      // add tracks before creating offer
      peer.addLocalStreamTracks(stream);

      const offer = await peer.getOffer();
      if (!offer) {
        console.warn("[handleCallUser] getOffer returned null");
        return;
      }

      console.log("📤 CLIENT EMIT user:call", { to: remoteSocketId, offer });
      usercall("user:call", { to: remoteSocketId, offer });
    } catch (err) {
      console.error("Error accessing media devices:", err);
    }
  }, [remoteSocketId]);

  const handlecallAccepted = useCallback(async ({ from, ans }) => {
    if (!ans || !ans.type || !ans.sdp) {
      console.warn("[Room.jsx] Received invalid answer, ignoring:", ans);
      return;
    }

    // Dedup: if we've already applied this SDP, ignore
    if (lastAppliedAnswerRef.current === ans.sdp) {
      console.log("[Room.jsx] Duplicate answer SDP received — ignoring.");
      return;
    }

    console.log("[Room.jsx] handlecallAccepted fired, state:", peer.peer?.signalingState);

    // Try to apply the answer
    const ok = await peer.setRemoteAnswer(ans);

    if (ok) {
      // success or already applied
      console.log("Call Accepted ✅");
      lastAppliedAnswerRef.current = ans.sdp;
      return;
    }

    // If setRemoteAnswer returned false, it means either wrong state or mismatch.
    // Check if remoteDescription already equals this ans.sdp — if so, treat as applied.
    const currentRemoteSdp = peer.peer?.remoteDescription?.sdp;
    if (currentRemoteSdp && currentRemoteSdp === ans.sdp) {
      console.log("[Room.jsx] Incoming answer matches current remoteDescription — treating as applied.");
      lastAppliedAnswerRef.current = ans.sdp;
      return;
    }

    // Otherwise attempt a single recovery: recreate peer and re-offer
    try {
      console.warn("[Room.jsx] setRemoteAnswer failed. Attempting single recovery (reset peer & re-offer).");

      const prevStream = myStreamRef.current;
      peer.resetPeer();

      if (prevStream) {
        peer.addLocalStreamTracks(prevStream);
      } else {
        // try to obtain media again (best-effort)
        try {
          const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          setMyStream(s);
          myStreamRef.current = s;
          peer.addLocalStreamTracks(s);
        } catch (mediaErr) {
          console.error("[Room.jsx] Failed to getUserMedia during retry:", mediaErr);
          return;
        }
      }

      const newOffer = await peer.getOffer();
      if (!newOffer) {
        console.warn("[Room.jsx] Retry getOffer returned null — aborting retry.");
        return;
      }

      console.log("[Room.jsx] Emitting new offer as retry negotiation", { to: from, newOffer });
      usercall("user:call", { to: from, offer: newOffer }); // remote should respond with an answer
    } catch (retryErr) {
      console.error("[Room.jsx] Retry negotiation failed:", retryErr);
    }
  }, []);

  // Negotiation-needed (outgoing)
  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    if (!offer) {
      console.warn("[handleNegoNeeded] offer null — skipping");
      return;
    }
    negotiation("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId]);

  // Respond to incoming negotiation
  const handleNegoNeededIncoming = useCallback(async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer, myStreamRef.current || null);
    negotiationDone("peer:nego:done", { to: from, ans });
  }, []);

  const handleNegotiationFinal = useCallback(async ({ ans }) => {
    // when final arrives, apply answer
    await peer.setRemoteAnswer(ans);
  }, []);

  const handleShareScreen = useCallback(async () => {
    try {
      // Get screen stream
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false, // don't capture system audio unless needed
      });
  
      const screenTrack = screenStream.getVideoTracks()[0];
  
      // Replace the sender's video track with the screen track
      const sender = peer.peer.getSenders().find(s => s.track && s.track.kind === "video");
      if (sender) {
        await sender.replaceTrack(screenTrack);
        console.log("✅ Replaced camera track with screen track");
      }
  
      // Show local preview of the screen being shared
      if (videoRef.current) {
        videoRef.current.srcObject = screenStream;
      }
  
      // Listen for when the user stops sharing
      screenTrack.onended = async () => {
        console.log("🛑 Screen sharing stopped, reverting to camera");
  
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const camTrack = camStream.getVideoTracks()[0];
  
        if (sender) {
          await sender.replaceTrack(camTrack);
          console.log("✅ Replaced screen track back with camera track");
        }
  
        // Restore local preview to camera
        setMyStream(camStream);
        if (videoRef.current) {
          videoRef.current.srcObject = camStream;
        }
      };
    } catch (err) {
      console.error("❌ Screen share failed:", err);
    }
  }, [peer, videoRef, setMyStream]);


  // register negotiationneeded on the peer
  useEffect(() => {
    if (!peer || !peer.peer) {
      console.warn("[Room.jsx] peer not ready yet, skipping negotiationneeded listener");
      return;
    }
  
    const pc = peer.peer;
    pc.addEventListener("negotiationneeded", handleNegoNeeded);
  
    return () => {
      pc.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  // attach "track" handler once
  useEffect(() => {
    if (!peer || !peer.peer) {
      console.warn("[Room.jsx] peer not ready yet, skipping track listener");
      return;
    }
  
    const pc = peer.peer;
    const onTrack = (ev) => {
      console.log("📥 Received remote track", ev.track);
      remoteMediaStreamRef.current.addTrack(ev.track);
      setRemoteStream(remoteMediaStreamRef.current);
    };
  
    pc.addEventListener("track", onTrack);
  
    return () => {
      pc.removeEventListener("track", onTrack);
    };
  }, []);

  // attach local <video>
  useEffect(() => {
    if (myStream && videoRef.current) {
      videoRef.current.srcObject = myStream;
    }
  }, [myStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

 useEffect(() => {
  let mounted = true;

  async function registerSocketListeners() {
    try {
      // Wait for socket to initialize (if your socket.js has a "getSocket" or "initSocket")
      // Example: await initSocket();  <-- only if your socket.js exports such a function

      if (!userJoined || !incomingcall) {
        console.warn("[Room.jsx] Socket helpers not ready yet — retrying in 200ms...");
        setTimeout(registerSocketListeners, 200);
        return;
      }

      console.log("[Room.jsx] ✅ Registering socket listeners...");
      userJoined("user:joined", handleUserJoined);
      incomingcall("incoming:call", handleIncomingCall);
      callAccepting("call:accepted", handlecallAccepted);
      negotiationIncoming("peer:nego:needed", handleNegoNeededIncoming);
      negotiationFinal("peer:nego:final", handleNegotiationFinal);
    } catch (err) {
      console.error("[Room.jsx] Failed to register socket listeners:", err);
    }
  }

  registerSocketListeners();

  return () => {
    mounted = false;
    // If your socket API supports removing listeners, do it here
    // Example: socket.off("user:joined", handleUserJoined);
  };
}, []);


  return (
    <div>
      <h1>Room Page</h1>
      <h3>{remoteSocketId ? "Connected" : "No One In Room"}</h3>
      {remoteSocketId && (
        <button
          onClick={handleCallUser}
          className="cursor-pointer p-4 border border-slate-300 rounded-md min-w-52 hover:bg-slate-500"
        >
          Call
        </button>
      )}

      {myStream && (
        <>
          <h1>My Stream</h1>
          <video ref={videoRef} autoPlay muted playsInline style={{ width: "200px", height: "100px", borderRadius: "12px", background: "#000" }} />
        </>
      )}

      {remoteStream && (
        <>
          <h1>Remote Stream</h1>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "200px", height: "100px", borderRadius: "12px", background: "#000" }} />
        </>
      )}
      
      {remoteSocketId && (
      <button
        className="cursor-pointer p-4 border border-slate-300 rounded-md min-w-52 hover:bg-slate-500 ml-2"
        onClick={handleShareScreen}
      >
       Share Screen
      </button>
      )}


    </div>
  );
};

export default RoomPage;



