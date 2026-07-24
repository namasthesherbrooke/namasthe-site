'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

export default function StatistiquesPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("Non authentifié");
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) throw new Error("Erreur de récupération des données");
      
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#4CAF50', '#8B002E', '#FF9800', '#2196F3', '#9C27B0', '#FFC107', '#00BCD4'];

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Chargement des statistiques...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>Erreur: {error}</div>;
  if (!stats) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', color: '#2C1810', margin: 0 }}>📊 Statistiques du Club Namasthé</h1>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
          <div style={{ fontSize: '1rem', color: '#666', marginBottom: '10px' }}>Total des membres</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#4CAF50' }}>{stats.totalProfiles}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
        
        {/* Ligne 1: Inscriptions */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#2C1810', marginBottom: '20px' }}>Évolution des Inscriptions</h2>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.registrationsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="inscriptions" name="Nouveaux membres" stroke="#4CAF50" strokeWidth={3} dot={{ r: 6, fill: '#4CAF50', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ligne 2: Âge et Code Postal */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
          
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#2C1810', marginBottom: '20px' }}>Achalandage (14 derniers jours)</h2>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.visitsTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666' }} allowDecimals={false} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f5f5f5' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="visites" name="Visites" fill="#2196F3" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#2C1810', marginBottom: '20px' }}>Dernières visites en boutique</h2>
            <div style={{ height: 300, overflowY: 'auto', paddingRight: '10px' }}>
              {stats.recentVisitsList && stats.recentVisitsList.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {stats.recentVisitsList.map((visit, idx) => (
                    <li key={idx} style={{ 
                      padding: '12px 15px', 
                      borderBottom: idx === stats.recentVisitsList.length - 1 ? 'none' : '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: idx % 2 === 0 ? '#fafafa' : 'white',
                      borderRadius: '8px'
                    }}>
                      <span style={{ fontWeight: '500', color: '#333' }}>{visit.nom}</span>
                      <span style={{ fontSize: '0.85rem', color: '#888', background: '#eee', padding: '4px 8px', borderRadius: '12px' }}>{visit.date}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                  Aucune visite récente enregistrée ou trigger non configuré.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Ligne 3: Âge et Code Postal */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
          
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#2C1810', marginBottom: '20px' }}>Pyramide des âges</h2>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.ageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="valeur"
                  >
                    {stats.ageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#2C1810', marginBottom: '20px' }}>Top 10 Régions (Codes Postaux)</h2>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.postalData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#666' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f5f5f5' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="clients" name="Membres" fill="#8B002E" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
