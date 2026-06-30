'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function OrderHistoryContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  
  // État pour la recherche invité
  const [guestMode, setGuestMode] = useState(false);
  const [searchNumber, setSearchNumber] = useState(searchParams.get('numero') || '');
  const [searchEmail, setSearchEmail] = useState(searchParams.get('email') || '');
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchOrders(session.user.id);
      } else {
        setGuestMode(true);
        setLoading(false);
        // Auto-search if params present
        if (searchNumber && searchEmail) {
          fetchGuestOrder(searchNumber, searchEmail);
        }
      }
    });
  }, []);

  const fetchOrders = async (userId) => {
    try {
      const res = await fetch(`/api/orders/history?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        console.error('Erreur API historique:', data.error);
      }
    } catch (err) {
      console.error('Erreur chargement historique', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuestOrder = async (numero, email) => {
    setLoading(true);
    setSearchError('');
    try {
      const res = await fetch(`/api/orders/status?numero=${encodeURIComponent(numero)}&email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setOrders([data.order]);
      } else {
        setSearchError(data.error || 'Commande introuvable. Vérifiez vos informations.');
        setOrders([]);
      }
    } catch (err) {
      setSearchError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSearch = (e) => {
    e.preventDefault();
    if (!searchNumber || !searchEmail) {
      setSearchError('Veuillez remplir les deux champs.');
      return;
    }
    fetchGuestOrder(searchNumber, searchEmail);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span style={{ background: '#FFF3E0', color: '#E65100', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>📥 Reçue</span>;
      case 'preparing': return <span style={{ background: '#E3F2FD', color: '#1565C0', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>☕ En Préparation</span>;
      case 'ready': return <span style={{ background: '#E8F5E9', color: '#2E7D32', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>✅ Prête</span>;
      case 'completed': return <span style={{ background: '#F5F5F5', color: '#666', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>🛍️ Terminée</span>;
      default: return <span style={{ background: '#eee', color: '#666', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem' }}>{status}</span>;
    }
  };

  // Extraire le nom et le prix depuis custom_instructions (format: "Nom - Prix$")
  const parseItemDescription = (item) => {
    const raw = item.custom_instructions || item.product_name || 'Article';
    const parts = raw.split(' - ');
    if (parts.length >= 2) {
      const priceStr = parts[parts.length - 1];
      const description = parts.slice(0, -1).join(' - ');
      return { name: description, price: parseFloat(priceStr) || 0 };
    }
    return { name: raw || 'Produit', price: 0 };
  };

  const renderTimeline = (order) => (
    <div style={{ marginTop: '15px', background: '#f5f5f5', borderRadius: '8px', padding: '12px' }}>
      <p style={{ margin: '0 0 8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Chronologie :</p>
      <div style={{ fontSize: '0.85rem', color: '#444', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div><strong style={{ color: '#333' }}>Reçu :</strong> {new Date(order.created_at).toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' })}</div>
        {order.preparing_at && <div><strong style={{ color: '#1565C0' }}>En préparation :</strong> {new Date(order.preparing_at).toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' })}</div>}
        {order.ready_at && <div><strong style={{ color: '#FF9800' }}>Prêt :</strong> {new Date(order.ready_at).toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' })}</div>}
        {order.completed_at && <div><strong style={{ color: '#4CAF50' }}>Complété :</strong> {new Date(order.completed_at).toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' })}</div>}
      </div>
    </div>
  );

  if (loading) {
    return <div style={{ padding: '120px 20px', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>Chargement...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 20px 60px', fontFamily: 'var(--font-sans)', minHeight: '80vh' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--crimson)', fontSize: '2.5rem', marginBottom: '10px' }}>Historique de vos commandes</h1>
      
      {/* Sous-titre contextuel */}
      {guestMode && (
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Retrouvez votre commande en entrant votre numéro et votre courriel.
        </p>
      )}
      {!guestMode && session && (
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Toutes vos commandes passées sur le site.
        </p>
      )}

      {/* Formulaire de recherche invité */}
      {guestMode && (
        <form onSubmit={handleGuestSearch} style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#2C1810', fontWeight: 'bold', fontSize: '0.9rem' }}>Numéro de commande</label>
              <input 
                type="text" 
                value={searchNumber} 
                onChange={e => setSearchNumber(e.target.value.toUpperCase())} 
                placeholder="NAM-XXXX"
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#2C1810', fontWeight: 'bold', fontSize: '0.9rem' }}>Courriel utilisé</label>
              <input 
                type="email" 
                value={searchEmail} 
                onChange={e => setSearchEmail(e.target.value)} 
                placeholder="votre@courriel.com"
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {searchError && (
            <div style={{ color: '#D32F2F', marginBottom: '15px', padding: '10px', background: '#FDECEA', borderRadius: '8px', fontSize: '0.95rem' }}>
              {searchError}
            </div>
          )}

          <button type="submit" style={{ width: '100%', padding: '14px', background: 'var(--crimson)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
            🔍 Rechercher ma commande
          </button>

          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <a href="/connexion" style={{ color: 'var(--crimson)', textDecoration: 'underline', fontSize: '0.9rem' }}>
              Se connecter pour voir tout l'historique
            </a>
          </div>
        </form>
      )}
      
      {orders.length === 0 && !guestMode ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <p style={{ color: '#666', fontSize: '1.2rem' }}>Vous n'avez pas encore de commandes.</p>
          <a href="/commande" style={{ display: 'inline-block', marginTop: '15px', padding: '10px 20px', background: 'var(--crimson)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Commander maintenant</a>
        </div>
      ) : orders.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Section Commandes En Cours */}
          {orders.some(o => o.status !== 'completed') && (
            <div>
              <h2 style={{ fontSize: '1.8rem', color: '#E65100', marginBottom: '20px', borderBottom: '2px solid #E65100', paddingBottom: '10px' }}>En cours</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {orders.filter(o => o.status !== 'completed').map(order => (
                  <div key={order.id} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(230,81,0,0.15)', overflow: 'hidden', border: '1px solid #FFE0B2' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: '#FFF3E0' }}>
                      <div>
                        <h3 style={{ margin: '0 0 5px', color: '#E65100' }}>Commande {order.order_number || order.id.slice(0,8)}</h3>
                        <p style={{ margin: 0, color: '#F57C00', fontSize: '0.9rem' }}>{new Date(order.created_at).toLocaleString('fr-CA')}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--green-tropical)', fontSize: '1.2rem' }}>{parseFloat(order.total_amount).toFixed(2)}$</span>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                    <div style={{ padding: '0 20px' }}>
                      {renderTimeline(order)}
                    </div>
                    <div style={{ padding: '20px', background: 'white' }}>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {order.order_items && order.order_items.map((item, index) => {
                          const parsed = parseItemDescription(item);
                          return (
                            <li key={index} style={{ marginBottom: '8px', color: '#333', display: 'flex', justifyContent: 'space-between', fontWeight: '500' }}>
                              <span>{item.quantity}x {parsed.name}</span>
                              <span>{parsed.price.toFixed(2)}$</span>
                            </li>
                          );
                        })}
                      </ul>
                      <div style={{ marginTop: '20px', textAlign: 'right' }}>
                        <a href={`/commande/statut?numero=${order.order_number}`} style={{ background: '#E65100', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 'bold', display: 'inline-block' }}>Suivre en direct ⏱️</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Commandes Terminées */}
          {orders.some(o => o.status === 'completed') && (
            <div>
              <h2 style={{ fontSize: '1.5rem', color: '#666', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Terminées</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {orders.filter(o => o.status === 'completed').map(order => (
                  <div key={order.id} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden', opacity: 0.85 }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 5px', color: '#2C1810' }}>Commande {order.order_number || order.id.slice(0,8)}</h3>
                        <p style={{ margin: 0, color: '#999', fontSize: '0.9rem' }}>{new Date(order.created_at).toLocaleString('fr-CA')}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--green-tropical)', fontSize: '1.2rem' }}>{parseFloat(order.total_amount).toFixed(2)}$</span>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                    <div style={{ padding: '0 20px' }}>
                      {renderTimeline(order)}
                    </div>
                    <div style={{ padding: '20px', background: '#fafafa' }}>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {order.order_items && order.order_items.map((item, index) => {
                          const parsed = parseItemDescription(item);
                          return (
                            <li key={index} style={{ marginBottom: '8px', color: '#555', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{item.quantity}x {parsed.name}</span>
                              <span>{parsed.price.toFixed(2)}$</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : null}
    </div>
  );
}

export default function OrderHistory() {
  return (
    <Suspense fallback={<div style={{ padding: '120px 20px', textAlign: 'center' }}>Chargement...</div>}>
      <OrderHistoryContent />
    </Suspense>
  );
}
