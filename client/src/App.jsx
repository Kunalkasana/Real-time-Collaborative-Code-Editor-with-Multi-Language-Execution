import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// Note: uuidV4 is now used inside Home.jsx instead of here
import Home from "./Home"; // Import the Home component we created  
import TextEditor from "./TextEditor";

function App() {
  return (
    <Router>
      <Routes>
        {/* CHANGE: Instead of Navigate, we show the Home component */}
        <Route path="/" element={<Home />} />

        {/* CHANGE: Change '/docs/:id' to '/editor/:id' (or keep it as /docs/:id) 
           Just make sure the link in Home.jsx matches this path!
        */}
        <Route path="/editor/:id" element={<TextEditor />} />

        {/* Catch-all: If someone goes to a broken link, send them Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;