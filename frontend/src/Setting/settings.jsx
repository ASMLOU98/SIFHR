import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./settings.css";

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    // Général
    language: "fr",
    theme: "dark",
    notifications: true,
    sound: true,
    
    // Jeu
    difficulty: "medium",
    autoSave: true,
    animationSpeed: "normal",
    
    // Graphismes
    quality: "high",
    shadows: true,
    particles: true,
    
    // Audio
    musicVolume: 70,
    effectsVolume: 80,
    ambientVolume: 60,
    
    // Compte
    username: "Sultan Al-Mansur",
    email: "sultan@empire.com",
    privacy: "public"
  });

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    // Ici vous enverriez les settings au backend
    console.log("Settings sauvegardés:", settings);
    alert("Paramètres sauvegardés avec succès !");
  };

  const handleReset = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?")) {
      setSettings({
        language: "fr",
        theme: "dark",
        notifications: true,
        sound: true,
        difficulty: "medium",
        autoSave: true,
        animationSpeed: "normal",
        quality: "high",
        shadows: true,
        particles: true,
        musicVolume: 70,
        effectsVolume: 80,
        ambientVolume: 60,
        username: "Sultan Al-Mansur",
        email: "sultan@empire.com",
        privacy: "public"
      });
    }
  };

  const SettingSection = ({ title, children }) => (
    <motion.div 
      className="setting-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="section-title">{title}</h3>
      {children}
    </motion.div>
  );

  const SettingRow = ({ label, children, description }) => (
    <div className="setting-row">
      <div className="setting-info">
        <label className="setting-label">{label}</label>
        {description && <p className="setting-description">{description}</p>}
      </div>
      <div className="setting-control">
        {children}
      </div>
    </div>
  );

  return (
    <div className="settings-container">
      {/* Fond de scène */}
      <div className="settings-background">
        <div className="settings-overlay"></div>
        <div className="settings-pattern"></div>
      </div>

      {/* Header */}
      <motion.header 
        className="settings-header"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <motion.button 
            className="back-button"
            onClick={handleBackToDashboard}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ← Retour
          </motion.button>
          <h1>Paramètres de l'Empire</h1>
          <div className="header-actions">
            <motion.button 
              className="save-button"
              onClick={handleSaveSettings}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sauvegarder
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="settings-content">
        {/* Navigation latérale */}
        <motion.nav 
          className="settings-sidebar"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {[
            { id: "general", icon: "⚙️", label: "Général" },
            { id: "game", icon: "🎮", label: "Jeu" },
            { id: "graphics", icon: "🎨", label: "Graphismes" },
            { id: "audio", icon: "🔊", label: "Audio" },
            { id: "account", icon: "👤", label: "Compte" }
          ].map((item) => (
            <motion.button
              key={item.id}
              className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
              whileHover={{ scale: 1.05, x: 10 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </motion.button>
          ))}
          
          <div className="sidebar-footer">
            <motion.button 
              className="reset-button"
              onClick={handleReset}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔄 Réinitialiser
            </motion.button>
          </div>
        </motion.nav>

        {/* Contenu principal */}
        <motion.main 
          className="settings-main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          key={activeTab}
        >
          {/* Onglet Général */}
          {activeTab === "general" && (
            <div className="tab-content">
              <SettingSection title="Préférences Générales">
                <SettingRow 
                  label="Langue" 
                  description="Choisissez la langue de l'interface"
                >
                  <select 
                    value={settings.language}
                    onChange={(e) => handleSettingChange("general", "language", e.target.value)}
                    className="setting-select"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                  </select>
                </SettingRow>

                <SettingRow 
                  label="Thème" 
                  description="Choisissez l'apparence de l'interface"
                >
                  <div className="theme-options">
                    {["dark", "light", "auto"].map(theme => (
                      <label key={theme} className="theme-option">
                        <input
                          type="radio"
                          value={theme}
                          checked={settings.theme === theme}
                          onChange={(e) => handleSettingChange("general", "theme", e.target.value)}
                        />
                        <span className="theme-label">
                          {theme === "dark" ? "🌙 Sombre" : 
                           theme === "light" ? "☀️ Clair" : "⚡ Auto"}
                        </span>
                      </label>
                    ))}
                  </div>
                </SettingRow>

                <SettingRow 
                  label="Notifications" 
                  description="Activer/désactiver les notifications"
                >
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => handleSettingChange("general", "notifications", e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </SettingRow>

                <SettingRow 
                  label="Sons de l'interface" 
                  description="Activer/désactiver les sons de navigation"
                >
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.sound}
                      onChange={(e) => handleSettingChange("general", "sound", e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </SettingRow>
              </SettingSection>
            </div>
          )}

          {/* Onglet Jeu */}
          {activeTab === "game" && (
            <div className="tab-content">
              <SettingSection title="Paramètres de Jeu">
                <SettingRow 
                  label="Difficulté" 
                  description="Niveau de difficulté du jeu"
                >
                  <select 
                    value={settings.difficulty}
                    onChange={(e) => handleSettingChange("game", "difficulty", e.target.value)}
                    className="setting-select"
                  >
                    <option value="easy">Facile</option>
                    <option value="medium">Moyen</option>
                    <option value="hard">Difficile</option>
                    <option value="expert">Expert</option>
                  </select>
                </SettingRow>

                <SettingRow 
                  label="Sauvegarde automatique" 
                  description="Sauvegarder automatiquement la progression"
                >
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.autoSave}
                      onChange={(e) => handleSettingChange("game", "autoSave", e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </SettingRow>

                <SettingRow 
                  label="Vitesse des animations" 
                  description="Contrôler la vitesse des animations du jeu"
                >
                  <select 
                    value={settings.animationSpeed}
                    onChange={(e) => handleSettingChange("game", "animationSpeed", e.target.value)}
                    className="setting-select"
                  >
                    <option value="slow">Lente</option>
                    <option value="normal">Normale</option>
                    <option value="fast">Rapide</option>
                  </select>
                </SettingRow>
              </SettingSection>
            </div>
          )}

          {/* Onglet Graphismes */}
          {activeTab === "graphics" && (
            <div className="tab-content">
              <SettingSection title="Paramètres Graphiques">
                <SettingRow 
                  label="Qualité graphique" 
                  description="Ajuster la qualité visuelle du jeu"
                >
                  <select 
                    value={settings.quality}
                    onChange={(e) => handleSettingChange("graphics", "quality", e.target.value)}
                    className="setting-select"
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Élevée</option>
                    <option value="ultra">Ultra</option>
                  </select>
                </SettingRow>

                <SettingRow 
                  label="Ombres" 
                  description="Activer/désactiver les ombres dynamiques"
                >
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.shadows}
                      onChange={(e) => handleSettingChange("graphics", "shadows", e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </SettingRow>

                <SettingRow 
                  label="Effets de particules" 
                  description="Activer/désactiver les effets spéciaux"
                >
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.particles}
                      onChange={(e) => handleSettingChange("graphics", "particles", e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </SettingRow>
              </SettingSection>
            </div>
          )}

          {/* Onglet Audio */}
          {activeTab === "audio" && (
            <div className="tab-content">
              <SettingSection title="Paramètres Audio">
                <SettingRow 
                  label="Volume de la musique" 
                  description="Volume de la bande-son principale"
                >
                  <div className="volume-control">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.musicVolume}
                      onChange={(e) => handleSettingChange("audio", "musicVolume", parseInt(e.target.value))}
                      className="volume-slider"
                    />
                    <span className="volume-value">{settings.musicVolume}%</span>
                  </div>
                </SettingRow>

                <SettingRow 
                  label="Volume des effets" 
                  description="Volume des effets sonores"
                >
                  <div className="volume-control">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.effectsVolume}
                      onChange={(e) => handleSettingChange("audio", "effectsVolume", parseInt(e.target.value))}
                      className="volume-slider"
                    />
                    <span className="volume-value">{settings.effectsVolume}%</span>
                  </div>
                </SettingRow>

                <SettingRow 
                  label="Volume ambiant" 
                  description="Volume des sons d'ambiance"
                >
                  <div className="volume-control">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.ambientVolume}
                      onChange={(e) => handleSettingChange("audio", "ambientVolume", parseInt(e.target.value))}
                      className="volume-slider"
                    />
                    <span className="volume-value">{settings.ambientVolume}%</span>
                  </div>
                </SettingRow>
              </SettingSection>
            </div>
          )}

          {/* Onglet Compte */}
          {activeTab === "account" && (
            <div className="tab-content">
              <SettingSection title="Paramètres du Compte">
                <SettingRow 
                  label="Nom d'utilisateur" 
                  description="Votre nom d'affichage dans le jeu"
                >
                  <input
                    type="text"
                    value={settings.username}
                    onChange={(e) => handleSettingChange("account", "username", e.target.value)}
                    className="setting-input"
                  />
                </SettingRow>

                <SettingRow 
                  label="Email" 
                  description="Adresse email associée au compte"
                >
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleSettingChange("account", "email", e.target.value)}
                    className="setting-input"
                  />
                </SettingRow>

                <SettingRow 
                  label="Confidentialité" 
                  description="Qui peut voir votre profil"
                >
                  <select 
                    value={settings.privacy}
                    onChange={(e) => handleSettingChange("account", "privacy", e.target.value)}
                    className="setting-select"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Amis uniquement</option>
                    <option value="private">Privé</option>
                  </select>
                </SettingRow>
              </SettingSection>

              <SettingSection title="Actions du Compte">
                <div className="account-actions">
                  <motion.button 
                    className="account-btn danger"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    🗑️ Supprimer le compte
                  </motion.button>
                  <motion.button 
                    className="account-btn warning"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    📧 Changer l'email
                  </motion.button>
                  <motion.button 
                    className="account-btn primary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    🔐 Changer le mot de passe
                  </motion.button>
                </div>
              </SettingSection>
            </div>
          )}
        </motion.main>
      </div>

      {/* Notification de confirmation */}
      <motion.div 
        className="settings-notification"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="notification-content">
          <span className="notification-icon">⚙️</span>
          <span>Personnalisez votre expérience de jeu</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;