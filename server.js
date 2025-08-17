const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// список подключённых пользователей
let users = {};

io.on("connection", (socket) => {
  console.log("user connected:", socket.id);

  // когда новый пользователь подключается
  socket.on("join", (name) => {
    users[socket.id] = name;
    io.emit("user-list", Object.values(users));
  });

  // пересылаем WebRTC сигналы
  socket.on("signal", (data) => {
    io.to(data.target).emit("signal", {
      sender: socket.id,
      signal: data.signal,
    });
  });

  // отключение
  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("user-list", Object.values(users));
    console.log("user disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
