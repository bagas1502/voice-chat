const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const ROOM_NAME = "family-room"; // одна фиксированная комната

// Раздаём статические файлы (index.html, client.js, style.css)
app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.join(ROOM_NAME);
  console.log("🔗 Новый участник:", socket.id);

  socket.to(ROOM_NAME).emit("user-joined", socket.id);

  socket.on("signal", (data) => {
    io.to(data.target).emit("signal", { sender: socket.id, signal: data.signal });
  });

  socket.on("disconnect", () => {
    console.log("❌ Участник вышел:", socket.id);
    socket.to(ROOM_NAME).emit("user-left", socket.id);
  });
});

server.listen(3000, () => {
  console.log("✅ Сервер запущен: http://localhost:3000");
});
