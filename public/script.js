const socket = io();
let peers = {};
let localStream;
let roomName = "";

async function joinRoom() {
  roomName = document.getElementById("roomInput").value;
  if (!roomName) return alert("Введите имя комнаты");

  document.getElementById("status").innerText = "🔊 Подключаем микрофон...";
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  socket.emit("join-room", roomName);
  document.getElementById("status").innerText = "✅ Вы в комнате: " + roomName;
}

socket.on("user-joined", async (userId) => {
  const peer = createPeer(userId, true);
  peers[userId] = peer;
});

socket.on("signal", async (data) => {
  let peer = peers[data.sender];
  if (!peer) {
    peer = createPeer(data.sender, false);
    peers[data.sender] = peer;
  }
  await peer.signal(data.signal);
});

socket.on("user-left", (userId) => {
  if (peers[userId]) {
    peers[userId].destroy();
    delete peers[userId];
  }
});

// WebRTC через simple-peer
function createPeer(userId, initiator) {
  const peer = new SimplePeer({
    initiator,
    trickle: false,
    stream: localStream
  });

  peer.on("signal", (signal) => {
    socket.emit("signal", { target: userId, signal });
  });

  peer.on("stream", (stream) => {
    const audio = document.createElement("audio");
    audio.srcObject = stream;
    audio.autoplay = true;
    document.body.appendChild(audio);
  });

  return peer;
}
