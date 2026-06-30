'use client';
import { useState } from 'react';

export default function MenuManager() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSync = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/sync-square', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatus({ type: 'success', message: 'Le menu a été synchronisé avec succès depuis Square !' });
      } else {
        setStatus({ type: 'error', message: data.error || 'Erreur lors de la synchronisation.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Erreur réseau.' });
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#2C1810', margin: 0 }}>Gestion du Menu</h1>
      </div>

      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <h2 style={{ color: '#2C1810', marginTop: 0, marginBottom: '20px' }}>Synchronisation Square</h2>
        <p style={{ color: '#666', marginBottom: '30px', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 30px' }}>
          Votre menu, vos prix, et vos extras sont désormais gérés <strong>exclusivement</strong> depuis votre tableau de bord Square. 
          Cliquez sur le bouton ci-dessous pour importer les derniers changements de Square vers votre site de commande en ligne et l'application Barista.
        </p>

        {status && (
          <div style={{ 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px', 
            background: status.type === 'success' ? '#E8F5E9' : '#FFEBEE',
            color: status.type === 'success' ? '#2E7D32' : '#C62828',
            fontWeight: 'bold',
            maxWidth: '600px',
            margin: '0 auto 20px'
          }}>
            {status.message}
          </div>
        )}

        <button 
          onClick={handleSync}
          disabled={loading}
          style={{ 
            padding: '15px 30px', 
            borderRadius: '8px', 
            border: 'none', 
            background: loading ? '#ccc' : '#1A73E8', 
            color: 'white', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold',
            fontSize: '1.2rem',
            transition: 'background 0.2s',
            boxShadow: '0 4px 6px rgba(26, 115, 232, 0.2)'
          }}
        >
          {loading ? 'Synchronisation en cours...' : '🔄 Synchroniser le menu avec Square'}
        </button>
      </div>
    </div>
  );
}
