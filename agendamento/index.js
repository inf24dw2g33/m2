require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const { sequelize, User } = require('./models');
const seedDatabase = require('./seeders/seed');
const routes = require('./routes');
const authRoutes = require('./routes/auth');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ where: { email: profile.emails[0].value } });
    if (!user) {
      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        google_id: profile.id,
        role: 'user',
      });
    }
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret_key',
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Swagger Config
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API de Agendamento de Consultas',
    version: '1.0.0',
    description: 'Documentação da API para gestão de pacientes, médicos e consultas',
  },
  servers: [{ url: `http://localhost:${PORT}` }],
};

// Carregar os arquivos YAML
const usersDocs = yaml.load('./docs/users.yaml');
const doctorsDocs = yaml.load('./docs/doctors.yaml');
const appointmentsDocs = yaml.load('./docs/appointments.yaml');
const specialtiesDocs = yaml.load('./docs/specialties.yaml');

// Combinar os documentos YAML em um único objeto Swagger
const swaggerDocument = {
  ...swaggerDefinition,
  paths: {
    ...usersDocs.paths,
    ...doctorsDocs.paths,
    ...appointmentsDocs.paths,
    ...specialtiesDocs.paths,
  },
};

app.use(express.static(path.join(__dirname, 'public')));

// Rota para Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rota de autenticação
app.get('/login', (req, res) => {
  res.send('<a href="/auth/google">Clique aqui para fazer login com Google</a>');
});

app.get('/auth/google', (req, res, next) => {
  // Usa o parâmetro state da query (ex: ?state=react)
  const state = req.query.state || '';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: state
  })(req, res, next);
});

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
  (req, res) => {
    const user = req.user;

    console.log(`Utilizador com LOGIN: ${user.name}, Role: ${user.role}`);

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    // Redirecionar para o Swagger com o token JWT no URL (mas sem o Swagger em branco)
    const origin = req.query.state;

    if (origin === 'react') {
      res.redirect('http://localhost:80/?token=' + token);
    } else {
      res.redirect('/swagger.html?token=' + token + '&user=' + encodeURIComponent(user.name));
    }


  });

app.get('/auth/failure', (req, res) => {
  res.send('Falha na autenticação com Google.');
});

// Rotas API
app.use('/', routes);

// Iniciar servidor
sequelize.sync({ alter: true }).then(async () => {
  console.log('Sincronizando a base de dados...');

  console.log('Esquema da base de dados sincronizado pelo Sequelize.');
  await seedDatabase();
  console.log('Base de dados pronta para uso e populada com dados iniciais.');
  app.listen(PORT, () => {
    console.log(`✅ API disponível em http://localhost:3000/swagger.html`);
    console.log(`🚀 Servidor iniciado na porta http://localhost:80`);
    console.log(`📚 Documentação Swagger disponível em http://localhost:${PORT}/api-docs`);
    console.log(`🔐 Login Google: http://localhost:${PORT}/login`);
  });
});