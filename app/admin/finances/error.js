'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Finances Dashboard Crash:', error);
  }, [error]);

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: 'red' }}>Une erreur s'est produite dans le tableau de bord</h2>
      <p style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', color: '#333', marginTop: '20px' }}>
        {error.message || 'Erreur inconnue'}
      </p>
      <button 
        onClick={() => reset()}
        style={{ marginTop: '20px', padding: '10px 20px', background: '#2C1810', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        Réessayer
      </button>
    </div>
  );
}
