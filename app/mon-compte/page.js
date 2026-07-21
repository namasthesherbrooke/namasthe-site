'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function MonComptePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState('Vérification de la connexion...');
  
  const [editing, setEditing] = useState({ email: false, codePostal: false });
  const [formData, setFormData] = useState({ email: '', codePostal: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      const withTimeout = (promise, ms, stepName) => {
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Timeout at ' + stepName)), ms);
        });
        return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
      };

      let session = null;
      try {
        setLoadingStep('Vérification de la session...');
        const { data, error } = await withTimeout(supabase.auth.getSession(), 8000, 'getSession');
        if (error) {
          console.error("Erreur lors de la récupération de la session:", error);
        }
        session = data?.session;
      } catch (e) {
        console.error("Erreur getSession:", e);
        if (e.message && e.message.includes('Timeout')) {
          // Fix for Supabase local storage lock bug on mobile:
          // If getSession hangs, clear local storage to break the corrupted lock.
          if (typeof window !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.includes('-auth-token')) {
                localStorage.removeItem(key);
              }
            }
          }
        }
      }
      
      if (!session) {
        // Force a hard redirect if not connected to avoid Next.js router getting stuck
        window.location.href = '/connexion';
        return;
      }

      // Récupérer le profil
      try {
        setLoadingStep('Récupération du profil...');
        const { data: profileData, error } = await withTimeout(
          supabase.from('profiles').select('*').eq('id', session.user.id).single(),
          8000,
          'fetchProfile'
        );

        if (profileData) {
          setProfile({ ...profileData, email: session.user.email });
          setFormData({ email: session.user.email, codePostal: profileData.code_postal || '' });
        } else {
          // Fallback si le profil n'existe pas dans la table (ex: compte administrateur créé manuellement)
          setProfile({ 
            id: session.user.id, 
            email: session.user.email, 
            prenom: 'Admin/Client', 
            nom: '', 
            fidelite_points: 0, 
            tickets: 0,
            newsletter: false 
          });
          setFormData({ email: session.user.email, codePostal: '' });
        }
        
        // Déclencher les confettis si des tickets sont disponibles !
        if (profileData && profileData.tickets > 0) {
          setTimeout(() => {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#B8003E', '#4ADE80', '#FFC107', '#FFFFFF']
            });
          }, 500);
        }

        // --- NOUVEAUTÉ : Mise à jour en temps réel (Realtime) ---
        // Si la Barista ajoute un point sur sa tablette, l'écran du client se met à jour tout seul instantanément !
        setLoadingStep('Initialisation du temps réel...');
        const channel = supabase
          .channel(`profile_changes_${session.user.id}`)
          .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` }, 
            (payload) => {
              setProfile(currentProfile => {
                // Si on passe de 0 à 1 ticket (ou plus), on déclenche les confettis en temps réel !
                if (payload.new.tickets > (currentProfile?.tickets || 0)) {
                  confetti({
                    particleCount: 200,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#B8003E', '#4ADE80', '#FFC107', '#FFFFFF']
                  });
                }
                return { ...currentProfile, ...payload.new };
              });
            }
          )
          .subscribe();

        // Nettoyage de l'abonnement quand le composant est détruit
        return () => {
          supabase.removeChannel(channel);
        };
        // --------------------------------------------------------

      } catch (err) {
        console.error("Erreur inattendue lors de la récupération du profil:", err);
        setLoadingStep('Erreur : ' + err.message);
        // Ne pas cacher le loading si on veut voir l'erreur, ou mettre un bouton pour forcer.
      } finally {
        // If there was an error, we keep loading true so we can see the error step
        // But if it's just a normal error, we might want to unblock.
        // Actually, let's just always set it to false so we don't hang, UNLESS it's a critical timeout.
        if (!err || !err.message.includes('Timeout')) {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    // Forcer le rafraîchissement global pour mettre à jour le Header
    router.refresh();
  };

  const handleEdit = (field) => {
    setEditing({ ...editing, [field]: true });
    setMessage({ type: '', text: '' });
  };

  const handleCancel = (field) => {
    setEditing({ ...editing, [field]: false });
    if (field === 'email') setFormData({ ...formData, email: profile.email });
    if (field === 'codePostal') setFormData({ ...formData, codePostal: profile.code_postal || '' });
    setMessage({ type: '', text: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveEmail = async () => {
    setMessage({ type: '', text: '' });
    const { data, error } = await supabase.auth.updateUser({ email: formData.email });
    
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setProfile({ ...profile, email: formData.email });
      setEditing({ ...editing, email: false });
      setMessage({ type: 'success', text: 'Courriel mis à jour avec succès.' });
    }
  };

  const handleSaveCodePostal = async () => {
    setMessage({ type: '', text: '' });
    const { error } = await supabase.from('profiles').update({ code_postal: formData.codePostal }).eq('id', profile.id);
    
    if (error) {
      setMessage({ type: 'error', text: "Erreur lors de la mise à jour." });
    } else {
      setProfile({ ...profile, code_postal: formData.codePostal });
      setEditing({ ...editing, codePostal: false });
      setMessage({ type: 'success', text: 'Ville mise à jour avec succès.' });
    }
  };

    const toggleNewsletter = async () => {
    setMessage({ type: '', text: '' });
    const newValue = !profile.newsletter;
    const { error } = await supabase.from('profiles').update({ newsletter: newValue }).eq('id', profile.id);
    
    if (error) {
      setMessage({ type: 'error', text: "Erreur lors de la mise à jour de l'infolettre." });
    } else {
      setProfile({ ...profile, newsletter: newValue });
      
      // Synchronisation avec Brevo
      fetch('/api/brevo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: newValue ? 'subscribe' : 'unsubscribe',
          email: profile.email,
          prenom: profile.prenom,
          nom: profile.nom
        })
      }).catch(err => console.error("Erreur appel API Brevo:", err));
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
        <p style={{ marginBottom: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>Chargement de votre espace...</p>
        <p style={{ marginBottom: '30px', color: '#666' }}>Étape : {loadingStep}</p>
        
        {loadingStep && loadingStep.includes('Erreur') && (
          <div style={{ background: '#FDECEA', color: '#D32F2F', padding: '15px', borderRadius: '8px', marginBottom: '20px', maxWidth: '400px' }}>
            <p><strong>Un blocage est survenu.</strong></p>
            <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>La base de données prend trop de temps à répondre ou le navigateur bloque la connexion.</p>
            <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: '#D32F2F', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
              🔄 Forcer le rechargement
            </button>
          </div>
        )}
        
        <button onClick={() => window.location.href = '/connexion'} style={{ padding: '10px 20px', background: 'var(--crimson)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          Aller à la page de connexion
        </button>
      </div>
    );
  }

  if (!profile) return <div style={{ padding: '60px', textAlign: 'center' }}><h2>Profil introuvable</h2><p>Impossible de charger vos données. Veuillez vous reconnecter.</p><button onClick={() => window.location.href = '/connexion'} style={{ padding: '10px 20px', background: 'var(--crimson)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', marginTop: '20px' }}>Se reconnecter</button></div>;

  return (
    <section className="section" style={{ padding: '60px 24px', minHeight: '80vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--white)', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
              Bonjour, {profile.prenom} 👋
            </h1>
            <p style={{ color: 'var(--text-light)', margin: 0 }}>
              Gérez vos informations personnelles et vos préférences.
            </p>
          </div>
          
          {/* Bouton de déconnexion */}
          <button 
            onClick={handleLogout}
            style={{
              background: '#D32F2F',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap'
            }}
          >
            Déconnexion
          </button>
        </div>

        {message.text && (
          <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', background: message.type === 'error' ? '#FDECEA' : '#E8F5E9', color: message.type === 'error' ? '#D32F2F' : '#388E3C' }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          
          {/* Historique des Commandes (Client seulement) */}
          {profile.email !== 'namasthesherbrooke@gmail.com' && (
            <div style={{ gridColumn: '1 / -1', background: '#FAFAFA', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #eee' }}>
              <h2 style={{ color: '#2C1810', marginBottom: '16px', fontSize: '1.5rem' }}>🛍️ Vos Achats</h2>
              <p style={{ color: '#666', marginBottom: '20px', textAlign: 'center' }}>
                Consultez l'historique de vos commandes passées sur la boutique en ligne.
              </p>
              <Link 
                href="/historique-commandes" 
                style={{ background: 'var(--crimson)', color: 'white', padding: '12px 30px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem', transition: 'transform 0.2s', display: 'inline-block' }}
              >
                Voir mon historique
              </Link>
            </div>
          )}

          {/* Historique des Ventes (Admin seulement) */}
          {profile.email === 'namasthesherbrooke@gmail.com' && (
            <div style={{ gridColumn: '1 / -1', background: '#FFF3E0', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #FFCC80' }}>
              <h2 style={{ color: '#E65100', marginBottom: '16px', fontSize: '1.5rem' }}>📈 Historique des Ventes</h2>
              <p style={{ color: '#F57C00', marginBottom: '20px', textAlign: 'center' }}>
                Consultez toutes les commandes complétées (les mêmes données que l'application Barista).
              </p>
              <Link 
                href="/admin/historique-ventes" 
                style={{ background: '#F57C00', color: 'white', padding: '12px 30px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem', transition: 'transform 0.2s', display: 'inline-block' }}
              >
                Voir les ventes
              </Link>
            </div>
          )}
          {/* Menu Admin (Visible seulement pour la propriétaire) */}
          {profile.email === 'namasthesherbrooke@gmail.com' && (
            <div style={{ gridColumn: '1 / -1', background: '#2C1810', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
              <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '1.5rem' }}>👑 Espace Administrateur</h2>
              <p style={{ color: '#D7CCC8', marginBottom: '20px', textAlign: 'center' }}>
                Accédez au tableau de bord pour gérer le Menu et les cartes de fidélité des clients.
              </p>
              <Link 
                href="/admin/dashboard" 
                style={{ background: '#FFC107', color: '#2C1810', padding: '12px 30px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem', transition: 'transform 0.2s', display: 'inline-block' }}
              >
                Accéder au Tableau de Bord
              </Link>
            </div>
          )}

          {/* CARTE DE FIDÉLITÉ (Masquée pour l'admin) */}
          {profile.email !== 'namasthesherbrooke@gmail.com' && (
            <div style={{ background: 'linear-gradient(135deg, var(--green-tropical), #2E7D32)', padding: '32px', borderRadius: '16px', gridColumn: '1 / -1', color: 'white', display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
              <div style={{ flex: '1 1 300px' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '8px', color: 'white' }}>Carte de Fidélité 🍵</h2>
                <div style={{ background: '#FCE4EC', padding: '12px 20px', borderRadius: '12px', marginBottom: '24px', display: 'inline-block', border: '1px solid #F8BBD0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <p style={{ color: '#E91E63', margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>
                    10 breuvages achetés = 1 breuvage gratuit !<br/>
                    <span style={{ fontSize: '0.9rem', color: '#C2185B', fontWeight: 'normal' }}>(Format 16 oz, supplément applicable pour 24 oz ou 32 oz)</span>
                  </p>
                </div>
                
                {/* Jauge de progression ludique (Gamification) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', gap: '4px' }}>
                  {[...Array(10)].map((_, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        flex: 1,
                        aspectRatio: '1',
                        borderRadius: '50%',
                        background: i < (profile.fidelite_points || 0) ? '#4ADE80' : 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: i < (profile.fidelite_points || 0) ? '0 0 10px rgba(74, 222, 128, 0.8)' : 'none',
                        transition: 'all 0.5s ease',
                        border: '2px solid rgba(255,255,255,0.4)',
                        position: 'relative'
                      }}
                    >
                      {i === 9 && <span style={{ fontSize: '0.8rem' }}>🎁</span>}
                      {i < (profile.fidelite_points || 0) && i !== 9 && <span style={{ fontSize: '0.8rem', color: '#1B5E20' }}>✓</span>}
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <span style={{ color: '#4ADE80' }}>{profile.fidelite_points || 0} point{(profile.fidelite_points || 0) > 1 ? 's' : ''} gagné{(profile.fidelite_points || 0) > 1 ? 's' : ''}</span>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>Objectif : 10</span>
                </div>
                
                {(profile.tickets || 0) > 0 && (
                  <div style={{ marginTop: '24px', background: '#FFC107', color: '#2C1810', padding: '16px', borderRadius: '12px', fontWeight: 'bold', textAlign: 'center', fontSize: '1.1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                    🎉 Félicitations ! Vous avez {profile.tickets} ticket(s) de breuvage gratuit disponible(s) ! Présentez ce code à la caisse.
                  </div>
                )}
              </div>
              
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                <QRCodeSVG value={typeof window !== 'undefined' ? `${window.location.origin}/admin/scanner?userId=${profile.id}` : profile.id} size={160} fgColor="#000000" level="H" />
                <p style={{ color: '#000000', fontSize: '0.9rem', marginTop: '16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Scannez-moi</p>
              </div>
            </div>
          )}
          <div style={{ background: 'var(--beige)', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '8px' }}>Informations de base</h3>
            <div style={{ marginBottom: '10px' }}><strong>Prénom :</strong> {profile.prenom}</div>
            <div style={{ marginBottom: '10px' }}><strong>Nom :</strong> {profile.nom}</div>
            
            <div style={{ marginTop: '10px' }}>
              <strong>Courriel :</strong>{' '}
              {editing.email ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} style={{ flex: 1, minWidth: '150px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  <button onClick={handleSaveEmail} style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                  <button onClick={() => handleCancel('email')} style={{ background: '#f44336', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                  <span style={{ wordBreak: 'break-all' }}>{profile.email}</span>
                  <button onClick={() => handleEdit('email')} style={{ background: 'none', border: 'none', color: '#B8003E', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}>Modifier</button>
                </span>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--beige)', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '8px' }}>Détails complémentaires</h3>
            <div style={{ marginBottom: '10px' }}><strong>Date de naissance :</strong> {profile.date_naissance ? new Date(profile.date_naissance).toLocaleDateString('fr-CA', { timeZone: 'UTC' }) : 'Non renseignée'}</div>
            
            <div style={{ marginTop: '10px' }}>
              <strong>Ville :</strong>{' '}
              {editing.codePostal ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  <input type="text" name="codePostal" value={formData.codePostal} onChange={handleChange} style={{ flex: 1, minWidth: '100px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  <button onClick={handleSaveCodePostal} style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                  <button onClick={() => handleCancel('codePostal')} style={{ background: '#f44336', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                  <span>{profile.code_postal || 'Non renseigné'}</span>
                  <button onClick={() => handleEdit('codePostal')} style={{ background: 'none', border: 'none', color: '#B8003E', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}>Modifier</button>
                </span>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--beige)', padding: '20px', borderRadius: '12px', gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '4px' }}>Préférences Infolettre</h3>
              <p style={{ margin: 0 }}>Recevez nos offres exclusives et nos nouveautés.</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
              {profile.newsletter ? (
                <span style={{ background: '#E8F5E9', color: '#388E3C', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>Actif</span>
              ) : (
                <span style={{ background: '#E0E0E0', color: '#757575', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>Inactif</span>
              )}
              <button 
                onClick={toggleNewsletter}
                style={{
                  background: profile.newsletter ? '#f44336' : '#4CAF50',
                  color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap'
                }}
              >
                {profile.newsletter ? 'Me désinscrire' : "M'inscrire"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
