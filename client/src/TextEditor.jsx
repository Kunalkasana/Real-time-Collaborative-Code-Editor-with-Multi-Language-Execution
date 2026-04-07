import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
const languageMap = {
  54: "cpp",
  71: "python",
  62: "java",
  63: "javascript",
};

export default function TextEditor() {
  const { id: documentId } = useParams();
  const socketRef = useRef();
  const editorRef = useRef();

  // New State: Holds the output from the compiler (stdout or errors)
  const [output, setOutput] = useState("");
  // New State: Tracks if the code is currently being compiled
  const [loading, setLoading] = useState(false);
  // New State: Holds user input for stdin
  const [userInput, setUserInput] = useState("");
  // New State: Tracks the selected programming language (default to C++)
  const [language, setLanguage] = useState(54); // Default to C++
  // New State: Track the number of users in the room
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    const s = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5000");
    socketRef.current = s;

    s.emit("get-document", documentId);

    s.once("load-document", (document) => {
      if (editorRef.current) {
        editorRef.current.setValue(document);
      }
    });

    s.on("receive_changes", (delta) => {
      // Logic: Only update the value if it's different to prevent cursor flickers
      if (delta !== editorRef.current.getValue()) {
        editorRef.current.setValue(delta);
      }
    });
    // Listen for user count updates from the server
    s.on("user-count", (count) => {
      setUserCount(count);
    });

    return () => s.disconnect();
  }, [documentId]);

  const handleChange = (value) => {
    socketRef.current.emit("send_changes", value);
    socketRef.current.emit("save-document", value);
  };

  // ---  Compilation Logic ---
  const runCode = async () => {
    setLoading(true);
    setOutput("Compiling and Running...");

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${backendUrl}/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: editorRef.current.getValue(),
          language_id: language, // C++ (GCC 9.2.0)
          stdin: userInput, // Pass the user input to the server
        }),
      });

      const data = await response.json();

      // Handle the output: prioritize stdout, then stderr, then compile_output
      const result =
        data.stdout ||
        data.stderr ||
        data.compile_output ||
        "Execution finished (No Output).";
      setOutput(result);
    } catch (err) {
      console.error(err);
      setOutput("Error: Could not connect to the compiler server.");
    } finally {
      setLoading(false);
    }
  };
  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied! Send it to a friend to collaborate.");
  };
  const clearTerminal = () => {
    setOutput("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Top Bar for Controls */}
      <div
        style={{
          padding: "10px",
          background: "#1e1e1e",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center", // Added to keep items vertically centered
          borderBottom: "1px solid #333",
          height: "50px", // Fixed height for the bar
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={runCode}
            disabled={loading}
            style={{
              padding: "8px 20px",
              cursor: loading ? "not-allowed" : "pointer",
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontWeight: "bold",
            }}
          >
            {loading ? "Running..." : "▶ Run Code"}
          </button>

          <select
            value={language}
            onChange={(e) => setLanguage(Number(e.target.value))}
            style={{
              padding: "8px",
              background: "#333",
              color: "white",
              border: "1px solid #555",
              borderRadius: "4px",
            }}
          >
            <option value={54}>C++ (GCC 9.2.0)</option>
            <option value={71}>Python (3.8.1)</option>
            <option value={62}>Java (OpenJDK 13.0.1)</option>
            <option value={63}>JavaScript (Node.js 12.14.0)</option>
          </select>
        </div>
        <button
          onClick={copyRoomLink}
          style={{
            padding: "8px 12px",
            background: "#333",
            color: "#ccc",
            border: "1px solid #555",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🔗 Copy Link
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div
            style={{
              color: userCount > 1 ? "#4CAF50" : "#888",
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            ● {userCount} {userCount === 1 ? "User" : "Users"} Online
          </div>
          <div style={{ color: "#666", alignSelf: "center", fontSize: "12px" }}>
            Room ID: {documentId}
          </div>
        </div>
      </div>

      {/* Editor Main View */}
      <div style={{ flex: 1, minHeight: "0" }}>
        {" "}
        {/* flex: 1 makes this section expand to fill middle space */}
        <Editor
          height="100%"
          defaultLanguage={languageMap[language]}
          theme="vs-dark"
          onMount={(editor) => (editorRef.current = editor)}
          onChange={handleChange}
          options={{
            fontSize: 16,
            minimap: { enabled: false },
            automaticLayout: true,
          }}
        />
      </div>

      {/* NEW: Input Section (stdin) */}
      <div
        style={{
          height: "100px",
          background: "#1e1e1e",
          padding: "10px",
          borderTop: "2px solid #333",
        }}
      >
        <div
          style={{
            color: "#0088ff",
            fontSize: "11px",
            fontWeight: "bold",
            marginBottom: "5px",
          }}
        >
          INPUT (stdin):
        </div>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          style={{
            width: "100%",
            height: "60px",
            background: "#000",
            color: "#fff",
            border: "1px solid #444",
            fontFamily: "monospace",
            padding: "5px",
            resize: "none",
          }}
          placeholder="Type inputs for cin here..."
        />
      </div>

      {/* Bottom Terminal Output */}
      <div
        style={{
          height: "200px",
          background: "#000",
          color: "#d4d4d4",
          padding: "15px",
          fontFamily: "monospace",
          borderTop: "2px solid #333",
          overflowY: "auto",
        }}
      >
        {/* Header Container for Label and Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              color: "#00ff00",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            TERMINAL OUTPUT:
          </div>
          <button //Clear Terminal Button
            onClick={clearTerminal}
            style={{
              background: "transparent",
              border: "1px solid #444",
              color: "#888",
              fontSize: "10px",
              cursor: "pointer",
              padding: "2px 8px",
              borderRadius: "3px",
              transition: "0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.borderColor = "#666")}
            onMouseLeave={(e) => (e.target.style.borderColor = "#444")}
          >
            Clear
          </button>
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{output}</pre>
      </div>
    </div>
  );
}
