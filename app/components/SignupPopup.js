/**
 * SignupPopup.js — Pop-up d'invitation à l'inscription
 * 
 * S'affiche automatiquement lors de la première visite du site.
 * Utilise un cookie (localStorage) pour ne pas réapparaître
 * à chaque visite. Invite l'utilisateur à créer un compte
 * pour bénéficier de promotions exclusives.
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SignupPopup() {
  // Contrôle la visibilité du pop-up
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Vérifie si l'utilisateur a déjà fermé le pop-up
    const dismissed = localStorage.getItem('namasthe_popup_dismissed');
    if (!dismissed) {
      // Affiche le pop-up après un court délai (2 secondes)
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  /**
   * Ferme le pop-up et enregistre dans localStorage
   * pour ne plus le montrer lors des prochaines visites
   */
  const handleClose = () => {
    setVisible(false);
    localStorage.setItem('namasthe_popup_dismissed', 'true');
  };

  // Ne rien afficher si le pop-up est fermé
  if (!visible) return null;

  return (
    <div className="popup-overlay" id="signup-popup-overlay" onClick={handleClose}>
      <div className="popup" id="signup-popup" onClick={(e) => e.stopPropagation()}>
        {/* Bouton de fermeture */}
        <button className="popup-close" onClick={handleClose} aria-label="Fermer">
          ✕
        </button>

        {/* Contenu du pop-up */}
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🍃</div>
        <h2>Bienvenue chez Namasthé !</h2>
        <p>
          Créez votre compte et <strong>obtenez un code promo de 10% de rabais</strong>{' '}pour votre première visite, en plus de profiter de promotions exclusives, 
          d&apos;événements VIP et de recommandations personnalisées.
        </p>

        {/* Boutons d'action */}
        <Link href="/inscription" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }} onClick={handleClose}>
          Créer un compte
        </Link>
        <button
          onClick={handleClose}
          style={{ fontSize: '0.85rem', color: '#8A7A72', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Non merci, peut-être plus tard
        </button>
      </div>
    </div>
  );
}
