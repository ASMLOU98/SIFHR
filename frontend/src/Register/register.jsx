import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import "./register.css";
import backgroundVideo from "../assets/test.webm";
import logo from "../assets/logo.png";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    newsletter: true,
    terms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
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

  // Validation de l'étape 1
  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = "Le prénom doit contenir au moins 2 caractères";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = "Le nom doit contenir au moins 2 caractères";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis";
    } else if (formData.username.length < 3 || formData.username.length > 16) {
      newErrors.username = "Le nom d'utilisateur doit contenir entre 3 et 16 caractères";
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      newErrors.username = "Le nom d'utilisateur ne peut contenir que des lettres et des chiffres";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation de l'étape 2
  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Veuillez confirmer votre mot de passe";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    if (!formData.terms) {
      newErrors.terms = "Vous devez accepter les conditions d'utilisation";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep1()) {
      setStep(2);
      setApiError("");
    }
  };

  const prevStep = () => {
    setStep(1);
    setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 1) {
      nextStep();
      return;
    }

    // Validation finale de l'étape 2
    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);
    setApiError("");

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = res.data;

      setIsLoading(false);

      // Si le backend renvoie token/user, on peut les stocker
      if (data.token) {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }

      navigate("/dashboard", { 
        state: { 
          user: data.user,
          message: data.message
        }
      });

    } catch (err) {
      console.error('Erreur inscription:', err?.response?.data ?? err.message);
      const message = err?.response?.data?.error || err.message || 'Erreur lors de l\'inscription';
      setApiError(message);
      setIsLoading(false);
    }
  };

  // Indicateur de force du mot de passe
  const getPasswordStrength = () => {
    if (!formData.password) return { width: '0%', color: '#ef4444', text: 'Faible' };
    
    const strength = 
      (formData.password.length >= 6 ? 25 : 0) +
      (/[A-Z]/.test(formData.password) ? 25 : 0) +
      (/[0-9]/.test(formData.password) ? 25 : 0) +
      (/[^A-Za-z0-9]/.test(formData.password) ? 25 : 0);

    if (strength <= 25) return { width: '25%', color: '#ef4444', text: 'Faible' };
    if (strength <= 50) return { width: '50%', color: '#f59e0b', text: 'Moyen' };
    if (strength <= 75) return { width: '75%', color: '#10b981', text: 'Fort' };
    return { width: '100%', color: '#10b981', text: 'Très fort' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="register-container">
      <video autoPlay loop muted className="background-video">
        <source src={backgroundVideo} type="video/webm" />
        Your browser does not support the video tag.
      </video>

      <div className="register-overlay">
        <div className="islamic-pattern-register"></div>
        
        {/* Header */}
        <motion.header 
          className="register-header"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <img src={logo} alt="Sipher Logo" className="register-logo" />
          <button 
            className="back-btn"
            onClick={() => navigate("/")}
          >
            ← Accueil
          </button>
        </motion.header>

        {/* Contenu principal */}
        <div className="register-main-wrapper">
          <div className="register-center-container">
            <motion.div 
              className="register-form-container"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Indicateur d'étape */}
              <div className="step-indicator">
                <div className={`step ${step === 1 ? 'active' : 'completed'}`}>
                  <div className="step-number">1</div>
                  <span className="step-label">Informations</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${step === 2 ? 'active' : ''}`}>
                  <div className="step-number">2</div>
                  <span className="step-label">Finalisation</span>
                </div>
              </div>

              <div className="form-header">
                <motion.h1 
                  className="register-title"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="register-title-arabic">تسجيل</span>
                  <span className="register-title-latin">Inscription</span>
                </motion.h1>
                <div className="title-decoration"></div>
                <p className="form-subtitle">
                  Rejoignez l'aventure Sipher et forgez votre légende
                </p>
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
                className="register-form"
                onSubmit={handleSubmit}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {/* Étape 1: Informations de base */}
                {step === 1 && (
                  <motion.div
                    className="form-step"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="name-group">
                      <div className="input-group half">
                        <label htmlFor="firstName" className="input-label">
                          <span className="label-icon">👤</span>
                          Prénom
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={`form-input ${errors.firstName ? 'error' : ''}`}
                          placeholder="Votre prénom"
                          required
                        />
                        <div className="input-decoration"></div>
                        {errors.firstName && (
                          <div className="input-error">{errors.firstName}</div>
                        )}
                      </div>

                      <div className="input-group half">
                        <label htmlFor="lastName" className="input-label">
                          <span className="label-icon">👥</span>
                          Nom
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={`form-input ${errors.lastName ? 'error' : ''}`}
                          placeholder="Votre nom"
                          required
                        />
                        <div className="input-decoration"></div>
                        {errors.lastName && (
                          <div className="input-error">{errors.lastName}</div>
                        )}
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="username" className="input-label">
                        <span className="label-icon">🎮</span>
                        Nom d'utilisateur
                      </label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`form-input ${errors.username ? 'error' : ''}`}
                        placeholder="Choisissez un pseudo"
                        required
                      />
                      <div className="input-decoration"></div>
                      <div className="input-hint">
                        3-16 caractères, lettres et chiffres uniquement
                      </div>
                      {errors.username && (
                        <div className="input-error">{errors.username}</div>
                      )}
                    </div>

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
                      />
                      <div className="input-decoration"></div>
                      {errors.email && (
                        <div className="input-error">{errors.email}</div>
                      )}
                    </div>

                    <motion.button
                      type="button"
                      className="next-step-btn"
                      onClick={nextStep}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>Continuer</span>
                      <div className="btn-arrow">→</div>
                    </motion.button>
                  </motion.div>
                )}

                {/* Étape 2: Sécurité et conditions */}
                {step === 2 && (
                  <motion.div
                    className="form-step"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
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
                        placeholder="Créez un mot de passe sécurisé"
                        required
                      />
                      <div className="input-decoration"></div>
                      <div className="password-strength">
                        <div 
                          className="strength-bar"
                          style={{
                            width: passwordStrength.width,
                            background: passwordStrength.color
                          }}
                        ></div>
                        <div className="strength-text">
                          {formData.password ? passwordStrength.text : 'Force du mot de passe'}
                        </div>
                      </div>
                      {errors.password && (
                        <div className="input-error">{errors.password}</div>
                      )}
                    </div>

                    <div className="input-group">
                      <label htmlFor="confirmPassword" className="input-label">
                        <span className="label-icon">✅</span>
                        Confirmer le Mot de Passe
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                        placeholder="Répétez votre mot de passe"
                        required
                      />
                      <div className="input-decoration"></div>
                      {errors.confirmPassword && (
                        <div className="input-error">{errors.confirmPassword}</div>
                      )}
                    </div>

                    <div className="form-options">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="newsletter"
                          checked={formData.newsletter}
                          onChange={handleInputChange}
                          className="checkbox-input"
                        />
                        <span className="checkbox-custom"></span>
                        Recevoir les actualités et offres spéciales
                      </label>

                      <label className={`checkbox-label terms ${errors.terms ? 'error' : ''}`}>
                        <input
                          type="checkbox"
                          name="terms"
                          checked={formData.terms}
                          onChange={handleInputChange}
                          className="checkbox-input"
                          required
                        />
                        <span className="checkbox-custom"></span>
                        J'accepte les{" "}
                        <a href="#terms" className="terms-link">
                          conditions d'utilisation
                        </a>{" "}
                        et la{" "}
                        <a href="#privacy" className="terms-link">
                          politique de confidentialité
                        </a>
                        {errors.terms && (
                          <div className="input-error">{errors.terms}</div>
                        )}
                      </label>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="back-step-btn"
                        onClick={prevStep}
                        disabled={isLoading}
                      >
                        ← Retour
                      </button>

                      <motion.button
                        type="submit"
                        className={`register-submit-btn ${isLoading ? 'loading' : ''}`}
                        whileHover={{ scale: isLoading ? 1 : 1.05 }}
                        whileTap={{ scale: isLoading ? 1 : 0.95 }}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="loading-spinner"></div>
                            Création du compte...
                          </>
                        ) : (
                          <>
                            <span>Commencer l'Aventure</span>
                            <div className="btn-glow"></div>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Options de connexion rapide */}
                <div className="quick-auth-section">
                  <div className="separator">
                    <span className="separator-text">Inscription rapide</span>
                  </div>

                  <div className="quick-auth-buttons">
                    <button type="button" className="quick-auth-btn steam" disabled={isLoading}>
                      <span className="auth-icon">🎮</span>
                      Steam
                    </button>
                    <button type="button" className="quick-auth-btn google" disabled={isLoading}>
                      <span className="auth-icon">🔍</span>
                      Google
                    </button>
                    <button type="button" className="quick-auth-btn apple" disabled={isLoading}>
                      <span className="auth-icon">🍎</span>
                      Apple
                    </button>
                  </div>
                </div>
              </motion.form>

              <motion.div 
                className="login-link-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <p className="login-text">
                  Déjà un compte ?{" "}
                  <Link to="/login" className="login-link">
                    Se connecter
                  </Link>
                </p>
              </motion.div>
            </motion.div>

            {/* Panneau latéral */}
            <motion.div 
              className="register-side-panel"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="side-panel-content">
                <h3 className="panel-title">Avantages du Compte</h3>
                
                <div className="benefits-list">
                  <div className="benefit-item">
                    <div className="benefit-icon">🏆</div>
                    <div className="benefit-content">
                      <h4>Progression Sauvegardée</h4>
                      <p>Votre civilisation évolue même hors ligne</p>
                    </div>
                  </div>

                  <div className="benefit-item">
                    <div className="benefit-icon">🤝</div>
                    <div className="benefit-content">
                      <h4>Communauté Stratégique</h4>
                      <p>Rejoignez des alliances et compétitions</p>
                    </div>
                  </div>

                  <div className="benefit-item">
                    <div className="benefit-icon">🎁</div>
                    <div className="benefit-content">
                      <h4>Contenu Exclusif</h4>
                      <p>Accès anticipé aux nouvelles fonctionnalités</p>
                    </div>
                  </div>

                  <div className="benefit-item">
                    <div className="benefit-icon">⚡</div>
                    <div className="benefit-content">
                      <h4>Multijoueur Avancé</h4>
                      <p>Affrontez des joueurs du monde entier</p>
                    </div>
                  </div>
                </div>

                <div className="premium-feature">
                  <div className="premium-badge">PREMIUM</div>
                  <h4>Guide du Débutant</h4>
                  <p>Obtenez un bonus de démarrage +500 ressources et un guide stratégique exclusif</p>
                  <div className="premium-rewards">
                    <span className="reward">+500 Or</span>
                    <span className="reward">+500 Nourriture</span>
                    <span className="reward">Guide Stratégique</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
