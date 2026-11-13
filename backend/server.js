// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');

// === PostgreSQL Pool ===
const pgPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false,
});

// Test connexion PostgreSQL au démarrage
pgPool.connect()
  .then(client => {
    console.log('🐘 PostgreSQL connecté à la base:', process.env.DB_NAME);
    client.release();
  })
  .catch(err => {
    console.error('❌ Erreur PostgreSQL:', err.message);
  });

const app = express();

// === Middleware ===
// SOLUTION TEMPORAIRE: autoriser tout pour debug
app.use(cors({
  origin: '*', // Autoriser toutes les origines
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple logger
app.use((req, res, next) => {
  console.log('📥', req.method, req.originalUrl);
  next();
});

// Static files (si besoin)
app.use(express.static(path.join(__dirname, 'public')));

// === Test / Health ===
app.get('/test', (req, res) => res.json({ message: 'Route test OK' }));

app.get('/api/health', (req, res) => {
  res.json({
    message: '🚀 Serveur Sipher en ligne!',
    env: process.env.NODE_ENV || 'development'
  });
});

// === PostgreSQL health check ===
app.get('/api/db/health', async (req, res) => {
  try {
    const result = await pgPool.query('SELECT current_database(), NOW()');
    res.json({
      status: 'connected',
      database: result.rows[0].current_database,
      time: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'disconnected',
      error: error.message
    });
  }
});

// === Routes IA vers API Python ===

// Chat IA
app.post('/api/ai/chat', async (req, res) => {
  try {
    console.log('🤖 Envoi vers API Python:', req.body.message?.substring(0, 50) + '...');
    const response = await axios.post('http://localhost:5000/chat', req.body, { timeout: 30000 });
    console.log('✅ Réponse reçue de Python');
    res.json(response.data);
  } catch (error) {
    console.error('❌ Erreur API Python:', error.message);
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Service IA indisponible', details: 'Le serveur Python n\'est pas démarré' });
    }
    res.status(500).json({ error: 'Erreur service IA', details: error.message });
  }
});

// Génération contenu
app.post('/api/ai/generate', async (req, res) => {
  try {
    console.log('🎨 Génération contenu:', req.body.prompt?.substring(0, 50) + '...');
    const response = await axios.post('http://localhost:5000/generate', req.body, { timeout: 30000 });
    res.json(response.data);
  } catch (error) {
    console.error('❌ Erreur génération contenu:', error.message);
    res.status(500).json({ error: 'Erreur génération contenu', details: error.message });
  }
});

// Test connexion API Python
app.get('/api/ai/health', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5000/health', { timeout: 5000 });
    res.json({ status: 'connected', python: response.data });
  } catch (error) {
    res.json({ status: 'disconnected', error: 'API Python non disponible' });
  }
});

// === Import Routes ===
try {
  const authRoutes = require('./routes/authRoutes');
  console.log('✅ authRoutes required OK');
  app.use('/api/auth', authRoutes);
} catch (e) {
  console.error('❌ Erreur require authRoutes:', e);
}

try {
  const userRoutes = require('./routes/userRoutes');
  console.log('✅ userRoutes required OK');
  app.use('/api/users', userRoutes);
} catch (e) {
  console.error('❌ Erreur require userRoutes:', e);
}

// === 404 ===
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// === Gestion globale des erreurs ===
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur globale:', err.message);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// === Démarrage serveur ===
const PORT = process.env.PORT || 3001; // CHANGÉ: 3000 → 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Serveur Node.js démarré sur http://localhost:${PORT}`);
  console.log(`🤖 Routes IA disponibles:`);
  console.log(`   POST http://localhost:${PORT}/api/ai/chat`);
  console.log(`   POST http://localhost:${PORT}/api/ai/generate`);
  console.log(`   GET  http://localhost:${PORT}/api/ai/health`);
  console.log(`🐍 API Python sur http://localhost:5000`);
});