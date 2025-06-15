import React from 'react';

function Login() {
  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google?state=react';
  };

  return (
    <div>
      <h2>Login com Google</h2>
      <button onClick={handleLogin}>
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google"
        style={{ height: '18px', verticalAlign: 'middle', marginRight: '6px' }} />Entrar com Google</button>
    </div>
  );
}

export default Login;