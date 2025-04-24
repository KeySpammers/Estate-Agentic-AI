import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapPage from "./pages/MapPage";
import Home from "./LandingPage";
import UserProfile from "./UserProfile";

function App() {
  return (
    <Routes>
      <Route path="/Home" element={<Home />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/profile" element={<UserProfile />} />
    </Routes>
  );
}

export default App;

{
  /* <Route path="/" element={<HomePage />} />
      <Route path="/map" element={<MapPage />} /> */
}
