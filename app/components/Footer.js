/**
 * Footer.js — Pied de page du site Café Namasthé
 * 
 * Affiche :
 * - Logo "Café Namasthé"
 * - Texte de copyright
 * - Liens vers réseaux sociaux (Facebook, Instagram) et avis clients
 */

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="footer-inner">
        {/* Logo en pied de page */}
        <div className="footer-logo-container">
          <Link href="/" className="footer-logo-link">
            <img src="/logo-new.png" alt="Café Namasthé" className="footer-logo-img" />
          </Link>
        </div>

        {/* Liens utiles */}
        <div style={{ margin: '20px 0' }}>
          <h4 style={{ color: '#2C1810', marginBottom: '15px', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>Liens utiles</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><Link href="/boutique" style={{ color: '#B8003E', textDecoration: 'none', fontWeight: 'bold' }}>La Boutique</Link></li>
            <li><Link href="/creations" style={{ color: '#B8003E', textDecoration: 'none', fontWeight: 'bold' }}>Nos créations</Link></li>
            <li><Link href="/nos-partenaires" style={{ color: '#B8003E', textDecoration: 'none', fontWeight: 'bold' }}>Nos Partenaires</Link></li>
            <li><Link href="/politique-confidentialite" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}>Politique de Confidentialité</Link></li>
          </ul>
        </div>

        {/* Liens vers les réseaux sociaux */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', margin: '20px 0' }}>
          <span style={{ fontWeight: 'bold', color: '#2C1810', fontSize: '1.2rem' }}>
            Rejoignez la communauté :
          </span>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="https://www.facebook.com/namasthesherbrooke/?locale=fr_CA" target="_blank" rel="noopener noreferrer">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#1877F2', transition: 'transform 0.2s' }}>
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </Link>
            <Link href="https://www.instagram.com/cafe.namasthe.sherbrooke" target="_blank" rel="noopener noreferrer">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#E1306C', transition: 'transform 0.2s' }}>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </Link>
          </div>
        </div>

        {/* Copyright avec année courante */}
        <p className="footer-copy" style={{ color: '#666', marginTop: '20px', fontWeight: '500', width: '100%', textAlign: 'center' }}>
          © {new Date().getFullYear()} Café Namasthé.
        </p>
      </div>
    </footer>
  );
}
