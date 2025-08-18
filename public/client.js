const socket = io();
let peers = {};
let localStream;
let username = "";

const loginDiv = document.getElementById("loginDiv");
const chatDiv = document.getElementById("chatDiv");
const joinBtn = document.getElementById("joinBtn");
const leaveBtn = document.getElementById("leaveBtn");
const statusDiv = document.getElementById("status");
const usersList = document.getElementById("users");

joinBtn.onclick = async () => {
  username = document.getElementById("username").value || "Гость";
  localStorage.setItem("username", username);

  loginDiv.style.display = "none";
  chatDiv.style.display = "block";

  statusDiv.innerText = "🔊 Подключаем микрофон...";
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  socket.emit("join-room", username);
  statusDiv.innerText = `✅ Вы в комнате как ${username}`;
};

leaveBtn.onclick = () => {
  location.reload(); // простое решение выхода
};

socket.on("user-list", (list) => {
  usersList.innerHTML = "";
  list.forEach(user => {
    const li = document.createElement("li");
    li.innerText = user;
    usersList.appendChild(li);
  });
});

socket.on("user-joined", (userId) => {
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

// Автоматическое заполнение имени из localStorage
window.onload = () => {
  const savedName = localStorage.getItem("username");
  if (savedName) document.getElementById("username").value = savedName;
};
