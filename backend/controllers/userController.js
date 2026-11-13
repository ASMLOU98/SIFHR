// controllers/userController.js
const pool = require('../db');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, first_name, last_name, username, email, created_at FROM users ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT id, first_name, last_name, username, email, created_at FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;
    if (!firstName || !lastName || !username || !email || !password) return res.status(400).json({ error: 'Champs manquants' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, username, email, password_hash) VALUES ($1,$2,$3,$4,$5) RETURNING id, first_name, last_name, username, email, created_at',
      [firstName, lastName, username, email, hash]
    );
    res.status(201).json({ message: 'Utilisateur créé', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, username, email, password } = req.body;

    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const current = userRes.rows[0];
    const hash = password ? await bcrypt.hash(password, 10) : current.password_hash;

    const updated = await pool.query(
      'UPDATE users SET first_name=$1, last_name=$2, username=$3, email=$4, password_hash=$5 WHERE id=$6 RETURNING id, first_name, last_name, username, email, created_at',
      [firstName || current.first_name, lastName || current.last_name, username || current.username, email || current.email, hash, id]
    );

    res.json({ message: 'Utilisateur mis à jour', user: updated.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [id]);
    if (!deleted.rows.length) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
