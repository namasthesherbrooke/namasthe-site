'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import FideliteManager from '../../components/admin/FideliteManager';
import MenuManager from '../../components/admin/MenuManager';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fidelite'); // 'fidelite', 'menu'
  
  // States for Fidelite
  const [profiles, setProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  
  // States for Stats
  const [totalVisits, setTotalVisits] = useState(0);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user && session.user.email === 'namasthesherbrooke@gmail.com') {
      setIsAdmin(true);
      fetchProfiles(session.access_token);
      fetchStats();
    } else {
      setLoading(false);
    }
  };

  const fetchProfiles = async (token) => {
    setLoading(true);
    try {
      const accessToken = token || (await supabase.auth.getSession()).data?.session?.access_token;
      
      const res = await fetch('/api/admin/profiles', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success) {
        setProfiles(data.profiles);
      } else {
        alert("Erreur de chargement des profils : " + (data.error || "Inconnue"));
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau : " + err.message);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats/get', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setTotalVisits(data.total_views);
      }
    } catch (err) {
      console.error("Erreur stats:", err);
    }
  };

  const handleAction = async (userId, action) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/fidelite', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId, action })
      });
      
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ type: 'success', text: `Mise à jour réussie pour ${data.prenom}` });
        setProfiles(prev => prev.map(p => p.id === userId ? { 
          ...p, 
          fidelite_points: data.points, 
          tickets: data.tickets,
          derniere_visite: data.derniere_visite
        } : p));
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: "Erreur de connexion" });
    }
    
    setTimeout(() => setStatusMessage(null), 3000);
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Chargement...</div>;

  if (!isAdmin) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <h1 style={{ color: '#D32F2F' }}>Accès Refusé</h1>
        <p>Seul le compte administrateur peut accéder à cette plateforme.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      {/* Box Statistiques Rapides */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#FFF', padding: '20px 30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', flex: 1, borderLeft: '5px solid #4ADE80' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '1rem' }}>Visiteurs Uniques (Accueil)</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#2C1810' }}>{totalVisits}</p>
        </div>
        <div style={{ background: '#FFF', padding: '20px 30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', flex: 1, borderLeft: '5px solid #B8003E' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '1rem' }}>Membres Club Namasthé</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#2C1810' }}>{profiles.length}</p>
        </div>
      </div>

      {/* Navigation des onglets */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', borderBottom: '2px solid #eee', paddingBottom: '15px', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('fidelite')}
          style={{ background: 'none', border: 'none', padding: '10px 15px', fontSize: '1.2rem', fontWeight: 'bold', color: activeTab === 'fidelite' ? 'var(--crimson)' : '#666', borderBottom: activeTab === 'fidelite' ? '3px solid var(--crimson)' : 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          ⭐️ Fidélité
        </button>
        <button 
          onClick={() => setActiveTab('menu')}
          style={{ background: 'none', border: 'none', padding: '10px 15px', fontSize: '1.2rem', fontWeight: 'bold', color: activeTab === 'menu' ? 'var(--crimson)' : '#666', borderBottom: activeTab === 'menu' ? '3px solid var(--crimson)' : 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          ☕️ Gestion du Menu
        </button>
      </div>

      {activeTab === 'fidelite' && (
        <FideliteManager 
          profiles={profiles} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          handleAction={handleAction} 
          statusMessage={statusMessage} 
        />
      )}

      {activeTab === 'menu' && <MenuManager />}
    </div>
  );
}
