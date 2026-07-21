'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    // Vérifier si l'admin est déjà connecté
    const isAuth = localStorage.getItem('namasthe_admin_auth') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    // PIN simple pour l'instant (à changer en production si désiré)
    const normalizedPassword = password.toLowerCase().trim();
    if (normalizedPassword === 'namasthe2026' || normalizedPassword === 'namasthé2026') {
      localStorage.setItem('namasthe_admin_auth', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Mot de passe incorrect');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('namasthe_admin_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9F5F0', fontFamily: 'var(--font-sans)' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--crimson)', marginBottom: '20px', fontSize: '2rem' }}>Admin Namasthé</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>Entrez le mot de passe pour accéder au portail de gestion.</p>
          
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px', fontSize: '1.1rem' }}
              autoFocus
            />
            {error && <p style={{ color: 'red', marginBottom: '15px', fontSize: '0.9rem' }}>{error}</p>}
            <button 
              type="submit"
              style={{ width: '100%', padding: '14px', background: 'var(--crimson)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.target.style.background = 'var(--crimson-light)'}
              onMouseLeave={(e) => e.target.style.background = 'var(--crimson)'}
            >
              Accéder
            </button>
          </form>
        </div>
      </div>
    );
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F7F6', fontFamily: 'var(--font-sans)', position: 'relative' }}>
      
      <style>{`
        .admin-sidebar {
          width: 250px;
          background: #1E293B;
          color: white;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease;
          z-index: 100;
        }
        .admin-overlay {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 90;
        }
        .menu-toggle {
          display: none;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .admin-sidebar {
            position: fixed;
            height: 100vh;
            transform: translateX(-100%);
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .admin-overlay.open {
            display: block;
          }
          .menu-toggle {
            display: block;
          }
        }
      `}</style>

      {/* OVERLAY POUR FERMER LE MENU SUR MOBILE */}
      <div 
        className={`admin-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ padding: '30px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0, color: '#38BDF8' }}>Namasthé</h2>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: '5px 0 0 0' }}>Portail de gestion</p>
        </div>
        
        <nav style={{ padding: '20px 0', flex: 1 }}>
          <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} style={{ 
            display: 'block', padding: '12px 20px', color: pathname === '/admin' ? 'white' : '#94A3B8', 
            background: pathname === '/admin' ? 'rgba(255,255,255,0.05)' : 'transparent',
            textDecoration: 'none', transition: 'all 0.2s', borderLeft: pathname === '/admin' ? '4px solid #38BDF8' : '4px solid transparent'
          }}>
            📊 Tableau de bord
          </Link>
          
          <Link href="/admin/ingredients" onClick={() => setIsMobileMenuOpen(false)} style={{ 
            display: 'block', padding: '12px 20px', color: pathname.includes('/ingredients') ? 'white' : '#94A3B8', 
            background: pathname.includes('/ingredients') ? 'rgba(255,255,255,0.05)' : 'transparent',
            textDecoration: 'none', transition: 'all 0.2s', borderLeft: pathname.includes('/ingredients') ? '4px solid #38BDF8' : '4px solid transparent'
          }}>
            🥑 Ingrédients & Coûts
          </Link>
          
          <Link href="/admin/recettes" onClick={() => setIsMobileMenuOpen(false)} style={{ 
            display: 'block', padding: '12px 20px', color: pathname.includes('/recettes') ? 'white' : '#94A3B8', 
            background: pathname.includes('/recettes') ? 'rgba(255,255,255,0.05)' : 'transparent',
            textDecoration: 'none', transition: 'all 0.2s', borderLeft: pathname.includes('/recettes') ? '4px solid #38BDF8' : '4px solid transparent'
          }}>
            🧪 Calculateur de Recettes
          </Link>
        </nav>
        
        <div style={{ padding: '20px' }}>
          <button 
            onClick={handleLogout}
            style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.1)', color: '#F87171', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main style={{ flex: 1, overflowY: 'auto', width: '100%' }}>
        <header style={{ background: 'white', padding: '15px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
            ☰
          </button>
          <Link href="/" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
            ← Retour au site
          </Link>
        </header>
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      </main>

    </div>
  );
}
