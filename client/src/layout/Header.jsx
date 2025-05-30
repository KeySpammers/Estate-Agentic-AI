import React from "react";
import "./Header.css";
import logo from "../Images/logo.jpg";

const Header = ({ transparent = false, map = false }) => {
  return (
    <header className={`header ${transparent ? "transparent" : "solid"} ${map ? "map" : ''}`}>
      <div className="logo">
        <img src={logo} alt="AgenticAI Logo" className="logo-img" />
        <h1>AgenticAI</h1>
      </div>
      <nav className="nav-links">
        <a href="/">Home</a>
        <a href="/map">Map</a>
        <a href="/profile">Profile</a>
      </nav>
    </header>
  );
};

export default Header;
