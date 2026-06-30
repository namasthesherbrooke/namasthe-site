'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    // Demander la réinitialisation du mot de passe
    // L'URL de redirection doit mener vers la page de création du nouveau mot de passe
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nouveau-mot-de-passe`,
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
    } else {
      setStatus('success');
    }
  };

  return (
    <section className="section" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="form-section" style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: 12 }}>🔒</div>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Mot de passe oublié ?</h2>
        
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ background: '#E8F5E9', color: '#388E3C', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Lien envoyé !</h3>
              <p style={{ color: '#2D5A3D', fontSize: '0.95rem' }}>
                Si un compte est associé à <strong>{email}</strong>, vous recevrez un courriel avec un lien sécurisé pour réinitialiser votre mot de passe.
              </p>
            </div>
            <Link href="/connexion" className="btn btn-outline">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} id="forgot-password-form">
            <p style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-medium)' }}>
              Entrez l'adresse courriel associée à votre compte. Nous vous enverrons un lien pour créer un nouveau mot de passe.
            </p>

            {status === 'error' && (
              <div style={{ background: '#FDECEA', color: '#D32F2F', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                {errorMessage}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label htmlFor="reset-email">Adresse courriel</label>
              <input 
                type="email" 
                id="reset-email" 
                placeholder="votre@email.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                disabled={status === 'loading'}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary form-submit" 
              disabled={status === 'loading'}
              style={{ width: '100%', marginBottom: '16px' }}
            >
              {status === 'loading' ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <Link href="/connexion" style={{ fontSize: '0.9rem', color: 'var(--text-light)', textDecoration: 'underline' }}>
                Annuler et retourner à la connexion
              </Link>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
