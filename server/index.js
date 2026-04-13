const express = require("express");
require('dotenv').config();
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const Document = require("./models/Document");

// Middleware: Standard setup for Cross-Origin and JSON parsing
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json()); // CRITICAL: This allows the server to read req.body from React

const server = http.createServer(app);

// Initialize Socket.io with CORS permission for the React frontend
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Database Connection Logic
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(" DB Error:", err));

// Utility: Find existing doc or create a new entry (Lazy Initialization)
async function findOrCreateDocument(id) {
  if (id == null) return;
  const document = await Document.findById(id);
  if (document) return document;

  // Create a new document if it doesn't exist
  return await Document.create({ _id: id, data: "" });
}

// Real-Time Communication Engine (Socket.io)
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId); // Put user in a specific room based on URL ID

    // Get the number of users in this specific room
    const clients = io.sockets.adapter.rooms.get(documentId);
    const numClients = clients ? clients.size : 0;
    io.in(documentId).emit("user-count", numClients); // Broadcast user count to all in the room including new user

    // Send the initial code from MongoDB to the newly connected user
    socket.emit("load-document", document.data);

    // Syncing: Listen for typing and broadcast to others in the same room
    socket.on("send_changes", (delta) => {
      // .broadcast ensures the sender doesn't receive their own keystrokes back
      socket.broadcast.to(documentId).emit("receive_changes", delta);
    });

    // Persistence: Update MongoDB when the client triggers a save
    socket.on("save-document", async (data) => {
      try {
        await Document.findByIdAndUpdate(documentId, { data });
        socket.emit("document-saved"); // Optional: Acknowledge successful save
      } catch (e) {
        console.error("Save error:", e.message);
      }
    });
  });
  // Handle user disconnects to update the user count in the room
  socket.on("disconnecting", () => {
      // Find which rooms the user was in before they leave
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          const count = io.sockets.adapter.rooms.get(room).size - 1;
          socket.to(room).emit("user-count", count);
        }
      }
    });

  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});


// --- NO-CARD COMPILER LOGIC ---
app.post("/compile", async (req, res) => {
  const { source_code, language_id, stdin } = req.body;

 // const JUDGE0_URL = process.env.JUDGE0_API_URL || "https://ce.judge0.com";
 let JUDGE0_URL = process.env.JUDGE0_API_URL || "https://ce.judge0.com";
  if (JUDGE0_URL.endsWith("/")) {
    JUDGE0_URL = JUDGE0_URL.slice(0, -1);
  }

  const options = {
    method: 'POST',
    // Use the official Judge0 CE demo URL (No -extra needed)
    url: `${JUDGE0_URL}/submissions`,
    params: { base64_encoded: 'false', fields: '*' },
    headers: { 'Content-Type': 'application/json' }, // No RapidAPI headers needed!
    data: {
      language_id: language_id || 54, 
      source_code: source_code,
      stdin: stdin  // Pass the user input to the compiler
    }
  };

  try {
    const response = await axios.request(options);
    const token = response.data.token;

    setTimeout(async () => {
      try {
        const result = await axios.get(`${JUDGE0_URL}/submissions/${token}`, {
          params: { base64_encoded: 'false', fields: '*' }
        });
        res.json(result.data);
      } catch (pollError) {
        console.error("Polling Error:", pollError.message);
        res.status(500).json({ error: "Result retrieval failed" });
      }
    }, 5000); 

  } catch (error) {
    console.error("JUDGE0 REQUEST FAILED:", error.message);
    res.status(500).json({ error: "The compiler server is currently busy." });
  }
});

// Final server entry point
const PORT = process.env.PORT || 5000; 

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});