'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

function DesinscriptionContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading', 'confirming', 'success', 'error'
  const id = searchParams.get('id');

  const handleUnsubscribe = async () => {
    setStatus('loading');
    try {
      const { error } = await supabase.rpc('unsubscribe_user', { user_id: id });
      if (error) {
        console.error("RPC Error:", error);
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch (err) {
      console.error("Catch Error:", err);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!id) {
      setStatus('error');
    } else {
      setStatus('confirming');
    }
  }, [id]);

  if (status === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(184, 0, 62, 0.1)',
          borderTop: '4px solid var(--crimson)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p style={{ color: 'var(--text-medium)', fontSize: '1.05rem' }}>Désinscription en cours...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>⚠️</div>
        <h2 style={{ color: 'var(--crimson)', marginBottom: '12px', fontSize: '1.8rem' }}>Lien invalide</h2>
        <p style={{ color: 'var(--text-medium)', marginBottom: '30px', fontSize: '1.05rem', lineHeight: '1.6' }}>
          Ce lien de désinscription est invalide ou a expiré. Si vous continuez à recevoir nos e-mails, veuillez vous connecter à votre compte pour gérer vos préférences.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/connexion" className="btn btn-outline" style={{ display: 'inline-flex' }}>
            Se connecter
          </Link>
          <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex' }}>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>🍃</div>
        <h2 style={{ color: 'var(--green-tropical)', marginBottom: '12px', fontSize: '1.8rem' }}>Désinscription réussie</h2>
        <p style={{ color: 'var(--text-medium)', marginBottom: '30px', fontSize: '1.05rem', lineHeight: '1.6' }}>
          Vous avez été désinscrit avec succès de l'infolettre Namasthé. Vous ne recevrez plus nos promotions par courriel.
        </p>
        <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex' }}>
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>✉️</div>
      <h2 style={{ color: 'var(--text-dark)', marginBottom: '12px', fontSize: '1.8rem' }}>Confirmer la désinscription</h2>
      <p style={{ color: 'var(--text-medium)', marginBottom: '30px', fontSize: '1.05rem', lineHeight: '1.6' }}>
        Voulez-vous vraiment vous désinscrire de l'infolettre Namasthé et ne plus recevoir nos offres exclusives par courriel ?
      </p>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button onClick={handleUnsubscribe} className="btn btn-primary" style={{ display: 'inline-flex' }}>
          Oui, me désinscrire
        </button>
        <Link href="/" className="btn btn-outline" style={{ display: 'inline-flex' }}>
          Annuler
        </Link>
      </div>
    </div>
  );
}

export default function DesinscriptionPage() {
  return (
    <section className="section" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ 
        maxWidth: '560px', 
        width: '100%', 
        background: 'var(--white)', 
        padding: '50px 40px', 
        borderRadius: 'var(--radius-lg)', 
        boxShadow: 'var(--shadow-md)',
        border: '1px solid rgba(0,0,0,0.04)'
      }}>
        <Suspense fallback={<div style={{ textAlign: 'center', color: 'var(--text-light)' }}>Chargement...</div>}>
          <DesinscriptionContent />
        </Suspense>
      </div>
    </section>
  );
}
