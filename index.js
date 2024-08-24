const express = require("express");
const path = require("path");
const socketio = require("socket.io");
const http = require("http");
const os = require("os"); // Add this to get the local IP

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

io.on("connection", function (socket) {
    console.log("New user connected:", socket.id);

    // Handle location updates from clients
    socket.on("send-location", function (data) {
        io.emit("receive-location", {
            id: socket.id,
            ...data,
        });
    });

    // Handle client disconnection
    socket.on("disconnect", function () {
        console.log("User disconnected:", socket.id);
        io.emit("user-disconnected", socket.id);
    });
});

app.get("/", function (req, res) {
    res.render("index");
});

// Start the server on port 8000, accessible from all network interfaces
server.listen(8000, '0.0.0.0', () => {
    console.log("Server running on http://<192.168.1.5:>:8000");
});
