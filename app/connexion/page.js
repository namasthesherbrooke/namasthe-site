/**
 * Connexion — Page de connexion au compte client
 * 
 * Formulaire email + mot de passe pour se connecter.
 * Lien vers la page d'inscription pour les nouveaux utilisateurs.
 * À terme : authentification via Supabase Auth.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Les informations entrées ne sont pas valides, veuillez réessayer.");
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/mon-compte');
      }, 500);
    }
  };

  return (
    <section className="section" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form className="form-section" onSubmit={handleSubmit} id="login-form" style={{ maxWidth: 420 }}>
        <div style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: 12 }}>🍃</div>
        <h2 style={{ textAlign: 'center' }}>Connexion</h2>
        <p style={{ textAlign: 'center' }}>Accédez à votre espace Namasthé</p>

        {error && <div style={{ background: '#FDECEA', color: '#D32F2F', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ background: '#E8F5E9', color: '#388E3C', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>Connexion réussie !</div>}

        <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input type="email" id="login-email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Mot de passe</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input type={showPassword ? "text" : "password"} id="login-password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', paddingRight: '40px' }} />
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
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <Link href="/mot-de-passe-oublie" style={{ fontSize: '0.8rem', color: 'var(--crimson)', textDecoration: 'underline' }}>Mot de passe oublié ?</Link>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary form-submit">Se connecter</button>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem' }}>
          Pas encore de compte ?{' '}
          <Link href="/inscription" style={{ color: '#B8003E', fontWeight: 600 }}>Créer un compte</Link>
        </p>
      </form>
    </section>
  );
}
