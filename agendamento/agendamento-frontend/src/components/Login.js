import React from 'react';
import googleIcon from '../imagem/google.png';

function Login() {
  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google?state=react';
  };

  return (
    <div>
      <h2>Login com Google</h2>
       <button onClick={handleLogin} style={{ /* Adicione algum estilo para o botão */ }}>
        <img
          src={googleIcon} // Usa a imagem importada
          alt="Google"
          style={{ height: '18px', verticalAlign: 'middle', marginRight: '6px' }}
        />
        Entrar com Google
      </button>
    </div>
  );
}

export default Login;