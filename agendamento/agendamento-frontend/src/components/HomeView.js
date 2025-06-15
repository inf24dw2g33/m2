import React from 'react';
import { CalendarDays, Stethoscope } from 'lucide-react';

function HomeView() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      background: '#f5f7fa',
      borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      margin: '40px auto',
      maxWidth: 800,
      padding: 40
    }}>

      <h2 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 12, color: '#222' }}>
        Bem-vindo à Gestão de Consultas Médicas
      </h2>
      <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
        <CalendarDays size={72} color="#3f51b5" strokeWidth={2} />
        <Stethoscope size={72} color="#43a047" strokeWidth={2} />
      </div>
      <p style={{ fontSize: 18, color: '#444', textAlign: 'center' }}>
        Organize as suas consultas e médicos de forma simples e eficiente.<br />
        Use a barra de navegação para explorar os recursos da aplicação.
      </p>
    </div>
  );
}

export default HomeView;