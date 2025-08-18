const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const ROOM_NAME = "family-room";
let users = {};

io.on("connection", (socket) => {
  let username = "";

  socket.on("join-room", (name) => {
    username = name || "Гость";
    users[socket.id] = username;
    socket.join(ROOM_NAME);

    io.to(ROOM_NAME).emit("user-list", Object.values(users));
    socket.broadcast.to(ROOM_NAME).emit("user-joined", socket.id);
  });

  socket.on("signal", (data) => {
    io.to(data.target).emit("signal", {
      sender: socket.id,
      signal: data.signal
    });
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    socket.broadcast.to(ROOM_NAME).emit("user-left", socket.id);
    io.to(ROOM_NAME).emit("user-list", Object.values(users));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
