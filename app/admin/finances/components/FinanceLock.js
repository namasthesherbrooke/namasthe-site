'use client';

import { useState, useEffect } from 'react';

export default function FinanceLock({ children, onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if already unlocked in sessionStorage (so it locks again if they close the tab)
  useEffect(() => {
    const savedPin = sessionStorage.getItem('namasthe_finance_pin');
    if (savedPin) {
      checkPin(savedPin, false);
    } else {
      setIsChecking(false);
    }
  }, []);

  const checkPin = async (pinToTest, showErrors = true) => {
    try {
      // Test the PIN against a lightweight API endpoint (e.g. fetching categories)
      const res = await fetch('/api/admin/finances?action=categories', {
        headers: {
          'x-finance-pin': pinToTest
        }
      });

      if (res.ok) {
        sessionStorage.setItem('namasthe_finance_pin', pinToTest);
        setIsUnlocked(true);
        if (onUnlock) onUnlock(pinToTest);
      } else {
        if (showErrors) setError('Code PIN incorrect.');
        sessionStorage.removeItem('namasthe_finance_pin');
      }
    } catch (err) {
      if (showErrors) setError('Erreur de connexion.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (pin.length < 4) {
      setError('Le code PIN doit contenir au moins 4 caractères.');
      return;
    }
    checkPin(pin);
  };

  if (isChecking) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>Chargement sécurisé...</div>;
  }

  if (isUnlocked) {
    return children;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔒</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', color: '#2C1810', marginBottom: '10px' }}>Espace Finances</h2>
        <p style={{ color: '#666', marginBottom: '30px', fontSize: '0.95rem' }}>Cette section est protégée par un code PIN distinct du portail administrateur.</p>
        
        <form onSubmit={handleSubmit}>
          <input 
            type="password" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Code PIN à 4 chiffres"
            maxLength="10"
            style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '5px' }}
            autoFocus
          />
          {error && <p style={{ color: 'red', marginBottom: '15px', fontSize: '0.9rem' }}>{error}</p>}
          <button 
            type="submit"
            style={{ width: '100%', padding: '14px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={(e) => e.target.style.background = '#1D4ED8'}
            onMouseLeave={(e) => e.target.style.background = '#2563EB'}
          >
            Déverrouiller
          </button>
        </form>
        
        <p style={{ marginTop: '20px', fontSize: '0.8rem', color: '#999' }}>Le PIN par défaut est 2026. Il peut être modifié dans les variables d'environnement.</p>
      </div>
    </div>
  );
}
