import React, { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useFBX } from "@react-three/drei";
import "./dashboard.css";

function Avatar() {
  const fbx = useFBX("/knight.fbx");
  const ref = useRef();

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += 0.2 * delta;
    }
  });

  if (!fbx) return null;
  
  return (
    <primitive
      ref={ref}
      object={fbx}
      scale={[0.02, 0.02, 0.02]}
      position={[0, -1.5, 0]}
    />
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} color="#d4af37" />
      <pointLight position={[0, 3, 0]} intensity={0.6} color="#ffd700" />
      <spotLight position={[10, 15, 10]} angle={0.3} intensity={1} color="#ffd700" />
      <Avatar />
      <OrbitControls enableZoom={true} enablePan={false} maxPolarAngle={Math.PI/2} minDistance={3} maxDistance={10} />
    </>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("stats");
  const [showDownload, setShowDownload] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [loading, setLoading] = useState(false);

  const launchGame = () => {
    window.location.href = "/games/index.html";
  };

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/list_scenarios');
      const data = await response.json();
      setScenarios(data.scenario_files || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des scénarios:", error);
      setScenarios([]);
    }
    setLoading(false);
  };

  const fetchScenarioContent = async (filename) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/get_scenario_file/${filename}`);
      const data = await response.json();
      setSelectedScenario(data);
    } catch (error) {
      console.error("Erreur lors de la récupération du scénario:", error);
      setSelectedScenario(null);
    }
    setLoading(false);
  };

  const downloadScenario = (filename) => {
    const link = document.createElement('a');
    link.href = `http://localhost:5000/download_scenario/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date inconnue';
    const dateStr = timestamp.split('_')[1];
    if (!dateStr) return timestamp;
    
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(9, 11);
    const minute = dateStr.substring(11, 13);
    
    return `${day}/${month}/${year} ${hour}:${minute}`;
  };

  useEffect(() => {
    if (showScenarios) {
      fetchScenarios();
    }
  }, [showScenarios]);

  return (
    <div className="dashboard-container">
      <div className="background-pattern"></div>
      
      <nav className="nav-menu">
        <button 
          className={`nav-btn ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          📊 Cartes
        </button>
        <button 
          className={`nav-btn ${activeTab === "gear" ? "active" : ""}`}
          onClick={() => setActiveTab("gear")}
        >
          🛡️ Équipements
        </button>
        <button 
          className={`nav-btn ${activeTab === "weapons" ? "active" : ""}`}
          onClick={() => setActiveTab("weapons")}
        >
          ⚔️ Arsenal
        </button>
        <button 
          className={`nav-btn ${activeTab === "dialogues" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("dialogues");
            setShowScenarios(true);
          }}
        >
          📜 Dialogues
        </button>
        <button 
          className="nav-btn start-btn"
          onClick={() => setShowDownload(true)}
        >
          🚀 Commencer
        </button>
      </nav>

      <div className="main-dashboard">
        <div className="avatar-section">
          <div className="avatar-container">
            <Canvas camera={{ position: [0, 1.5, 8], fov: 50 }}>
              <Suspense fallback={null}>
                <Scene />
              </Suspense>
            </Canvas>
          </div>
          
          <div className="character-info">
            <h2 className="character-name">Sir Galadrin</h2>
            <div className="character-title">Commandant du Désert Doré</div>
            <div className="title-decoration"></div>
            
            <div className="quick-stats">
              <div className="quick-stat">
                <span className="stat-icon">⭐</span>
                <div>
                  <div className="stat-value">1,240</div>
                  <div className="stat-label">Renommée</div>
                </div>
              </div>
              <div className="quick-stat">
                <span className="stat-icon">🏆</span>
                <div>
                  <div className="stat-value">7</div>
                  <div className="stat-label">Niveau</div>
                </div>
              </div>
              <div className="quick-stat">
                <span className="stat-icon">⚔️</span>
                <div>
                  <div className="stat-value">156</div>
                  <div className="stat-label">Rang</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          {activeTab === "stats" && <StatsPanel />}
          {activeTab === "gear" && <GearPanel />}
          {activeTab === "weapons" && <WeaponsPanel />}
          {activeTab === "dialogues" && (
            <DialoguesPanel 
              scenarios={scenarios}
              selectedScenario={selectedScenario}
              loading={loading}
              onSelectScenario={fetchScenarioContent}
              onDownload={downloadScenario}
              onRefresh={fetchScenarios}
              formatDate={formatDate}
              onClose={() => setSelectedScenario(null)}
            />
          )}
        </div>
      </div>

      {showDownload && (
        <div className="popup-overlay">
          <div className="simple-popup">
            <div className="popup-content">
              <div className="popup-icon">⚔️</div>
              <h3>Soyez prêt pour la nouvelle aventure</h3>
              <p>Votre quête commence maintenant dans les terres dorées</p>
              
              <div className="popup-buttons">
                <button className="confirm-btn" onClick={launchGame}>
                  🚀 Lancer le Jeu
                </button>
                <button className="cancel-btn" onClick={() => setShowDownload(false)}>
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="dashboard-footer">
        <div className="footer-text">
          "La force ne vient pas des armes, mais de la volonté"
        </div>
        <div className="social-links">
          <div className="social-icon">⚔️</div>
          <div className="social-icon">🛡️</div>
          <div className="social-icon">🏹</div>
        </div>
      </footer>
    </div>
  );
}

// Panel des Dialogues JSON
function DialoguesPanel({ 
  scenarios, 
  selectedScenario, 
  loading, 
  onSelectScenario, 
  onDownload, 
  onRefresh,
  formatDate,
  onClose 
}) {
  const [showViewer, setShowViewer] = useState(false);
  const [viewerContent, setViewerContent] = useState(null);

  const handleViewScenario = async (filename) => {
    setShowViewer(true);
    await onSelectScenario(filename);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setViewerContent(null);
    onClose();
  };

  useEffect(() => {
    if (selectedScenario && showViewer) {
      setViewerContent(selectedScenario);
    }
  }, [selectedScenario, showViewer]);

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>📜 Archives des Dialogues</h3>
        <div className="title-decoration"></div>
        <button 
          className="refresh-btn"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? '🔄 Chargement...' : '🔄 Actualiser'}
        </button>
      </div>

      {loading && !showViewer ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des dialogues...</p>
        </div>
      ) : (
        <>
          {scenarios.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📂</div>
              <h4>Aucun dialogue enregistré</h4>
              <p>Commencez une aventure et appuyez sur X pour sauvegarder vos dialogues</p>
            </div>
          ) : (
            <div className="dialogues-list">
              <div className="list-header">
                <span>Nom du fichier</span>
                <span>Date</span>
                <span>Répliques</span>
                <span>Actions</span>
              </div>
              
              {scenarios.map((filename, index) => {
                const date = formatDate(filename);
                const repliques = filename.includes('_') ? filename.split('_')[2] : '?';
                
                return (
                  <div key={index} className="dialogue-item ancient-style">
                    <div className="dialogue-info">
                      <div className="dialogue-name">
                        <span className="file-icon">📄</span>
                        {filename}
                      </div>
                      <div className="dialogue-date">{date}</div>
                      <div className="dialogue-count">
                        <span className="count-badge">{repliques}</span>
                      </div>
                      <div className="dialogue-actions">
                        <button 
                          className="action-btn view-btn"
                          onClick={() => handleViewScenario(filename)}
                        >
                          👁️ Voir
                        </button>
                        <button 
                          className="action-btn download-btn"
                          onClick={() => onDownload(filename)}
                        >
                          ⬇️ Télécharger
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="dialogues-info">
            <div className="info-card ancient-style">
              <h4>💡 Comment sauvegarder vos dialogues</h4>
              <ul>
                <li>1. Lancez le jeu et approchez d'un PNJ</li>
                <li>2. Parlez avec le PNJ en appuyant sur E</li>
                <li>3. Terminez le dialogue naturellement</li>
                <li>4. <strong>OU appuyez sur X pour sauvegarder et quitter</strong></li>
              </ul>
              <p className="info-note">
                Vos dialogues seront automatiquement sauvegardés au format JSON dans le dossier "senario"
              </p>
            </div>
          </div>
        </>
      )}

      {/* POPUP DU VISUALISEUR */}
      {showViewer && (
        <div className="viewer-popup-overlay">
          <div className="viewer-popup">
            {viewerContent ? (
              <ScenarioViewerPopup 
                scenario={viewerContent} 
                onClose={handleCloseViewer}
                onDownload={() => onDownload(viewerContent.filename || `${viewerContent.session_id}.json`)}
              />
            ) : (
              <div className="popup-loading">
                <div className="loading-spinner"></div>
                <p>Chargement du dialogue...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Composant Popup pour visualiser un scénario
function ScenarioViewerPopup({ scenario, onClose, onDownload }) {
  return (
    <div className="viewer-popup-content">
      {/* En-tête de la popup */}
      <div className="popup-header">
        <div className="popup-title-section">
          <h3>
            <span className="popup-title-icon">📜</span>
            {scenario.titre || 'Scénario de Dialogue'}
          </h3>
          <div className="popup-subtitle">
            <span className="popup-subtitle-item">
              <span className="popup-icon-small">📅</span>
              {scenario.date_creation || 'Date inconnue'}
            </span>
            <span className="popup-subtitle-item">
              <span className="popup-icon-small">🆔</span>
              Session: {scenario.session_id}
            </span>
            <span className="popup-subtitle-item">
              <span className="popup-icon-small">🗣️</span>
              {scenario.total_repliques || scenario.scenario?.length || 0} répliques
            </span>
          </div>
        </div>
        
        <div className="popup-header-actions">
          <button className="popup-action-btn download-popup-btn" onClick={onDownload}>
            <span className="btn-icon">⬇️</span>
            Télécharger JSON
          </button>
          <button className="popup-action-btn close-popup-btn" onClick={onClose}>
            <span className="btn-icon">✕</span>
            Fermer
          </button>
        </div>
      </div>

      {/* Contenu de la popup */}
      <div className="popup-body">
        {/* Section Personnages */}
        {scenario.personnages && (
          <div className="popup-section">
            <div className="popup-section-header">
              <h4>
                <span className="section-icon">🎭</span>
                Personnages
              </h4>
            </div>
            <div className="characters-grid">
              <div className="character-card explorer-card">
                <div className="character-card-icon">🧭</div>
                <div className="character-card-content">
                  <div className="character-card-name">
                    {scenario.personnages.explorateur || 'EXPLORATEUR'}
                  </div>
                  <div className="character-card-role">L'Explorateur Curieux</div>
                </div>
              </div>
              <div className="character-card guardian-card">
                <div className="character-card-icon">🏛️</div>
                <div className="character-card-content">
                  <div className="character-card-name">
                    {scenario.personnages.gardien || 'GARDIEN SIFHR'}
                  </div>
                  <div className="character-card-role">Le Gardien des Secrets</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Dialogue */}
        <div className="popup-section dialogue-section">
          <div className="popup-section-header">
            <h4>
              <span className="section-icon">💬</span>
              Dialogue Complet
            </h4>
            <div className="dialogue-stats">
              <span className="dialogue-stat">
                <span className="stat-number">
                  {scenario.scenario?.filter(s => s.parlent === 'EXPLORATEUR' || s.parlent === 'explorateur').length || 0}
                </span>
                <span className="stat-label">Questions</span>
              </span>
              <span className="dialogue-stat">
                <span className="stat-number">
                  {scenario.scenario?.filter(s => s.parlent === 'GARDIEN SIFHR' || s.parlent === 'gardien').length || 0}
                </span>
                <span className="stat-label">Réponses</span>
              </span>
            </div>
          </div>
          

<div className="dialogue-scroll-container">
  <div className="dialogue-conversation">
    {(scenario.scenario || []).map((line, index) => {
      const isGuardian = line.parlent === 'GARDIEN SIFHR' || line.parlent === 'gardien';
      const isExplorer = line.parlent === 'EXPLORATEUR' || line.parlent === 'explorateur';
      
      // Vérifier si c'est un personnage valide
      if (!isGuardian && !isExplorer) return null;
      
      return (
        <div 
          key={index} 
          className={`dialogue-bubble ${isGuardian ? 'guardian-bubble' : 'explorer-bubble'}`}
          style={{ 
            animationDelay: `${index * 0.05}s`,
            animationFillMode: 'forwards'
          }}
        >
          <div className="bubble-header">
            <div className="bubble-speaker">
              <span className="speaker-avatar">
                {isGuardian ? '🏛️' : '🧭'}
              </span>
              <span className="speaker-name">
                {isGuardian ? 'GARDIEN SIFHR' : 'EXPLORATEUR'}
              </span>
            </div>
            <span className="bubble-time">
              {line.timestamp ? new Date(line.timestamp * 1000).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }) : ''}
            </span>
          </div>
          <div className="bubble-content">
            {line.text || '...'}
          </div>
          <div className="bubble-footer">
            <span className="bubble-index">#{index + 1}</span>
          </div>
        </div>
      );
    })}
    
    {/* Message si pas de dialogue */}
    {(scenario.scenario || []).length === 0 && (
      <div className="empty-dialogue-message">
        <div className="empty-dialogue-icon">💬</div>
        <p>Aucun dialogue enregistré dans ce fichier</p>
      </div>
    )}
  </div>
</div>
        </div>

        {/* Section Métadonnées */}
        {scenario.metadata && (
          <div className="popup-section metadata-section">
            <div className="popup-section-header">
              <h4>
                <span className="section-icon">🔧</span>
                Métadonnées
              </h4>
            </div>
            <div className="metadata-cards">
              <div className="metadata-card">
                <div className="metadata-card-icon">🤖</div>
                <div className="metadata-card-content">
                  <div className="metadata-card-label">Modèle IA</div>
                  <div className="metadata-card-value">{scenario.metadata.model || 'Inconnu'}</div>
                </div>
              </div>
              <div className="metadata-card">
                <div className="metadata-card-icon">📝</div>
                <div className="metadata-card-content">
                  <div className="metadata-card-label">Format</div>
                  <div className="metadata-card-value">{scenario.metadata.format || 'parlent/text'}</div>
                </div>
              </div>
              <div className="metadata-card">
                <div className="metadata-card-icon">📊</div>
                <div className="metadata-card-content">
                  <div className="metadata-card-label">Statistiques</div>
                  <div className="metadata-card-value">
                    {scenario.metadata.total_repliques || scenario.scenario?.length || 0} répliques
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Panel des Cartes Anciennes
function StatsPanel() {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>🗺️ Cartes Anciennes</h3>
        <div className="title-decoration"></div>
      </div>
      
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">🏜️</div>
          <div className="stat-content">
            <div className="stat-value">24</div>
            <div className="stat-label">Expéditions</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">95%</div>
            <div className="stat-label">Succès</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🛡️</div>
          <div className="stat-content">
            <div className="stat-value">87%</div>
            <div className="stat-label">Défense</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">78%</div>
            <div className="stat-label">Vitesse</div>
          </div>
        </div>
      </div>

      <div className="ancient-map">
        <div className="map-header">
          <h4>🗺️ Cartographie du Désert</h4>
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-dot current"></div>
              <span>Position actuelle</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot conquered"></div>
              <span>Territoires conquis</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot enemy"></div>
              <span>Zones ennemies</span>
            </div>
          </div>
        </div>
        
        <div className="map-content">
          <div className="advancement-lines">
            <div className="advancement-line main-line"></div>
            <div className="advancement-line secondary-line"></div>
          </div>
          
          <div className="map-regions">
            <div className="map-region current ancient-style">
              <div className="region-marker"></div>
              <div className="region-info">
                <strong>Oasis de Galadrin</strong>
                <span>Quartier général - Sécurisé</span>
              </div>
            </div>
            
            <div className="map-region conquered ancient-style">
              <div className="region-marker"></div>
              <div className="region-info">
                <strong>Ruines d'Al'Kharid</strong>
                <span>Avant-poste - Sécurisé</span>
              </div>
            </div>
            
            <div className="map-region enemy ancient-style">
              <div className="region-marker"></div>
              <div className="region-info">
                <strong>Dunes Brûlantes</strong>
                <span>Territoire ennemi - Non exploré</span>
              </div>
            </div>
            
            <div className="map-region ancient-style">
              <div className="region-marker"></div>
              <div className="region-info">
                <strong>Temple du Soleil</strong>
                <span>Objectif suivant - En exploration</span>
              </div>
            </div>
          </div>
        </div>

        <div className="map-summary ancient-style">
          <div className="summary-item">
            <span>Territoires Explorés</span>
            <div className="summary-value">8/12</div>
          </div>
          <div className="summary-item">
            <span>Artéfacts Découverts</span>
            <div className="summary-value">15</div>
          </div>
          <div className="summary-item">
            <span>Expéditions</span>
            <div className="summary-value">24/28</div>
          </div>
        </div>
      </div>

      <div className="progress-section ancient-style">
        <div className="progress-header">
          <span>Progression vers le Grade Suivant</span>
          <span>65%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{width: '65%'}}></div>
        </div>
        <div className="progress-details">
          <span>Grade Actuel: Commandant</span>
          <span>Prochain: Général</span>
        </div>
      </div>
    </div>
  );
}

// Panel des Tenues de Guerre
function GearPanel() {
  const outfits = [
    { 
      name: "Armure de Plates Lourde", 
      type: "Défense Maximal", 
      defense: 95, 
      mobility: 45,
      rarity: "legendary", 
      icon: "🛡️",
      bonuses: ["+30 Défense", "+15 Résistance", "-25 Mobilité"]
    },
    { 
      name: "Armure de Cuir Renforcé", 
      type: "Polyvalent", 
      defense: 65, 
      mobility: 75,
      rarity: "epic", 
      icon: "🧥",
      bonuses: ["+20 Défense", "+35 Mobilité", "+10 Discrétion"]
    },
    { 
      name: "Tenue de Commandement", 
      type: "Cérémonial", 
      defense: 45, 
      mobility: 85,
      rarity: "rare", 
      icon: "👑",
      bonuses: ["+15 Charisme", "+25 Moral", "+10 Leadership"]
    },
    { 
      name: "Armure d'Assaut", 
      type: "Combat Rapide", 
      defense: 75, 
      mobility: 65,
      rarity: "epic", 
      icon: "⚔️",
      bonuses: ["+25 Défense", "+20 Mobilité", "+15 Attaque"]
    }
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>🛡️ Équipement Militaire</h3>
        <div className="title-decoration"></div>
      </div>
      
      <div className="gear-showcase">
        {outfits.map((outfit, index) => (
          <div key={index} className={`gear-item ${outfit.rarity}`}>
            <div className="gear-header">
              <div className="gear-icon">{outfit.icon}</div>
              <div className="gear-type">{outfit.type}</div>
            </div>
            
            <div className="gear-details">
              <h4>{outfit.name}</h4>
              
              <div className="gear-stats">
                <div className="stat-row">
                  <span>Défense:</span>
                  <div className="stat-bar">
                    <div className="stat-fill defense" style={{width: `${outfit.defense}%`}}></div>
                  </div>
                  <span>{outfit.defense}%</span>
                </div>
                
                <div className="stat-row">
                  <span>Mobilité:</span>
                  <div className="stat-bar">
                    <div className="stat-fill mobility" style={{width: `${outfit.mobility}%`}}></div>
                  </div>
                  <span>{outfit.mobility}%</span>
                </div>
              </div>
              
              <div className="gear-bonuses">
                {outfit.bonuses.map((bonus, idx) => (
                  <div key={idx} className="bonus-item">{bonus}</div>
                ))}
              </div>
              
              <div className="gear-actions">
                <button className="equip-btn">Équiper</button>
                <button className="upgrade-btn">Améliorer</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Panel des Armes
function WeaponsPanel() {
  const weapons = [
    { 
      name: "Épée Longue Royale", 
      damage: "85-120", 
      type: "Mêlée", 
      speed: "Moyenne",
      rarity: "legendary", 
      icon: "⚔️",
      traits: ["Perce armure", "Critique élevé", "Portée standard"]
    },
    { 
      name: "Arc de Chasseur", 
      damage: "65-95", 
      type: "Distance", 
      speed: "Rapide",
      rarity: "epic", 
      icon: "🏹",
      traits: ["Tir rapide", "Précision", "Portée longue"]
    },
    { 
      name: "Hache de Guerre", 
      damage: "95-110", 
      type: "Mêlée", 
      speed: "Lente",
      rarity: "epic", 
      icon: "🪓",
      traits: ["Dégâts lourds", "Brise-garde", "Portée courte"]
    },
    { 
      name: "Lance de Cavalerie", 
      damage: "75-100", 
      type: "Mêlée", 
      speed: "Moyenne",
      rarity: "rare", 
      icon: "🔱",
      traits: ["Charge mortelle", "Portée étendue", "Cavalerie"]
    }
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>⚔️ Arsenal de Combat</h3>
        <div className="title-decoration"></div>
      </div>
      
      <div className="weapons-showcase">
        {weapons.map((weapon, index) => (
          <div key={index} className={`weapon-item ${weapon.rarity}`}>
            <div className="weapon-preview">
              <div className="weapon-icon">{weapon.icon}</div>
              <div className="weapon-type">{weapon.type}</div>
            </div>
            
            <div className="weapon-details">
              <h4>{weapon.name}</h4>
              
              <div className="weapon-stats">
                <div className="damage-display">
                  <span className="damage-value">{weapon.damage}</span>
                  <span className="damage-label">Dégâts</span>
                </div>
                
                <div className="speed-display">
                  <span className="speed-value">{weapon.speed}</span>
                  <span className="speed-label">Vitesse</span>
                </div>
              </div>
              
              <div className="weapon-traits">
                {weapon.traits.map((trait, idx) => (
                  <div key={idx} className="trait-item">{trait}</div>
                ))}
              </div>
              
              <div className="weapon-actions">
                <button className="action-btn primary">Forger</button>
                <button className="action-btn">Enchanter</button>
                <button className="action-btn">Équiper</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}