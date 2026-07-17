/**
 * Header.js — Composant de navigation principal du site Café Namasthé
 * 
 * Inclut :
 * - Banderole promotionnelle défilante (lien vers /promotions)
 * - Logo "Café Namasthé" en crimson italic
 * - Liens de navigation : Accueil, Produits, Événements, Nos Partenaires, Réserver-nous, Commande
 * - Bouton "Mon Compte"
 * - Menu hamburger pour mobile
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useCart } from '../context/CartContext';

export default function Header() {
  // État du menu mobile (ouvert/fermé)
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // État de l'utilisateur
  const [userInitial, setUserInitial] = useState(null);
  
  // Contexte du panier
  const { cartItemCount, setIsCartOpen } = useCart();

  useEffect(() => {
    // Fonction pour récupérer le profil
    const getProfile = async (session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('prenom')
          .eq('id', session.user.id)
          .single();
        if (data && data.prenom) {
          setUserInitial(data.prenom.charAt(0).toUpperCase());
        } else {
          // Fallback si pas de prénom
          setUserInitial(session.user.email.charAt(0).toUpperCase());
        }
      } else {
        setUserInitial(null);
      }
    };

    // Vérifier la session actuelle au montage
    supabase.auth.getSession().then(({ data: { session } }) => {
      getProfile(session);
    });

    // Écouter les changements d'état (connexion/déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      getProfile(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/produits', label: 'Menu' },
    { href: '/quiz', label: '🪄 Quiz' },
    { href: '/boutique', label: 'Boutique' },
    { href: '/promotions', label: 'Promotions' },
    { href: '/creations', label: 'Menu VIP 🔒' },
    { href: '/evenements', label: 'Événements' },
  ];

  // Liste des promotions pour la banderole
  const listePromotions = [
    "DUO : 1,50$ de rabais sur un duo Sandwich + Breuvage 🥪",
    "Spécial de la semaine : 10% de rabais sur 1 breuvage OU 1 Extra gratuit 🎁",
    "Rabais CIUSSS : 15% de rabais pour tout employé du CIUSSS 🏥",
    "Rabais étudiant : 10% de rabais pour tous les étudiants 🎓"
  ];

  const [bannerText, setBannerText] = useState("Découvrez nos promotions en cours ! ✨ Cliquez ici pour voir les offres !");

  useEffect(() => {
    // Mélanger les promotions et les afficher avec un grand espacement
    const shuffled = [...listePromotions].sort(() => 0.5 - Math.random());
    setBannerText(shuffled.join('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0✨\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0•\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0') + '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0✨');
  }, []);

  return (
    <>
      {/* --- Banderole promotionnelle défilante --- */}
      <Link href="/promotions" className="promo-banner" id="promo-banner">
        <div className="promo-banner-inner">
          {bannerText}
        </div>
      </Link>

      {/* --- Navigation principale --- */}
      <header className="header" id="main-header">
        <nav className="nav-container">
          {/* Logo du café */}
          <Link href="/" className="nav-logo" id="nav-logo">
            <img src="/logo-new.png" alt="Café Namasthé" className="nav-logo-img" />
          </Link>

          {/* Liens de navigation (desktop) */}
          <div className="nav-links" id="nav-links-desktop">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={pathname === link.href ? 'active' : ''}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/commande"
              style={{
                background: 'var(--crimson)',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '20px',
                fontWeight: 'bold',
                marginLeft: '15px',
                textDecoration: 'none',
                boxShadow: '0 4px 10px rgba(184, 0, 62, 0.3)'
              }}
            >
              Commander
            </Link>
          </div>

          {/* Section Droite */}
          <div className="nav-right-section">
            <div className="nav-account-section">
              {userInitial ? (
                <Link href="/mon-compte" id="nav-account-bubble" title="Mon compte" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#8B002E',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  textDecoration: 'none'
                }}>
                  {userInitial}
                </Link>
              ) : (
                <Link href="/connexion" className="nav-account-btn" id="nav-account-btn">
                  Connexion
                </Link>
              )}
            </div>

            <div className="nav-actions-section">
              {/* Bouton hamburger - placé à gauche du panier */}
              <button
                className="hamburger"
                onClick={() => setMenuOpen(true)}
                aria-label="Ouvrir le menu"
                id="hamburger-btn"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>

              <button 
                onClick={() => setIsCartOpen(true)}
                style={{ background: 'none', border: 'none', position: 'relative', cursor: 'pointer', padding: '5px' }}
                title="Mon panier"
                className="header-cart-btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2C1810" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                {cartItemCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: '#D32F2F',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* --- Menu mobile plein écran --- */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} id="mobile-menu">
        <button
          className="mobile-menu-close"
          onClick={() => setMenuOpen(false)}
          aria-label="Fermer le menu"
        >
          ✕
        </button>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMenuOpen(false)}
            className={pathname === link.href ? 'active' : ''}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/commande"
          onClick={() => setMenuOpen(false)}
          style={{
            background: 'var(--crimson)',
            color: 'white',
            padding: '12px 30px',
            borderRadius: '30px',
            fontWeight: 'bold',
            marginTop: '20px',
            fontSize: '1.2rem',
            textAlign: 'center',
            textDecoration: 'none'
          }}
        >
          🛍️ Commander
        </Link>
      </div>
    </>
  );
}
