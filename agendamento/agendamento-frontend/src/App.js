import React, { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Users, PlusCircle, LogIn, LogOut, Home, MapPin, User, Stethoscope, ListPlus } from 'lucide-react';
import HomeView from './components/HomeView';
import ConsultasList from './components/ConsultasList';
import UsersList from './components/UsersList';
import MedicosList from './components/MedicosList';
import EspecialidadesList from './components/EspecialidadesList';
import api from './api/api';
import './App.css';
import './index.css';
import googleIcon from './imagem/google.png';


function App() {
  const [view, setView] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('jwtToken'));
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');

  const showMessage = useCallback((msg, type = 'info') => {
    setMessage({ text: msg, type: type });
    setTimeout(() => setMessage(''), 5000);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const jwtToken = urlParams.get('token');
    if (jwtToken) {
      localStorage.setItem('jwtToken', jwtToken);
      setToken(jwtToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      showMessage('Login bem-sucedido!', 'success');
    }
  }, [showMessage]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (token) {
        try {
          const response = await api.get('/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setUser(response.data);
        } catch {
          setToken(null);
          localStorage.removeItem('jwtToken');
          showMessage('Sessão expirada ou inválida. Por favor, faça login novamente.', 'error');
        }
      } else {
        setUser(null);
      }
    };
    fetchUserData();
  }, [token, showMessage]);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwtToken');
    showMessage('Logout efetuado com sucesso!', 'info');
    setView('home');
  };

  // LOGIN GOOGLE: Redireciona para o backend com state=react
  const handleGoogleLogin = () => {
    let base = api.defaults.baseURL;
    if (!base.endsWith('/')) base += '/';
    window.location.href = `${base}auth/google?state=react`;
  };

  const Navbar = () => (
    <nav className="navbar">
      <div className="navbar-title-row">
        <h1 className="navbar-brand"><Stethoscope size={50} style={{ verticalAlign: 'middle', marginRight: 12 }} />
          Gestão de Consultas Médicas
        </h1>
      </div>
      <div className="navbar-links-row">
        <div className="navbar-links-center">
          <button onClick={() => setView('home')} className="nav-button"><Home size={20} /> Início</button>
          <button onClick={() => setView('Consultas')} className="nav-button"><CalendarDays size={20} /> Consultas</button>
          <button onClick={() => setView('users')} className="nav-button"><Users size={20} /> Utilizadores</button>
          <button onClick={() => setView('Medicos')} className="nav-button"><MapPin size={20} /> Médicos</button>
          <button onClick={() => setView('Especialidades')} className="nav-button"><User size={20} /> Especialidades</button>

        </div>
        <div className="navbar-auth">
          {token ? (
            <button onClick={handleLogout} className="logout-button">
              <LogOut size={20} /> Sair ({user ? user.name : '...'})
            </button>
          ) : (
            <button onClick={handleGoogleLogin} className="login-button">
            <img
              src={googleIcon} // Usa a imagem importada
              alt="Google"
              style={{ height: '18px', verticalAlign: 'middle', marginRight: '6px' }}
            />
            <LogIn size={20} /> Login Google
          </button>
          )}
        </div>
      </div>
    </nav>
  );

  const MessageDisplay = () => {
    if (!message) return null;
    const messageClass = message.type === 'success' ? 'message-success' : message.type === 'error' ? 'message-error' : 'message-info';
    return <div className={`message-display ${messageClass}`}>{message.text}</div>;
  };



  // Renderização condicional das vistas
  const renderView = () => {
    switch (view) {
      case 'home': return <HomeView />;
      case 'Consultas': return <ConsultasList setView={setView} showMessage={showMessage} token={token} user={user} />;
      case 'users': return <UsersList setView={setView} showMessage={showMessage} token={token} user={user} />;
      case 'Medicos': return <MedicosList setView={setView} showMessage={showMessage} token={token} user={user} />;
      case 'Especialidades': return <EspecialidadesList setView={setView} showMessage={showMessage} token={token} user={user} />;

      default: return <HomeView />;
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <MessageDisplay />
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;