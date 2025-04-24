import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapPage from "./pages/MapPage";
import Home from "./pages/LandingPage";
import UserProfile from "./pages/UserProfile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/profile" element={<UserProfile />} />
    </Routes>
  );
}

export default App;
