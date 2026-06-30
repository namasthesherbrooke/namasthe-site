'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function OrderStatusContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('numero') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // S'abonner aux changements de la commande en temps réel
  useEffect(() => {
    if (!order) return;

    const channel = supabase
      .channel('order_status_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` },
        (payload) => {
          setOrder(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id]);

  // Chercher la commande automatiquement si les params sont présents
  useEffect(() => {
    if (orderNumber) {
      // On va vérifier si le user est connecté
      supabase.auth.getSession().then(({ data: { session } }) => {
        fetchOrder(session?.user?.id);
      });
    }
  }, []);

  const fetchOrder = async (userId = null) => {
    if (!orderNumber) return;
    setLoading(true);
    setError('');
    
    try {
      let url = `/api/orders/status?numero=${encodeURIComponent(orderNumber)}`;
      if (userId) url += `&userId=${encodeURIComponent(userId)}`;
      else if (email) url += `&email=${encodeURIComponent(email)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setOrder(data.order);
      } else {
        setError(data.error || 'Commande introuvable.');
        setOrder(null);
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchOrder();
  };

  const getStatusDisplay = (status) => {
    switch(status) {
      case 'pending': return { text: 'Commande Reçue', color: '#FFF3E0', textColor: '#E65100', icon: '📥' };
      case 'preparing': return { text: 'En Préparation', color: '#E3F2FD', textColor: '#1565C0', icon: '☕' };
      case 'ready': return { text: 'Prête à Ramasser', color: '#E8F5E9', textColor: '#2E7D32', icon: '✅' };
      case 'completed': return { text: 'Terminée', color: '#F5F5F5', textColor: '#666', icon: '🛍️' };
      default: return { text: 'Inconnu', color: '#F5F5F5', textColor: '#666', icon: '❓' };
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 20px 60px', fontFamily: 'var(--font-sans)', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--crimson)', fontSize: '2.5rem', marginBottom: '15px' }}>Suivi de Commande</h1>
        <p style={{ color: '#666' }}>Entrez votre numéro de commande pour voir son avancement en direct.</p>
      </div>

      {!order && (
        <form onSubmit={handleSubmit} style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#2C1810', fontWeight: 'bold' }}>Numéro de commande (ex: NAM-XXXX)</label>
            <input 
              type="text" 
              value={orderNumber} 
              onChange={e => setOrderNumber(e.target.value)} 
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1.1rem' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#2C1810', fontWeight: 'bold' }}>Courriel (pour les invités)</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="votre@courriel.com"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1.1rem' }}
            />
          </div>
          
          {error && <div style={{ color: '#D32F2F', marginBottom: '15px', padding: '10px', background: '#FDECEA', borderRadius: '8px' }}>{error}</div>}
          
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', background: 'var(--crimson)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Recherche...' : 'Suivre ma commande'}
          </button>
        </form>
      )}

      {order && (
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '30px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 10px', color: '#2C1810' }}>Commande {order.order_number}</h2>
            <p style={{ color: '#666', margin: 0 }}>Passée par {order.customer_name}</p>
          </div>
          
          <div style={{ padding: '40px 20px', textAlign: 'center', background: getStatusDisplay(order.status).color }}>
            <div style={{ fontSize: '4rem', marginBottom: '15px' }}>{getStatusDisplay(order.status).icon}</div>
            <h3 style={{ margin: 0, fontSize: '2rem', color: getStatusDisplay(order.status).textColor }}>
              {getStatusDisplay(order.status).text}
            </h3>
            
            {order.status !== 'completed' && order.status !== 'ready' && (
              <p style={{ marginTop: '15px', color: '#666' }}>Cette page se mettra à jour automatiquement.</p>
            )}
          </div>
          
          <div style={{ padding: '30px' }}>
            <h4 style={{ margin: '0 0 15px', color: '#2C1810', borderBottom: '2px solid #f5f5f5', paddingBottom: '10px' }}>Détails de la commande</h4>
            <div style={{ marginBottom: '20px' }}>
              {/* Le chargement des items pourrait se faire ici si API renvoie order_items */}
              <p style={{ color: '#666', fontStyle: 'italic', fontWeight: 'bold' }}>Montant total: {order.total_amount.toFixed(2)}$</p>

              <div style={{ marginTop: '20px', background: '#f9f9f9', borderRadius: '12px', padding: '15px', textAlign: 'left' }}>
                <h5 style={{ margin: '0 0 10px', color: '#333' }}>Chronologie de la commande</h5>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: '#555' }}>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Reçu :</strong> {new Date(order.created_at).toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' })}
                  </li>
                  {order.preparing_at && (
                    <li style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#1565C0' }}>En préparation :</strong> {new Date(order.preparing_at).toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' })}
                    </li>
                  )}
                  {order.ready_at && (
                    <li style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#FF9800' }}>Prêt :</strong> {new Date(order.ready_at).toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' })}
                    </li>
                  )}
                  {order.completed_at && (
                    <li style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#4CAF50' }}>Complété :</strong> {new Date(order.completed_at).toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' })}
                    </li>
                  )}
                </ul>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button onClick={() => setOrder(null)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', color: '#666' }}>
                Chercher une autre commande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderStatus() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <OrderStatusContent />
    </Suspense>
  );
}
