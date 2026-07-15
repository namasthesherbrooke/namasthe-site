'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function BirthdayManager() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/birthday-claims?t=' + Date.now(), {
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
        setClaims(data.claims);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
    setLoading(false);
  };

  return (
    <div>
      <header style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#2C1810', fontSize: '2rem', marginBottom: '10px' }}>🎁 Cadeaux d'Anniversaire</h2>
        <p style={{ color: '#5A4A42' }}>Historique des cadeaux réclamés par vos clients.</p>
      </header>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#FFF3E0', color: '#E65100' }}>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #FFE0B2' }}>Date de Réclamation</th>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #FFE0B2' }}>Client</th>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #FFE0B2' }}>Cadeau Choisi</th>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #FFE0B2' }}>Année</th>
              </tr>
            </thead>
            <tbody>
              {claims.map(claim => (
                <tr key={claim.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px 20px', color: '#666' }}>
                    {new Date(claim.claimed_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#2C1810' }}>
                    {claim.profiles?.prenom} {claim.profiles?.nom}
                  </td>
                  <td style={{ padding: '15px 20px', color: '#4CAF50', fontWeight: 'bold' }}>
                    {claim.item_claimed}
                  </td>
                  <td style={{ padding: '15px 20px', color: '#888' }}>
                    {claim.claim_year}
                  </td>
                </tr>
              ))}
              {claims.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#666' }}>Aucun cadeau réclamé pour le moment.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
