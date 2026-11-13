import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "./welcome.css";
import backgroundVideo from "../assets/test.webm";
import logo from "../assets/logo.png";
import { motion } from "framer-motion";

const Welcome = () => {
  const [displayText, setDisplayText] = useState("");
  const fullText = ("Bienvenue dans le monde de Sifhr, Préparez-vous à diriger, évoluer et conquérir des civilisations futuristes..");

  const navigate = useNavigate(); 

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayText((prev) => prev + fullText[index]);
      index++;
      if (index === fullText.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="welcome-container">
      <video autoPlay loop muted className="background-video">
        <source src={backgroundVideo} type="video/webm" />
        Your browser does not support the video tag.
      </video>

      <div className="overlay">
        {/* Pattern décoratif islamique */}
        <div className="islamic-pattern"></div>
        
        <header className="welcome-header">
          <motion.img 
            src={logo} 
            alt="Sipher Logo" 
            className="logo"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1 }}
          />
          <nav className="nav-menu">
            <button className="nav-btn1">À propos</button>
            <button className="nav-btn1">Galerie</button>
            <button className="nav-btn1">Contact</button>
          </nav>
        </header>

        <main className="main-content">
          <motion.div 
            className="title-section"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h1 className="main-title">
              <span className="title-arabic">سيفر</span>
              <span className="title-latin">SIFHR</span>
            </h1>
            <div className="title-decoration"></div>
          </motion.div>

          <motion.div 
            className="text-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <p className="welcome-text">{displayText}</p>
          </motion.div>

          <motion.div 
            className="cta-section"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            <button 
              className="start-btn"
              onClick={() => navigate("/login")}
            >
              <span className="btn-text">Commencer l'Épopée</span>
              <div className="btn-decoration"></div>
            </button>
            
            <div className="secondary-buttons">
              <button className="secondary-btn">Voir la Démo</button>
              <button className="secondary-btn">Galerie</button>
            </div>
          </motion.div>
        </main>

        <footer className="welcome-footer">
          <div className="social-links">
            <span className="social-icon">📱</span>
            <span className="social-icon">💬</span>
            <span className="social-icon">🎮</span>
          </div>
          <p className="footer-text">Plongez dans une aventure stratégique unique</p>
        </footer>
      </div>
    </div>
  );
};

export default Welcome;