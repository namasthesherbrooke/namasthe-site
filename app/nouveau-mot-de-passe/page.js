'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

function NouveauMotDePasseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // States: 'requires_manual_verification', 'verifying', 'idle', 'loading', 'success', 'error'
  const [status, setStatus] = useState(tokenHash ? 'requires_manual_verification' : 'verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (tokenHash) {
      // If a token_hash is present, we don't automatically check session
      // We wait for the user to click the verification button
      return;
    }

    // Ancienne méthode : Vérifier si l'utilisateur a bien une session valide (obtenue via le lien magique de l'email)
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        setStatus('error');
        setErrorMessage("Le lien de réinitialisation est invalide ou a expiré. Veuillez refaire une demande.");
      } else {
        setStatus('idle');
      }
    };
    
    checkSession();
    
    // Supabase intercepte le hash de l'URL automatiquement et crée la session
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('idle');
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [tokenHash]);

  const handleManualVerification = async () => {
    setStatus('verifying');
    setErrorMessage('');

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type || 'recovery',
    });

    if (error) {
      setStatus('error');
      setErrorMessage("Le lien est invalide ou a expiré. " + error.message);
    } else {
      setStatus('idle');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    if (password.length < 8) {
      setStatus('error');
      setErrorMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    // Mettre à jour le mot de passe de l'utilisateur connecté
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
    } else {
      setStatus('success');
    }
  };

  if (status === 'requires_manual_verification') {
    return (
      <section className="section" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="form-section" style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🛡️</div>
          <h2 style={{ marginBottom: '16px' }}>Vérification de sécurité</h2>
          <p style={{ color: 'var(--text-medium)', marginBottom: '24px' }}>
            Pour protéger votre compte contre les systèmes d'analyse automatique de courriels, veuillez cliquer sur le bouton ci-dessous pour confirmer votre demande de réinitialisation.
          </p>
          
          <button 
            onClick={handleManualVerification}
            className="btn btn-primary" 
            style={{ width: '100%' }}
          >
            Confirmer l'accès sécurisé
          </button>
        </div>
      </section>
    );
  }

  if (status === 'verifying') {
    return (
      <section className="section" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-medium)' }}>Vérification du lien sécurisé...</div>
      </section>
    );
  }

  return (
    <section className="section" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="form-section" style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: 12 }}>🔑</div>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Nouveau mot de passe</h2>
        
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ background: '#E8F5E9', color: '#388E3C', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Mot de passe modifié !</h3>
              <p style={{ color: '#2D5A3D', fontSize: '0.95rem' }}>
                Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant accéder à votre compte en toute sécurité.
              </p>
            </div>
            <Link href="/mon-compte" className="btn btn-primary">
              Aller à mon compte
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-medium)' }}>
              Veuillez saisir votre nouveau mot de passe ci-dessous.
            </p>

            {status === 'error' && (
              <div style={{ background: '#FDECEA', color: '#D32F2F', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                {errorMessage}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label htmlFor="new-password">Nouveau mot de passe</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="new-password" 
                  placeholder="Min. 8 caractères" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  minLength={8}
                  disabled={status === 'loading'}
                  style={{ width: '100%', paddingRight: '40px' }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-light)', padding: '0', display: 'flex' }}
                  aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                  title={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary form-submit" 
              disabled={status === 'loading' || status === 'error'}
              style={{ width: '100%' }}
            >
              {status === 'loading' ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default function NouveauMotDePassePage() {
  return (
    <Suspense fallback={
      <section className="section" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-medium)' }}>Chargement...</div>
      </section>
    }>
      <NouveauMotDePasseContent />
    </Suspense>
  );
}
