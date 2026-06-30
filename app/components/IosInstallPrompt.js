'use client';

import { useState, useEffect } from 'react';

export default function IosInstallPrompt() {
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Détection basique de iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // Détection si déjà installé (standalone PWA)
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
    const isPwa = window.matchMedia('(display-mode: standalone)').matches;

    setIsIos(isIosDevice);
    setIsStandalone(isInStandaloneMode || isPwa);

    // Si c'est iOS, pas encore installé, et qu'on n'a pas déjà fermé le prompt aujourd'hui
    if (isIosDevice && !isInStandaloneMode && !isPwa) {
      const promptDismissed = localStorage.getItem('ios_install_prompt_dismissed');
      if (!promptDismissed) {
        // Afficher avec un petit délai pour ne pas agresser l'utilisateur immédiatement
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    // On cache le prompt pendant 7 jours
    localStorage.setItem('ios_install_prompt_dismissed', new Date().getTime().toString());
  };

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 40px)',
      maxWidth: '400px',
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      border: '2px solid var(--crimson)'
    }}>
      <button 
        onClick={handleDismiss}
        style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '1.2rem', color: '#999', cursor: 'pointer' }}
      >
        ✕
      </button>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
        <img src="/logo-new.png" alt="Namasthé" style={{ width: '60px', height: '60px', borderRadius: '12px' }} />
        <div>
          <h3 style={{ margin: '0 0 5px 0', color: '#2C1810', fontSize: '1.1rem' }}>Installer l'Application</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Commandez plus rapidement directement depuis votre écran d'accueil !</p>
        </div>
      </div>

      <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', width: '100%' }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#333' }}>
          Pour installer sur votre iPhone :
        </p>
        <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#555', lineHeight: '1.5' }}>
          <li>Touchez le bouton <strong>Partager</strong> (le carré avec une flèche vers le haut) en bas de l'écran.</li>
          <li>Faites défiler et sélectionnez <strong>Sur l'écran d'accueil</strong>.</li>
        </ol>
      </div>
    </div>
  );
}
