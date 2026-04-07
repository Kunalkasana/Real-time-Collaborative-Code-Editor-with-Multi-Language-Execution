import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { v4 as uuidV4 } from "uuid";
import TextEditor from "./TextEditor";

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. Redirect home page visitors to a brand new, unique document ID */}
        <Route path="/" element={<Navigate to={`/docs/${uuidV4()}`} />} />

        {/* 2. Capture the document ID from the URL and load the TextEditor component */}
        {/* The ':id' becomes available inside TextEditor via useParams() */}
        <Route path="/docs/:id" element={<TextEditor />} />
      </Routes>
    </Router>
  );
}

export default App;