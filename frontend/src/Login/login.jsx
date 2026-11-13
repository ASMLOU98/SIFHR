import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import "./login.css";
import backgroundVideo from "../assets/test.webm";
import logo from "../assets/logo.png";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001/api";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Effacer les erreurs quand l'utilisateur tape
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (apiError) setApiError("");
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation du formulaire
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError("");

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: formData.email.trim(),
        password: formData.password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = res.data;

      // Stocker token + user selon rememberMe
      if (formData.rememberMe) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('rememberMe', 'true');
      } else {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }

      setIsLoading(false);
      navigate("/dashboard", { 
        state: { 
          user: data.user,
          message: data.message
        }
      });

    } catch (err) {
      console.error('Erreur connexion:', err?.response?.data ?? err.message);
      const message = err?.response?.data?.error || err.message || 'Erreur lors de la connexion';
      setApiError(message);
      setIsLoading(false);
    }
  };

  // Connexion invité
  const handleGuestLogin = () => {
    navigate("/dashboard", { 
      state: { 
        user: {
          id: 0,
          firstName: "Invité",
          lastName: "Sipher",
          username: "guest",
          email: "guest@sipher.com",
          isGuest: true
        },
        message: "Bienvenue en mode invité !"
      }
    });
  };

  // Mot de passe oublié
  const handleForgotPassword = () => {
    alert("Fonctionnalité de réinitialisation de mot de passe à venir !");
  };

  return (
    <div className="login-container">
      <video autoPlay loop muted className="background-video">
        <source src={backgroundVideo} type="video/webm" />
        Your browser does not support the video tag.
      </video>

      <div className="login-overlay">
        <div className="islamic-pattern-login"></div>
        
        {/* Header */}
        <motion.header 
          className="login-header"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <img src={logo} alt="Sipher Logo" className="login-logo" />
          <button 
            className="back-btn"
            onClick={() => navigate("/")}
            disabled={isLoading}
          >
            ← Retour
          </button>
        </motion.header>

        {/* Contenu principal CENTRÉ */}
        <div className="login-main-wrapper">
          <div className="login-center-container">
            <motion.div 
              className="login-form-container"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="form-header">
                <motion.h1 
                  className="login-title"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="login-title-arabic">دخول</span>
                  <span className="login-title-latin">Connexion</span>
                </motion.h1>
                <div className="title-decoration"></div>
              </div>

              {/* Message d'erreur API */}
              {apiError && (
                <motion.div 
                  className="api-error-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  ⚠️ {apiError}
                </motion.div>
              )}

              <motion.form 
                className="login-form"
                onSubmit={handleSubmit}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <div className="input-group">
                  <label htmlFor="email" className="input-label">
                    <span className="label-icon">✉️</span>
                    Adresse Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="votre@email.com"
                    required
                    disabled={isLoading}
                  />
                  <div className="input-decoration"></div>
                  {errors.email && (
                    <div className="input-error">{errors.email}</div>
                  )}
                </div>

                <div className="input-group">
                  <label htmlFor="password" className="input-label">
                    <span className="label-icon">🔒</span>
                    Mot de Passe
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Votre mot de passe"
                    required
                    disabled={isLoading}
                  />
                  <div className="input-decoration"></div>
                  {errors.password && (
                    <div className="input-error">{errors.password}</div>
                  )}
                </div>

                <div className="form-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="checkbox-input"
                      disabled={isLoading}
                    />
                    <span className="checkbox-custom"></span>
                    Se souvenir de moi
                  </label>
                  
                  <button 
                    type="button" 
                    className="forgot-link"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <motion.button
                  type="submit"
                  className={`login-submit-btn ${isLoading ? 'loading' : ''}`}
                  whileHover={{ scale: isLoading ? 1 : 1.05 }}
                  whileTap={{ scale: isLoading ? 1 : 0.95 }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <span>Se Connecter</span>
                      <div className="btn-glow"></div>
                    </>
                  )}
                </motion.button>

                <div className="separator">
                  <span className="separator-text">ou</span>
                </div>

                <div className="alternative-auth">
                  <button 
                    type="button" 
                    className="auth-alt-btn"
                    disabled={isLoading}
                  >
                    <span className="auth-icon">🎮</span>
                    Connexion avec Steam
                  </button>
                  <button 
                    type="button" 
                    className="auth-alt-btn guest"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                  >
                    <span className="auth-icon">👤</span>
                    Connexion Invité
                  </button>
                </div>
              </motion.form>

              <motion.div 
                className="register-link-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <p className="register-text">
                  Nouveau dans Sipher ?{" "}
                  <Link to="/register" className="register-link">
                    Créer un compte
                  </Link>
                </p>
              </motion.div>
            </motion.div>

            {/* Panneau latéral */}
            <motion.div 
              className="login-side-panel"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="side-panel-content">
                <h3 className="panel-title">Rejoignez l'Épopée</h3>
                <div className="feature-list">
                  <div className="feature-item">
                    <span className="feature-icon">⚔️</span>
                    <span>Commandez des civilisations uniques</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🧠</span>
                    <span>IA adaptative et intelligente</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🌍</span>
                    <span>Monde persistant en temps réel</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">👑</span>
                    <span>Devenez un légendaire souverain</span>
                  </div>
                </div>
                
                <div className="stats-preview">
                  <div className="stat">
                    <div className="stat-number">50K+</div>
                    <div className="stat-label">Joueurs</div>
                  </div>
                  <div className="stat">
                    <div className="stat-number">12</div>
                    <div className="stat-label">Civilisations</div>
                  </div>
                  <div className="stat">
                    <div className="stat-number">24/7</div>
                    <div className="stat-label">Serveurs</div>
                  </div>
                </div>

                {/* Conseils de sécurité */}
                <div className="security-tips">
                  <h4>🔒 Conseils de Sécurité</h4>
                  <ul>
                    <li>Utilisez un mot de passe unique</li>
                    <li>Activez l'authentification à deux facteurs</li>
                    <li>Ne partagez jamais vos identifiants</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
