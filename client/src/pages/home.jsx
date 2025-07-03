// src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";  // ✅ required import
import "../index.css";
import "./home.css";

const Home = () => {
  const navigate = useNavigate(); // ✅ initialize

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="logo">🎵 AAROH AI</div>
        <ul className="nav-links">
          <li><a href="#home">Home</a></li>
          <li><a href="#about">About Us</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>

      <div className="home-main">
        <div className="welcome-text">
          <h2 className="welcome-heading">Welcome to AAROH AI</h2>
          <p>Select your level and start your journey...</p>
        </div>
      </div>

      <div className="home-lower">
        <div className="level-buttons">
          <button className="level-btn" onClick={() => navigate("/upload-ideal")}>Beginner</button>
          <button className="level-btn" onClick={() => navigate("/upload-ideal")}>Intermediate</button>
          <button className="level-btn" onClick={() => navigate("/upload-ideal")}>Advance</button>
          <button className="start-btn" onClick={() => navigate("/upload-ideal")}>Let's Start ➤</button>
        </div>
      </div>
    </div>
  );
};

export default Home;
