'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { supabase } from '@/lib/supabaseClient';
import SquareCheckoutForm from './SquareCheckoutForm';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { fr } from 'date-fns/locale/fr';

registerLocale('fr', fr);

const OPENING_HOURS = {
  0: null, // Dimanche fermé
  1: null, // Lundi fermé
  2: { start: 7, end: 17 }, // Mardi
  3: { start: 7, end: 17 }, // Mercredi
  4: { start: 7, end: 17.5 }, // Jeudi
  5: { start: 7, end: 17.5 }, // Vendredi
  6: { start: 8.5, end: 17 }, // Samedi
};

const formatDate = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

function getAvailableDates() {
  const dates = [];
  let d = new Date();
  let count = 0;
  while(dates.length < 7 && count < 14) {
    count++;
    if (OPENING_HOURS[d.getDay()] !== null) {
      let addDate = true;
      if (formatDate(d) === formatDate(new Date())) {
        const hours = OPENING_HOURS[d.getDay()];
        const nowHour = d.getHours() + (d.getMinutes() + 15) / 60;
        // Le dernier créneau est à (hours.end - 0.5). Si on ne peut pas l'atteindre avec nos 15 min, on désactive.
        if (nowHour > hours.end - 0.5) addDate = false;
      }
      if (addDate) dates.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function getAvailableTimes(dateStr) {
  if (!dateStr) return [];
  const parts = dateStr.split('-');
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const hours = OPENING_HOURS[dateObj.getDay()];
  if (!hours) return [];
  
  const times = [];
  const todayDate = new Date();
  const isToday = formatDate(todayDate) === dateStr;
  let startHour = hours.start;
  
  if (isToday) {
    const minHour = todayDate.getHours() + (todayDate.getMinutes() + 15) / 60;
    if (minHour > startHour) {
      startHour = Math.ceil(minHour * 4) / 4;
    }
  }
  
  // 30 minutes avant la fermeture = hours.end - 0.5
  for (let h = startHour; h <= hours.end - 0.5; h += 0.25) {
    const hh = Math.floor(h);
    const mm = Math.round((h % 1) * 60);
    times.push(`${hh.toString().padStart(2, '0')}:${mm === 0 ? '00' : mm.toString().padStart(2, '0')}`);
  }
  return times;
}

const displayDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const today = new Date();
  if (formatDate(today) === dateStr) return "Aujourd'hui";
  const demain = new Date();
  demain.setDate(demain.getDate() + 1);
  if (formatDate(demain) === dateStr) return "Demain";
  
  const formatted = d.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal, tpsAmount, tvqAmount, grandTotal, isCartOpen, setIsCartOpen, clearCart } = useCart();
  const [checkoutMode, setCheckoutMode] = useState(null); // 'select', 'reserve', 'clover'
  const [reservationData, setReservationData] = useState({ nom: '', telephone: '', heure: '' });
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [session, setSession] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [userPoints, setUserPoints] = useState(0);
  const [pickupType, setPickupType] = useState('Dès que possible');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const availableDates = getAvailableDates();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        setGuestEmail(session.user.email);
        // Récupérer le vrai nom et les points depuis la table profiles
        const { data } = await supabase.from('profiles').select('prenom, nom, fidelite_points').eq('id', session.user.id).single();
        if (data) {
          setUserPoints(data.fidelite_points || 0);
          const fullName = [data.prenom, data.nom].filter(Boolean).join(' ');
          if (fullName) {
            setGuestName(fullName);
          } else if (session.user.user_metadata?.prenom) {
            setGuestName(session.user.user_metadata.prenom);
          }
        } else if (session.user.user_metadata?.prenom) {
          setGuestName(session.user.user_metadata.prenom);
        }
      }
    });
  }, []);

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        onClick={() => setIsCartOpen(false)}
      />
      <div style={{ position: 'fixed', top: 0, right: 0, width: '400px', maxWidth: '100%', height: '100%', background: 'white', zIndex: 1000, boxShadow: '-5px 0 15px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#2C1810' }}>Mon Panier</h2>
          <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>
        
        {/* Jauge de fidélité */}
        {session && (
          <div style={{ padding: '15px 20px', background: '#F8FBF8', borderBottom: '1px solid #eaeaea' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.9rem', color: '#2E7D32', fontWeight: 'bold' }}>Vos points 🍵</span>
              <span style={{ fontSize: '0.85rem', color: '#666' }}>{userPoints} / 10 pour un breuvage gratuit</span>
            </div>
            <div style={{ background: '#E0E0E0', borderRadius: '10px', height: '12px', width: '100%', overflow: 'hidden' }}>
              <div style={{ 
                background: 'linear-gradient(90deg, #4CAF50, #2E7D32)', 
                width: `${Math.min(userPoints * 10, 100)}%`, 
                height: '100%', 
                transition: 'width 1s ease-in-out',
                borderRadius: '10px'
              }}></div>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>Votre panier est vide.</p>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '15px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f5f5f5' }}>
                <img src={item.image} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#2C1810' }}>{item.name}</h4>
                  <p style={{ margin: '0 0 10px 0', color: 'var(--green-tropical)', fontWeight: 'bold' }}>{item.price.toFixed(2)} $</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>+</button>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', height: 'fit-content' }}>🗑️</button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && !reservationSuccess && (
          <div style={{ padding: '20px', borderTop: '1px solid #eaeaea', background: '#fafafa' }}>
            
            {/* SÉLECTEUR D'HEURE DE CUEILLETTE */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#2C1810', fontWeight: 'bold' }}>
                Heure de préparation :
              </label>
              <select 
                value={pickupType} 
                onChange={(e) => {
                  setPickupType(e.target.value);
                  if (e.target.value === 'custom') {
                    setSelectedDate('');
                    setSelectedTime('');
                  }
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: 'white', fontSize: '1rem', color: '#333', marginBottom: '10px' }}
              >
                <option value="Dès que possible">Dès que possible</option>
                <option value="custom">Planifier une commande...</option>
              </select>

              {pickupType === 'custom' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Utilisation de react-datepicker pour bloquer visuellement les jours fermés */}
                    <DatePicker
                      selected={selectedDate ? new Date(selectedDate.split('-')[0], selectedDate.split('-')[1] - 1, selectedDate.split('-')[2]) : null}
                      onChange={(date) => {
                        if (!date) {
                          setSelectedDate('');
                          setSelectedTime('');
                          return;
                        }
                        const dStr = formatDate(date);
                        setSelectedDate(dStr);
                        setSelectedTime('');
                      }}
                      minDate={new Date()}
                      maxDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
                      filterDate={(date) => {
                        const hours = OPENING_HOURS[date.getDay()];
                        if (!hours) return false; // Bloquer Dimanche/Lundi
                        
                        // Bloquer aujourd'hui si trop tard
                        const today = new Date();
                        if (formatDate(date) === formatDate(today)) {
                          const nowHour = today.getHours() + (today.getMinutes() + 15) / 60;
                          if (nowHour > hours.end - 0.5) return false;
                        }
                        return true;
                      }}
                      locale="fr"
                      dateFormat="d MMMM yyyy"
                      placeholderText="Choisir la date"
                      withPortal
                      customInput={
                        <input style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: 'white', fontSize: '1rem', color: '#333', boxSizing: 'border-box', cursor: 'pointer' }} />
                      }
                    />

                  <select 
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    disabled={!selectedDate}
                    style={{ width: '150px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: selectedDate ? 'white' : '#f5f5f5', fontSize: '1rem', color: '#333' }}
                  >
                    <option value="" disabled>Choisir l'heure</option>
                    {getAvailableTimes(selectedDate).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '1rem', color: '#666' }}>
              <span>Sous-total :</span>
              <span>{cartTotal.toFixed(2)} $</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '1rem', color: '#666' }}>
              <span>TPS (5%) :</span>
              <span>{tpsAmount.toFixed(2)} $</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '1rem', color: '#666' }}>
              <span>TVQ (9.975%) :</span>
              <span>{tvqAmount.toFixed(2)} $</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.2rem', fontWeight: 'bold', color: '#2C1810' }}>
              <span>Total :</span>
              <span>{grandTotal.toFixed(2)} $</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={async () => {
                  try {
                    setCheckoutMode('loading');
                    const items = cart.map(item => {
                      // Extraire la personnalisation du nom s'il y en a une
                      const hasCustomization = item.name.includes('(') || item.name.includes('[');
                      return {
                        id: item.base_product_id,
                        quantity: item.quantity,
                        attributes: hasCustomization ? [{ key: "Personnalisation", value: item.name }] : []
                      };
                    });
                    const res = await fetch('/api/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ items })
                    });
                    const data = await res.json();
                    if (data.success && data.url) {
                      window.location.href = data.url;
                    } else {
                      alert("Erreur lors de la création du paiement : " + (data.error || "Inconnue"));
                      setCheckoutMode(null);
                    }
                  } catch (e) {
                    alert("Erreur réseau.");
                    setCheckoutMode(null);
                  }
                }}
                disabled={checkoutMode === 'loading'}
                style={{ width: '100%', padding: '15px', background: '#2C1810', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: checkoutMode === 'loading' ? 'not-allowed' : 'pointer', opacity: checkoutMode === 'loading' ? 0.7 : 1 }}
              >
                {checkoutMode === 'loading' ? 'Redirection vers Shopify...' : '💳 Payer en ligne (Sécurisé)'}
              </button>
            </div>
          </div>
        )}

        {reservationSuccess && (
          <div style={{ padding: '30px', textAlign: 'center', background: '#E8F5E9', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
            <h2 style={{ color: '#2E7D32', marginBottom: '10px' }}>Réservation Confirmée !</h2>
            <p style={{ color: '#388E3C', lineHeight: '1.5' }}>
              Vos articles ont été mis de côté. Vous avez <strong>24h</strong> pour venir les récupérer et les payer en succursale.
            </p>
            <button onClick={() => { setIsCartOpen(false); setReservationSuccess(false); setCheckoutMode(null); }} style={{ marginTop: '20px', padding: '12px', background: '#2E7D32', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Fermer
            </button>
          </div>
        )}
      </div>
    </>
  );
}
