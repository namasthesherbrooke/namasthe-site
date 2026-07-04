/**
 * Inscription — Page de création de compte client
 * 
 * Champs : Prénom, Nom, Date de naissance, Email, Mot de passe,
 * Code Postal, Source de découverte, Checkbox newsletter.
 * À terme : création du compte via Supabase Auth + profil dans la table users.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function InscriptionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    prenom: '', nom: '', jourNaissance: '', moisNaissance: '', anneeNaissance: '', email: '',
    password: '', codePostal: '', source: '', newsletter: true, telephone: '', preference_contact: 'courriel'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Génération des options pour les dates
  const jours = Array.from({ length: 31 }, (_, i) => i + 1);
  const mois = [
    { valeur: '01', nom: 'Janvier' }, { valeur: '02', nom: 'Février' }, { valeur: '03', nom: 'Mars' },
    { valeur: '04', nom: 'Avril' }, { valeur: '05', nom: 'Mai' }, { valeur: '06', nom: 'Juin' },
    { valeur: '07', nom: 'Juillet' }, { valeur: '08', nom: 'Août' }, { valeur: '09', nom: 'Septembre' },
    { valeur: '10', nom: 'Octobre' }, { valeur: '11', nom: 'Novembre' }, { valeur: '12', nom: 'Décembre' }
  ];
  const currentYear = new Date().getFullYear();
  const annees = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Formatage de la date de naissance (YYYY-MM-DD)
    let dateNaissanceFmt = null;
    if (formData.anneeNaissance && formData.moisNaissance && formData.jourNaissance) {
      const jourStr = formData.jourNaissance.toString().padStart(2, '0');
      dateNaissanceFmt = `${formData.anneeNaissance}-${formData.moisNaissance}-${jourStr}`;
    }

    // 1. Inscription via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    if (authData?.user) {
      // 2. Création du profil dans la table 'profiles'
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            prenom: formData.prenom,
            nom: formData.nom,
            date_naissance: dateNaissanceFmt,
            code_postal: formData.codePostal,
            source: formData.source,
            newsletter: formData.newsletter,
            telephone: formData.telephone || null,
            preference_contact: formData.preference_contact
          }
        ]);

      if (profileError) {
        setError("Compte créé, mais erreur lors de l'enregistrement du profil.");
        console.error("Profile error:", profileError);
      } else {
        setSuccess(true);
        
        // Générer le code promo: prenom10 (sans espaces)
        const code = `${formData.prenom.trim().replace(/\s+/g, '')}10`;
        setPromoCode(code);
        
        // 3. Synchronisation avec Brevo si l'infolettre est cochée
        if (formData.newsletter) {
          fetch('/api/brevo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'subscribe',
              email: formData.email,
              prenom: formData.prenom,
              nom: formData.nom,
              date_naissance: dateNaissanceFmt,
              telephone: formData.telephone,
              preference_contact: formData.preference_contact
            })
          }).catch(err => console.error("Erreur appel API Brevo:", err));
        }

        // Réinitialiser le formulaire
        setFormData({
          prenom: '', nom: '', jourNaissance: '', moisNaissance: '', anneeNaissance: '', email: '',
          password: '', codePostal: '', source: '', newsletter: true, telephone: '', preference_contact: 'courriel'
        });
        
        // On ne redirige plus automatiquement pour que l'utilisateur puisse voir son code promo !
      }
    }
  };

  return (
    <section className="section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
      <form className="form-section" onSubmit={handleSubmit} id="signup-form" style={{ maxWidth: 560 }}>
        <div style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: 12 }}>🍃</div>
        <h2 style={{ textAlign: 'center' }}>Créer un compte</h2>
        {success ? (
          <div style={{ background: '#E8F5E9', color: '#388E3C', padding: '24px', borderRadius: '12px', textAlign: 'center', marginTop: '20px' }}>
            <h3 style={{ marginBottom: '12px', color: '#2E7D32', fontSize: '1.4rem' }}>Votre compte a été créé avec succès !</h3>
            <p style={{ marginBottom: '16px', color: '#1B5E20' }}>Vérifiez vos courriels pour confirmer votre adresse.</p>
            
            <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '2px dashed #4CAF50', margin: '24px 0' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#2C1810', fontSize: '1.2rem' }}>Cadeau de bienvenue 🎁</p>
              <p style={{ fontSize: '1rem', color: '#5A4A42', marginBottom: '16px' }}>Profitez de 10% de rabais lors de votre première visite avec le code promo exclusif suivant :</p>
              <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--green-tropical)', letterSpacing: '2px', wordBreak: 'break-all' }}>
                {promoCode}
              </div>
            </div>

            <Link href="/mon-compte" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '12px', padding: '12px 32px' }}>
              Aller à mon profil
            </Link>
          </div>
        ) : (
          <>
            <p style={{ textAlign: 'center' }}>Rejoignez la communauté Namasthé</p>

            {error && <div style={{ background: '#FDECEA', color: '#D32F2F', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="prenom">Prénom</label>
                <input type="text" id="prenom" name="prenom" placeholder="Votre prénom" value={formData.prenom} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="nom">Nom</label>
                <input type="text" id="nom" name="nom" placeholder="Votre nom" value={formData.nom} onChange={handleChange} required />
              </div>
              <div className="form-group full" style={{ gridColumn: '1 / -1' }}>
                <label>Date de naissance</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select name="jourNaissance" value={formData.jourNaissance} onChange={handleChange} required style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <option value="">Jour</option>
                    {jours.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                  <select name="moisNaissance" value={formData.moisNaissance} onChange={handleChange} required style={{ flex: 2, padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <option value="">Mois</option>
                    {mois.map(m => <option key={m.valeur} value={m.valeur}>{m.nom}</option>)}
                  </select>
                  <select name="anneeNaissance" value={formData.anneeNaissance} onChange={handleChange} required style={{ flex: 1.5, padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <option value="">Année</option>
                    {annees.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="signup-email">Email</label>
                <input type="email" id="signup-email" name="email" placeholder="votre@email.com" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="telephone">Numéro de téléphone</label>
                <input type="tel" id="telephone" name="telephone" placeholder="Ex: 819-123-4567" value={formData.telephone} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">Mot de passe</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type={showPassword ? "text" : "password"} id="signup-password" name="password" placeholder="Min. 8 caractères" value={formData.password} onChange={handleChange} required minLength={8} style={{ width: '100%', paddingRight: '40px' }} />
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
              <div className="form-group">
                <label htmlFor="codePostal">Nom de la ville</label>
                <input type="text" id="codePostal" name="codePostal" placeholder="Ex: Sherbrooke (optionnel)" value={formData.codePostal} onChange={handleChange} />
              </div>
              <div className="form-group full">
                <label htmlFor="source">Comment avez-vous découvert Namasthé ?</label>
                <select id="source" name="source" value={formData.source} onChange={handleChange}>
                  <option value="">Sélectionnez...</option>
                  <option value="reseaux">Réseaux sociaux</option>
                  <option value="ami">Recommandation d&apos;un ami</option>
                  <option value="recherche">Recherche en ligne</option>
                  <option value="passage">En passant devant</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="form-group full">
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', background: 'rgba(76, 175, 80, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
                  <input type="checkbox" name="newsletter" checked={formData.newsletter} onChange={handleChange} style={{ marginTop: '4px', width: '20px', height: '20px' }} />
                  <span style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>
                    <strong>Oui, je veux recevoir mon cadeau d'anniversaire ! 🎁</strong><br/>
                    <span style={{ color: '#555', fontSize: '0.85rem' }}>M'abonner aux offres VIP Namasthé. (Ne vous inquiétez pas, on n'aime pas le spam non plus. Nous n'envoyons que des courriels importants ou des cadeaux !)</span>
                  </span>
                </label>
              </div>
              
              {/* Afficher la préférence de contact seulement s'ils ont coché l'option cadeau */}
              {formData.newsletter && (
                <div className="form-group full" style={{ marginTop: '-10px', padding: '16px', background: '#F9F7F4', borderRadius: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: 'var(--text-dark)' }}>
                    Où préférez-vous recevoir vos cadeaux et annonces ?
                  </label>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem', color: '#555' }}>
                      <input type="radio" name="preference_contact" value="courriel" checked={formData.preference_contact === 'courriel'} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                      Par courriel ✉️
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem', color: '#555' }}>
                      <input type="radio" name="preference_contact" value="texto" checked={formData.preference_contact === 'texto'} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                      Par texto (SMS) 📱
                    </label>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary form-submit">Créer mon compte</button>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem' }}>
              Déjà un compte ?{' '}
              <Link href="/connexion" style={{ color: '#B8003E', fontWeight: 600 }}>Se connecter</Link>
            </p>
          </>
        )}
      </form>
    </section>
  );
}
