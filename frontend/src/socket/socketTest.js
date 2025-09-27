import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

// Listen for response from server
socket.on("testResponse", (msg) => {
    console.log("Response from server:", msg);
});

// Send a test message to server
socket.emit("test", "Hello server! I'm a client");
