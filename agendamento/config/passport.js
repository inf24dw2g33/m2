// config/passport.js
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/user'); // Importe o modelo User

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `http://localhost:${process.env.PORT}/auth/google/callback`,
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Tente encontrar um usuário existente com o google_id
    let user = await User.findOne({ where: { google_id: profile.id } });

    // Se o usuário não existir, crie um novo
    if (!user) {
      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        google_id: profile.id,
        role: 'user', // ou 'admin', se necessário
      });
    }

    // Retorne o usuário encontrado ou criado
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialização e desserialização de usuário
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
