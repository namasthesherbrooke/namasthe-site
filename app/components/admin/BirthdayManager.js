'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function BirthdayManager({ profiles = [] }) {
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

  // Filtrer les profils pour le mois en cours
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentMonthName = new Date().toLocaleString('fr-CA', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  const upcomingBirthdays = profiles
    .filter(p => {
      if (!p.date_naissance) return false;
      const parts = p.date_naissance.split('-');
      if (parts.length !== 3) return false;
      const month = parseInt(parts[1], 10);
      return month === currentMonth;
    })
    .sort((a, b) => {
      const dayA = parseInt(a.date_naissance.split('-')[2], 10);
      const dayB = parseInt(b.date_naissance.split('-')[2], 10);
      return dayA - dayB;
    });

  return (
    <div>
      <header style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#2C1810', fontSize: '2rem', marginBottom: '10px' }}>🎁 Cadeaux d'Anniversaire</h2>
        <p style={{ color: '#5A4A42' }}>Gérez les anniversaires et l'historique des cadeaux réclamés.</p>
      </header>

      {/* NOUVELLE SECTION : Anniversaires du mois */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ color: '#E65100', fontSize: '1.5rem', marginBottom: '15px' }}>
          🎂 Anniversaires de {currentMonthName}
        </h3>
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #C8E6C9' }}>Client</th>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #C8E6C9' }}>Date d'anniversaire</th>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #C8E6C9' }}>Contact</th>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #C8E6C9' }}>Statut du cadeau ({currentYear})</th>
              </tr>
            </thead>
            <tbody>
              {upcomingBirthdays.map(profile => {
                // Vérifier si ce client a déjà réclamé son cadeau cette année
                const hasClaimed = claims.some(c => c.profiles?.prenom === profile.prenom && c.profiles?.nom === profile.nom && c.claim_year === currentYear);
                const birthDay = parseInt(profile.date_naissance.split('-')[2], 10);
                const isToday = birthDay === new Date().getDate();

                return (
                  <tr key={profile.id} style={{ borderBottom: '1px solid #eee', background: isToday ? '#FFF9C4' : 'transparent' }}>
                    <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#2C1810' }}>
                      {profile.prenom} {profile.nom} {isToday && '🎉'}
                    </td>
                    <td style={{ padding: '15px 20px', color: '#666', fontWeight: isToday ? 'bold' : 'normal' }}>
                      {birthDay} {currentMonthName}
                    </td>
                    <td style={{ padding: '15px 20px', color: '#666', fontSize: '0.9rem' }}>
                      {profile.email}
                      {profile.telephone && <div>📞 {profile.telephone}</div>}
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      {hasClaimed ? (
                        <span style={{ background: '#E8F5E9', color: '#2E7D32', padding: '5px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          Réclamé ✓
                        </span>
                      ) : (
                        <span style={{ background: '#FFF3E0', color: '#E65100', padding: '5px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          En attente
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {upcomingBirthdays.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#666' }}>Aucun anniversaire ce mois-ci.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <h3 style={{ color: '#5A4A42', fontSize: '1.5rem', marginBottom: '15px' }}>📜 Historique des réclamations</h3>
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
