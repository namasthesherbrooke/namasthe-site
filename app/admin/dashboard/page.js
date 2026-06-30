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

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user && session.user.email === 'namasthesherbrooke@gmail.com') {
      setIsAdmin(true);
      fetchProfiles();
    } else {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/profiles', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success) {
        setProfiles(data.profiles);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
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
        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, fidelite_points: data.points, tickets: data.tickets } : p));
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
