import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidV4 } from "uuid";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const createNewRoom = () => {
    const id = uuidV4();
    navigate(`/editor/${id}`);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/editor/${roomId.trim()}`);
    }
  };

  return (
    <div style={{
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      height: "100vh", 
      backgroundColor: "#1e1e1e", 
      color: "white", 
      fontFamily: "sans-serif"
    }}>
      <h1 style={{ color: "#4CAF50", marginBottom: "10px" }}>🚀 DevSync</h1>
      <p style={{ color: "#888", marginBottom: "30px" }}>Real-time Collaborative Code Editor</p>
      
      <div style={{
        backgroundColor: "#2d2d2d", 
        padding: "40px", 
        borderRadius: "8px", 
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)", 
        width: "350px",
        textAlign: "center"
      }}>
        <button 
          onClick={createNewRoom} 
          style={{
            width: "100%", 
            padding: "12px", 
            backgroundColor: "#4CAF50", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: "pointer", 
            fontWeight: "bold",
            fontSize: "16px"
          }}
        >
          Create New Room
        </button>
        
        <div style={{ margin: "20px 0", color: "#666", fontSize: "14px" }}>OR</div>
        
        <form onSubmit={joinRoom}>
          <input
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{
              width: "100%", 
              padding: "12px", 
              marginBottom: "10px", 
              borderRadius: "4px", 
              border: "1px solid #444", 
              backgroundColor: "#333", 
              color: "white", 
              boxSizing: "border-box"
            }}
          />
          <button 
            type="submit" 
            style={{
              width: "100%", 
              padding: "10px", 
              backgroundColor: "transparent", 
              color: "#ccc", 
              border: "1px solid #555", 
              borderRadius: "4px", 
              cursor: "pointer"
            }}
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}