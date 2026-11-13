// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// AJOUTEZ CE LOG POUR DEBUG
console.log('🔧 Tentative d\'importation de db.js...');

// Essayez d'importer le pool
let pool;
try {
  pool = require('../db');
  console.log('✅ Pool importé avec succès');
} catch (error) {
  console.error('❌ Erreur lors de l\'importation du pool:', error.message);
  console.error('❌ Chemin essayé: ../db depuis', __dirname);
  
  // Essayez un chemin différent
  try {
    const path = require('path');
    pool = require(path.join(__dirname, '..', 'db'));
    console.log('✅ Pool importé avec chemin absolu');
  } catch (error2) {
    console.error('❌ Échec de l\'importation avec chemin absolu:', error2.message);
  }
}

// Si pool est toujours undefined, créez-le directement
if (!pool) {
  console.log('🔄 Création directe du pool...');
  const { Pool } = require('pg');
  require('dotenv').config();
  
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'Sifhr',
    ssl: false,
  });
  console.log('✅ Pool créé directement');
}

require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

exports.register = async (req, res) => {
  try {
    console.log('🔵 POST /api/auth/register body:', req.body);
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Vérifier doublons
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash)
       VALUES ($1,$2,$3,$4)
       RETURNING id, first_name, last_name, email, created_at`,
      [firstName, lastName, email, hash]
    );

    const user = result.rows[0];

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({ 
      message: 'Inscription réussie', 
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        createdAt: user.created_at,
      }, 
      token 
    });
  } catch (err) {
    console.error('❌ ERREUR register:', err);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

exports.login = async (req, res) => {
  try {
    console.log('🔵 POST /api/auth/login body:', req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ Champs manquants');
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    console.log(`🔎 Recherche utilisateur avec email: ${email}`);
    
    // VÉRIFIEZ SI POOL EST DÉFINI
    if (!pool) {
      console.error('❌ POOL EST UNDEFINED DANS LA FONCTION LOGIN!');
      return res.status(500).json({ error: 'Erreur de configuration base de données' });
    }
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    console.log(`📊 Résultats trouvés: ${result.rows.length}`);
    
    if (result.rows.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      return res.status(401).json({ error: 'Email ou mot de passe invalide' });
    }

    const user = result.rows[0];
    console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`);
    
    console.log('🔐 Comparaison mot de passe...');
    const valid = await bcrypt.compare(password, user.password_hash);
    console.log(`🔐 Résultat comparaison: ${valid ? 'OK' : 'INVALIDE'}`);
    
    if (!valid) {
      console.log('❌ Mot de passe incorrect');
      return res.status(401).json({ error: 'Email ou mot de passe invalide' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('🎉 Connexion réussie, token généré');

    return res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        createdAt: user.created_at,
      },
      token,
    });
    
  } catch (err) {
    console.error('🔥 ERREUR CRITIQUE login:', err.message);
    console.error('📋 Stack trace:', err.stack);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};