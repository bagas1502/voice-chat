const socket = io();
let peers = {};
let localStream;
let roomName = "";
let userName = "";

// Проверяем сохранённое имя при загрузке
window.onload = () => {
  const savedName = localStorage.getItem("username");
  if (savedName) {
    userName = savedName;
    startApp();
  }
};

// Сохранение имени
function saveName() {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) return alert("Введите имя!");
  localStorage.setItem("username", name);
  userName = name;
  startApp();
}

// Запуск UI после авторизации
function startApp() {
  document.getElementById("auth").style.display = "none";
  document.getElementById("chatUI").style.display = "block";
  document.getElementById("welcome").innerText = "👋 Привет, " + userName;
}

// Вход в комнату
async function joinRoom() {
  roomName = document.getElementById("roomInput").value;
  if (!roomName) return alert("Введите имя комнаты");

  document.getElementById("status").innerText = "🔊 Подключаем микрофон...";
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  socket.emit("join-room", { room: roomName, name: userName });
  document.getElementById("status").innerText = "✅ Вы в комнате: " + roomName;
}

// Выход из комнаты
function leaveRoom() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }

  for (let userId in peers) {
    peers[userId].destroy();
    delete peers[userId];
  }

  socket.emit("leave-room", roomName);
  document.getElementById("status").innerText = "❌ Вы вышли из комнаты";
  roomName = "";
}

// WebRTC
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

// Создание Peer соединения
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
