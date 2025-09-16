// peer.js
class PeerService {
  constructor() {
    this._createPeer();
  }

  _createPeer() {
    // Close & cleanup previous peer if present
    if (this.peer) {
      try {
        this.peer.getSenders().forEach(s => { try { if (s.track) s.track.stop(); } catch(e){} });
        this.peer.close();
      } catch (e) { /* ignore */ }
    }

    this.peer = new RTCPeerConnection({
      iceServers: [
        { urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] }
      ]
    });

    this.peer.onsignalingstatechange = () => {
      console.log("[SignalingState]", this.peer.signalingState);
    };

    // avoid duplicate track adds
    this._addedTrackIds = new Set();
    // remember last applied answer SDP so we can ignore duplicates
    this._lastAppliedAnswerSdp = null;

    this.peer.onicecandidate = (e) => {
      // optional: log or emit ICE candidates if needed
      // console.debug("ICE candidate", e.candidate);
    };
  }

  resetPeer() {
    console.log("[PeerService] resetPeer: creating fresh RTCPeerConnection");
    this._createPeer();
  }

  addLocalStreamTracks(stream) {
    if (!this.peer || !stream) return;
    for (const track of stream.getTracks()) {
      if (this._addedTrackIds.has(track.id)) continue;
      try {
        this.peer.addTrack(track, stream);
        this._addedTrackIds.add(track.id);
      } catch (e) {
        console.warn("addTrack failed (maybe already added):", e);
      }
    }
  }

  async getOffer() {
    if (!this.peer) return null;
    try {
      console.log("[PeerService.getOffer] current state before offer:", this.peer.signalingState);
      if (this.peer.signalingState !== "stable") {
        console.warn("[PeerService.getOffer] Skipping offer, state:", this.peer.signalingState);
        return null;
      }
      const offer = await this.peer.createOffer();
      console.log("[PeerService.getOffer] created offer", (offer.sdp || "").split("\n")[0]);
      await this.peer.setLocalDescription(offer);
      console.log("[PeerService.getOffer] ✅ setLocalDescription success");
      return this.peer.localDescription;
    } catch (err) {
      console.error("[PeerService.getOffer] error:", err);
      return null;
    }
  }

  // offer: RTCSessionDescription-like; localStream optional so we can add tracks AFTER setRemoteDescription
  async getAnswer(offer, localStream = null) {
    if (!this.peer || !offer) return null;
    try {
      console.log("[PeerService.getAnswer] setting remote description (offer).");
      await this.peer.setRemoteDescription(new RTCSessionDescription(offer));

      // add local tracks AFTER remote description to match m-line order
      if (localStream) {
        this.addLocalStreamTracks(localStream);
      }

      const ans = await this.peer.createAnswer();
      await this.peer.setLocalDescription(ans);
      console.log("[PeerService.getAnswer] ✅ created + setLocalDescription (answer).");
      return this.peer.localDescription;
    } catch (err) {
      console.error("[PeerService.getAnswer] error:", err);
      return null;
    }
  }

  // returns true if applied (or already applied), false if failed (e.g., wrong state and different SDP)
  async setRemoteAnswer(ans) {
    if (!this.peer || !ans) return false;
    try {
      // duplicate-detection
      if (this._lastAppliedAnswerSdp && ans.sdp === this._lastAppliedAnswerSdp) {
        console.log("[PeerService.setRemoteAnswer] duplicate answer SDP — ignoring (already applied)");
        return true;
      }

      console.log("[PeerService.setRemoteAnswer] current state:", this.peer.signalingState);

      // If signaling state is stable, check if remoteDescription already equals this SDP
      if (this.peer.signalingState !== "have-local-offer") {
        const curRemote = this.peer.remoteDescription?.sdp;
        if (curRemote && curRemote === ans.sdp) {
          console.log("[PeerService.setRemoteAnswer] remoteDescription already matches incoming answer SDP — nothing to do");
          this._lastAppliedAnswerSdp = ans.sdp;
          return true;
        }
        console.warn("[PeerService.setRemoteAnswer] unexpected signalingState:", this.peer.signalingState);
        return false;
      }

      // Normal path: we are in have-local-offer
      await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
      this._lastAppliedAnswerSdp = ans.sdp;
      console.log("[PeerService.setRemoteAnswer] ✅ applied remote answer successfully");
      return true;
    } catch (err) {
      console.error("[PeerService.setRemoteAnswer] failed:", err);
      return false;
    }
  }
}

export default new PeerService();
