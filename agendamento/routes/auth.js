const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Inicia o login com Google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/token', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token não encontrado' });
  }
  res.json({ token });
});

// Callback após login do Google
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    // Geração do token JWT
    const token = jwt.sign({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role || 'user'
    }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Retorna token + info do utilizador
    res.json({
      message: 'Login com sucesso!',
      token,
      user: req.user
    });
  }
);

module.exports = router;

