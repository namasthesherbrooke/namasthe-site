'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function ScannerContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [status, setStatus] = useState({ loading: false, error: null, success: null });
  const [clientInfo, setClientInfo] = useState(null);

  // Vérifier si l'admin est déjà connecté
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user && session.user.email === 'namasthesherbrooke@gmail.com') {
        localStorage.setItem('namasthe_admin_token', session.access_token);
        setIsAuthenticated(true);
      }
    });

    // Fallback: vérifier le localStorage pour le mot de passe ou token sauvegardé
    const savedPassword = localStorage.getItem('namasthe_admin_pwd');
    const savedToken = localStorage.getItem('namasthe_admin_token');
    if (savedPassword || savedToken) {
      if (savedPassword) setPassword(savedPassword);
      setIsAuthenticated(true);
    }
  }, []);

  // Connexion avec le vrai compte Supabase
  const handleLogin = async (e) => {
    e.preventDefault();
    if (password) {
      // On tente de la connecter avec son compte Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'namasthesherbrooke@gmail.com',
        password: password,
      });

      if (error) {
        alert("Mot de passe incorrect. Assurez-vous d'utiliser le mot de passe de votre compte administrateur.");
      } else {
        if (data && data.session) {
          localStorage.setItem('namasthe_admin_token', data.session.access_token);
        }
        setIsAuthenticated(true);
      }
    }
  };

  const processAction = async (action) => {
    setStatus({ loading: true, error: null, success: null });
    
    try {
      // Utiliser le token sauvegardé dans la session ou via localStorage
      let token = localStorage.getItem('namasthe_admin_token');
      if (!token) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            token = session.access_token;
            localStorage.setItem('namasthe_admin_token', token);
          }
        } catch (e) {
          console.warn("Ignoré getSession erreur", e);
        }
      }

      // Timeout pour fetch au cas où le réseau mobile est très lent
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes

      const res = await fetch('/api/fidelite', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userId, password, action }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('namasthe_admin_pwd');
          localStorage.removeItem('namasthe_admin_token');
          setIsAuthenticated(false);
          setPassword('');
        }
        setStatus({ loading: false, error: data.error || "Erreur inconnue", success: null });
      } else {
        setClientInfo({ prenom: data.prenom, nom: data.nom, points: data.points, tickets: data.tickets });
        
        const c = data.tickets || 0;
        const p = data.points || 0;
        
        setStatus({ 
          loading: false, 
          error: null, 
          success: action === 'add' ? `Point ajouté ! Total: ${p}/10 (Tickets: ${c})` : 
                   action === 'remove' ? `Point retiré ! Total: ${p}/10 (Tickets: ${c})` : 
                   `Ticket utilisé ! Il reste ${c} ticket(s).` 
        });
      }
    } catch (err) {
      console.error("Scanner Error:", err);
      setStatus({ loading: false, error: "Erreur de connexion ou délai dépassé", success: null });
    }
  };

  if (!userId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Erreur : Aucun ID utilisateur détecté dans l'URL. Veuillez scanner à nouveau le code QR.
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '60px 24px', display: 'flex', justifyContent: 'center' }}>
        <form onSubmit={handleLogin} style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ color: '#2C1810', marginBottom: '20px', fontSize: '1.8rem' }}>🔒 Accès Namasthé</h1>
          <p style={{ marginBottom: '24px', color: '#5A4A42' }}>Entrez votre mot de passe pour ajouter des points à ce client.</p>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '20px' }}
            required
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Accéder</button>
        </form>
      </div>
    );
  }

  const coupons = clientInfo ? (clientInfo.tickets || 0) : 0;
  const progression = clientInfo ? (clientInfo.points || 0) : 0;

  return (
    <div style={{ padding: '40px 24px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ color: '#2C1810', marginBottom: '10px' }}>☕ Fidélité Namasthé</h1>
      
      {clientInfo ? (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '15px' }}>
            Client : <strong style={{ fontSize: '1.4rem' }}>{clientInfo.prenom} {clientInfo.nom}</strong>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Progression</div>
              <div style={{ color: 'var(--green-tropical)', fontWeight: 'bold', fontSize: '1.8rem' }}>{progression}/10</div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Tickets 🎟️</div>
              <div style={{ color: '#E91E63', fontWeight: 'bold', fontSize: '1.8rem' }}>{coupons}</div>
            </div>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '1.1rem', marginBottom: '30px', color: '#5A4A42' }}>Prêt à scanner et ajouter des points.</p>
      )}

      {status.error && (
        <div style={{ background: '#FDECEA', color: '#D32F2F', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          ❌ {status.error}
        </div>
      )}

      {status.success && (
        <div style={{ background: '#E8F5E9', color: '#388E3C', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: 'bold' }}>
          ✅ {status.success}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button 
          onClick={() => processAction('add')} 
          disabled={status.loading}
          style={{ background: '#4CAF50', color: 'white', padding: '20px', fontSize: '1.5rem', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(76,175,80,0.3)' }}
        >
          {status.loading ? '...' : '+ 1 POINT'}
        </button>

        <button 
          onClick={() => {
            if (window.confirm("Êtes-vous sûr de vouloir enlever 1 point en cas d'erreur ?")) {
              processAction('remove');
            }
          }} 
          disabled={status.loading || (clientInfo && clientInfo.points === 0)}
          style={{ background: 'transparent', color: '#D32F2F', padding: '12px', fontSize: '1rem', border: '1px solid #D32F2F', borderRadius: '12px', cursor: (clientInfo && clientInfo.points === 0) ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: (clientInfo && clientInfo.points === 0) ? 0.5 : 1 }}
        >
          - 1 POINT (Erreur)
        </button>

        <div style={{ margin: '20px 0', borderTop: '2px dashed #ccc' }}></div>

        <button 
          onClick={() => {
            if (window.confirm("Êtes-vous sûr de vouloir utiliser 1 ticket de boisson gratuite ?")) {
              processAction('claim');
            }
          }} 
          disabled={status.loading || coupons === 0}
          style={{ background: coupons > 0 ? '#FFC107' : '#eee', color: coupons > 0 ? '#2C1810' : '#aaa', padding: '16px', fontSize: '1.1rem', border: 'none', borderRadius: '12px', cursor: coupons > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold', boxShadow: coupons > 0 ? '0 4px 10px rgba(255,193,7,0.3)' : 'none' }}
        >
          🎁 Utiliser 1 ticket
        </button>
      </div>
    </div>
  );
}

export default function AdminScannerPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px' }}>Chargement...</div>}>
      <ScannerContent />
    </Suspense>
  );
}
