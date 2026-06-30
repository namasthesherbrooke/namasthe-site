'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function HistoriqueVentesPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user && session.user.email === 'namasthesherbrooke@gmail.com') {
      setIsAdmin(true);
      fetchAllOrders(session.user.email);
    } else {
      setLoading(false);
    }
  };

  const fetchAllOrders = async (email) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sales-history?adminEmail=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        console.error("Erreur API ventes:", data.error);
      }
    } catch (err) {
      console.error("Erreur", err);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        alert('Erreur: ' + (data.error || 'Mise à jour échouée'));
      }
    } catch (err) {
      alert('Erreur de connexion');
    }
    setUpdatingId(null);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span style={{ background: '#FFF3E0', color: '#E65100', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>📥 Reçue</span>;
      case 'preparing': return <span style={{ background: '#E3F2FD', color: '#1565C0', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>☕ En Préparation</span>;
      case 'ready': return <span style={{ background: '#E8F5E9', color: '#2E7D32', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>✅ Prête</span>;
      case 'completed': return <span style={{ background: '#F3E5F5', color: '#7B1FA2', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>🛍️ Complétée</span>;
      default: return <span style={{ background: '#eee', color: '#666', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>{status}</span>;
    }
  };

  const getNextStatus = (status) => {
    switch(status) {
      case 'pending': return { next: 'preparing', label: '☕ Commencer la préparation', color: '#1565C0' };
      case 'preparing': return { next: 'ready', label: '✅ Marquer comme prête', color: '#FF9800' };
      case 'ready': return { next: 'completed', label: '🛍️ Terminer la commande', color: '#4CAF50' };
      default: return null;
    }
  };

  // Parse la description du produit depuis custom_instructions
  // Format stocké: "Nom du produit - Variation (Avec 2x Framboise, 1x Mangue) - Prix$"
  const parseDescription = (item) => {
    const raw = item.custom_instructions || '';
    // Séparer le nom du prix (format: "Nom - Prix$")
    const parts = raw.split(' - ');
    if (parts.length >= 2) {
      // Le dernier élément est le prix, tout le reste est la description
      const priceStr = parts[parts.length - 1];
      const description = parts.slice(0, -1).join(' - ');
      return { description, price: priceStr };
    }
    return { description: raw || 'Produit', price: '' };
  };

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  if (loading) {
    return <div style={{ padding: '100px 20px', textAlign: 'center', fontSize: '1.5rem', color: 'var(--crimson)' }}>Chargement de l'historique...</div>;
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h1 style={{ color: '#D32F2F' }}>Accès Refusé</h1>
        <p>Seul le compte administrateur peut accéder à cette page.</p>
        <Link href="/mon-compte" style={{ display: 'inline-block', marginTop: '20px', color: 'var(--crimson)' }}>Retour à mon compte</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 20px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', color: '#E65100', fontSize: '2.5rem', margin: 0 }}>📈 Historique des Ventes</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => { const email = 'namasthesherbrooke@gmail.com'; fetchAllOrders(email); }}
            style={{ padding: '10px 20px', background: 'var(--crimson)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🔄 Rafraîchir
          </button>
          <Link href="/mon-compte" style={{ padding: '10px 20px', background: '#eee', color: '#333', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            Retour
          </Link>
        </div>
      </div>

      {/* Filtres de statut */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: '📋 Toutes', count: orders.length },
          { key: 'pending', label: '📥 Reçues', count: orders.filter(o => o.status === 'pending').length },
          { key: 'preparing', label: '☕ En Préparation', count: orders.filter(o => o.status === 'preparing').length },
          { key: 'ready', label: '✅ Prêtes', count: orders.filter(o => o.status === 'ready').length },
          { key: 'completed', label: '🛍️ Complétées', count: orders.filter(o => o.status === 'completed').length },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: filterStatus === f.key ? '2px solid var(--crimson)' : '2px solid #ddd',
              background: filterStatus === f.key ? 'var(--crimson)' : 'white',
              color: filterStatus === f.key ? 'white' : '#333',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Résumé rapide */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-around', textAlign: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--crimson)' }}>{orders.length}</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Commandes totales</div>
        </div>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2E7D32' }}>{orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0).toFixed(2)}$</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Revenu total</div>
        </div>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#E65100' }}>{orders.filter(o => o.status === 'pending' || o.status === 'preparing').length}</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>En cours</div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#FAFAFA', borderRadius: '16px' }}>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>Aucune commande trouvée pour ce filtre.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredOrders.map(order => {
            const nextAction = getNextStatus(order.status);
            const isUpdating = updatingId === order.id;

            return (
              <div key={order.id} style={{ 
                background: 'white', 
                border: order.status === 'pending' ? '2px solid #E65100' : '1px solid #ddd', 
                borderRadius: '12px', 
                padding: '24px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                opacity: isUpdating ? 0.7 : 1,
                transition: 'all 0.3s'
              }}>
                {/* En-tête de commande */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#2C1810', fontSize: '1.3rem' }}>
                      Commande {order.order_number || `#${order.id.split('-')[0]}`}
                    </h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                      {new Date(order.created_at).toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {getStatusBadge(order.status)}
                    <p style={{ margin: '8px 0 0 0', fontWeight: 'bold', fontSize: '1.2rem', color: '#2C1810' }}>
                      {parseFloat(order.total_amount).toFixed(2)}$
                    </p>
                  </div>
                </div>

                {/* Client */}
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#5A4A42' }}>Client : <span style={{ fontWeight: 'normal' }}>{order.customer_name}</span></p>
                  {order.customer_email && <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{order.customer_email}</p>}
                </div>

                {/* Description de la commande */}
                <div style={{ background: '#F9F9F9', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#2C1810' }}>📝 Description :</h4>
                  {order.order_items && order.order_items.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {order.order_items.map((item, idx) => {
                        const parsed = parseDescription(item);
                        return (
                          <div key={item.id || idx} style={{ 
                            padding: '12px', 
                            background: 'white', 
                            borderRadius: '8px', 
                            border: '1px solid #eee',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '10px'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', color: '#2C1810', fontSize: '1rem', marginBottom: '4px' }}>
                                {item.quantity}x {parsed.description}
                              </div>
                              {parsed.price && (
                                <div style={{ color: '#888', fontSize: '0.85rem' }}>
                                  Prix unitaire : {parsed.price}
                                </div>
                              )}
                            </div>
                            {item.item_total_price > 0 && (
                              <div style={{ fontWeight: 'bold', color: 'var(--green-tropical)', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                                {parseFloat(item.item_total_price).toFixed(2)}$
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ color: '#888', fontStyle: 'italic', margin: 0 }}>Aucun détail disponible</p>
                  )}
                </div>

                {/* Boutons d'action - changement de statut */}
                {nextAction && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => updateOrderStatus(order.id, nextAction.next)}
                      disabled={isUpdating}
                      style={{
                        flex: 1,
                        padding: '14px 20px',
                        background: nextAction.color,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: isUpdating ? 'wait' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: isUpdating ? 0.6 : 1,
                        boxShadow: `0 2px 8px ${nextAction.color}40`
                      }}
                    >
                      {isUpdating ? '⏳ Mise à jour...' : nextAction.label}
                    </button>
                  </div>
                )}

                {order.status === 'completed' && (
                  <div style={{ padding: '10px', background: '#F3E5F5', borderRadius: '8px', textAlign: 'center', color: '#7B1FA2', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    ✔️ Commande terminée
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
