'use client';

import React, { useState } from 'react';
import { PaymentForm, CreditCard, ApplePay, GooglePay } from 'react-square-web-payments-sdk';

export default function SquareCheckoutForm({ amount, cartTotal, tpsAmount, tvqAmount, cart, onSuccess, onCancel, customer_name, customer_email, user_id, pickupTime }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async (token, buyer) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/square', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId: token.token,
          amount: amount, // Grand total
          subtotal: cartTotal,
          tps: tpsAmount,
          tvq: tvqAmount,
          cart: cart,
          customer_name: customer_name,
          customer_email: customer_email,
          user_id: user_id,
          pickupTime: pickupTime
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du paiement');
      }

      onSuccess(data);
    } catch (err) {
      console.error('Erreur Square:', err);
      setError(err.message || 'Une erreur est survenue lors de la communication avec le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '12px', border: '1px solid #eaeaea' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2C1810', textAlign: 'center' }}>
        Paiement Sécurisé ({(amount).toFixed(2)} $)
      </h3>
      
      {error && (
        <div style={{ padding: '10px', background: '#FDECEA', color: '#D32F2F', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', marginBottom: '15px', color: '#666' }}>
          Traitement en cours...
        </div>
      )}

      <div style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.6 : 1 }}>
        <PaymentForm
          applicationId={process.env.NEXT_PUBLIC_SQUARE_APP_ID || 'sandbox-sq0idb-xxx'}
          locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || 'LXXX'}
          cardTokenizeResponseReceived={handlePayment}
          createPaymentRequest={() => ({
            countryCode: 'CA',
            currencyCode: 'CAD',
            total: {
              amount: amount.toFixed(2),
              label: 'Café Namasthé',
            },
          })}
        >
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <ApplePay />
            </div>
            <div style={{ flex: 1 }}>
              <GooglePay />
            </div>
          </div>
          <div style={{ margin: '15px 0', textAlign: 'center', color: '#666', fontSize: '0.9rem', position: 'relative' }}>
            <span style={{ background: '#f9f9f9', padding: '0 10px', position: 'relative', zIndex: 1 }}>Ou payez par carte</span>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid #ddd', zIndex: 0 }}></div>
          </div>
          <CreditCard
            buttonProps={{
              css: {
                backgroundColor: '#2C1810',
                fontSize: '16px',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#4A2F21',
                },
              },
            }}
            focus="cardNumber"
          />
        </PaymentForm>
      </div>

      <button 
        onClick={onCancel}
        disabled={loading}
        style={{ width: '100%', marginTop: '15px', padding: '10px', background: 'transparent', border: 'none', color: '#666', textDecoration: 'underline', cursor: 'pointer' }}
      >
        Annuler
      </button>
      
      <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.8rem', color: '#999' }}>
        Sécurisé par Square 🔒
      </div>
    </div>
  );
}
