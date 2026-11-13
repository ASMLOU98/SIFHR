// routes/authRoutes.js
const express = require('express');
const router = express.Router();

console.log('authRoutes: fichier chargé');

const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;
