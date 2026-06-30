'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function EvenementsPage() {
  /* États du formulaire (provenant de reserver-nous) */
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    type: '',
    invites: '',
    projet: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch("https://formsubmit.co/ajax/namasthesherbrooke@gmail.com", {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            Nom: formData.nom,
            Email: formData.email,
            "Type d'événement": formData.type,
            "Nombre d'invités": formData.invites,
            Projet: formData.projet,
            _subject: `Nouvelle demande de devis : ${formData.nom}`,
            _template: "table"
        })
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Erreur lors de l\'envoi :', error);
      alert("Une erreur est survenue lors de l'envoi. Veuillez nous contacter directement.");
    }
  };

  return (
    <>
      {/* ========================================
          HERO — Titre centré avec icône
          ======================================== */}
      <section className="section" id="evenements-hero" style={{ textAlign: 'center', paddingBottom: 40 }}>
        <h1>Événements</h1>
        <p style={{ maxWidth: 500, margin: '12px auto 0' }}>
          On aime faire des événements <em>pour tous</em>. Découvrez nos prochains 
          rendez-vous bien-être et gourmands.
        </p>
        <div style={{ marginTop: '24px' }}>
          <a 
            href="#reserver-hero"
            style={{
              display: 'inline-block',
              background: 'var(--green-tropical)',
              color: 'var(--white)',
              padding: '12px 24px',
              borderRadius: '50px',
              textDecoration: 'none',
              fontWeight: 'bold',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
          >
            Créez votre événement avec nous !
          </a>
        </div>
      </section>

      {/* ========================================
          CONTENU : Image et message "À venir"
          ======================================== */}
      <section className="section" style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto', paddingBottom: 80 }}>
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          aspectRatio: '4/3',
          borderRadius: '16px', 
          overflow: 'hidden',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <Image 
            src="/images/evenement_placeholder.jpg" 
            alt="Groupe de discussion autour de breuvages Namasthé" 
            fill 
            style={{ objectFit: 'cover' }} 
            priority
          />
        </div>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-dark)', marginBottom: '32px' }}>Événements à venir</h2>
        
        <div style={{ textAlign: 'left', background: 'var(--bg-light)', padding: '32px', borderRadius: '16px', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <li style={{ paddingBottom: '16px', borderBottom: '1px solid #Eae4d8' }}>
              <span style={{ color: 'var(--green-tropical)', fontWeight: 'bold', fontSize: '1.2rem', display: 'block', marginBottom: '4px' }}>17 Juin — 18h à 20h</span>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-dark)' }}>Lancement d'un roman avec Les éditions 2 oiseaux rares</span>
            </li>
            <li style={{ paddingBottom: '16px', borderBottom: '1px solid #Eae4d8' }}>
              <span style={{ color: 'var(--green-tropical)', fontWeight: 'bold', fontSize: '1.2rem', display: 'block', marginBottom: '4px' }}>19 Juin — 18h à 20h</span>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-dark)' }}>Lancement d'un roman avec Les éditions 2 oiseaux rares</span>
            </li>
            <li>
              <span style={{ color: 'var(--green-tropical)', fontWeight: 'bold', fontSize: '1.2rem', display: 'block', marginBottom: '4px' }}>26 Juin — 18h30 à 20h30</span>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-dark)' }}>Quizz musical à l'extérieur à la placette au Parc Jacques-Cartier</span>
            </li>
          </ul>
        </div>

        <p style={{ fontSize: '1.1rem', color: 'var(--text-dark)', lineHeight: '1.6', background: 'rgba(152, 219, 137, 0.15)', padding: '24px', borderRadius: '12px', borderLeft: '4px solid var(--green-tropical)', textAlign: 'left' }}>
          D'autres événements, en collaboration avec Sherbrooke Loisirs-Action, seront offerts à la Placette du parc Jacques-Cartier au cours des mois d'août et de septembre, les vendredis soirs.
        </p>
      </section>

      {/* ========================================
          HERO SPLIT — Titre + Image (Depuis Réservez-nous)
          ======================================== */}
      <section className="split-hero" id="reserver-hero" style={{ background: 'linear-gradient(135deg, var(--cream) 0%, #F5E0D0 100%)' }}>
        <div>
          {/* Badge de service */}
          <div className="section-badge">✨ Services Exclusifs</div>

          <h1 style={{ color: 'var(--crimson)', fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
            Créez l&apos;événement parfait.
          </h1>

          <p style={{ marginTop: 16, marginBottom: 28 }}>
            Confiez-nous l&apos;organisation de vos événements professionnels ou 
            privés dans une atmosphère tropicale et zen. Une expérience 
            rafraîchissante et sur-mesure.
          </p>

          {/* Boutons d'action */}
          <div className="btn-group" style={{ justifyContent: 'flex-start' }}>
            <a href="#formulaire" className="btn btn-primary" id="btn-devis">
              Demander un devis
            </a>
            <a href="#cal-booking" className="btn btn-outline" id="btn-menu">
              Réserver maintenant
            </a>
          </div>
        </div>

        {/* Image décorative */}
        <div className="split-hero-image">
          <img 
            src="/evenement-parfait.jpg" 
            alt="Nos boissons rafraîchissantes"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              minHeight: 300,
            }}
          />
        </div>
      </section>

      {/* ========================================
          FORMULAIRE DE DEMANDE
          ======================================== */}
      <section className="section" id="formulaire" style={{ background: 'linear-gradient(135deg, #F5E0D0 0%, #E8F0E0 100%)', padding: '80px 24px' }}>
        {submitted ? (
          /* Message de confirmation après soumission */
          <div className="form-section" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
            <h2>Demande envoyée !</h2>
            <p>Notre équipe vous recontactera sous 24h. Merci pour votre confiance !</p>
            <button className="btn btn-primary" onClick={() => setSubmitted(false)} style={{ marginTop: 20 }}>
              Nouvelle demande
            </button>
          </div>
        ) : (
          /* Formulaire de contact */
          <form className="form-section" onSubmit={handleSubmit} id="reservation-form">
            <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 8 }}>📋</div>
            <h2>Demander un devis</h2>
            <p>
              Dites-nous-en plus sur votre projet, notre équipe vous recontactera sous 24h.
            </p>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="nom">Nom / Entreprise</label>
                <input type="text" id="nom" name="nom" placeholder="Votre nom" value={formData.nom} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" placeholder="contact@exemple.com" value={formData.email} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="type">Type d&apos;événement</label>
                <select id="type" name="type" value={formData.type} onChange={handleChange} required>
                  <option value="">Sélectionnez...</option>
                  <option value="corporatif">Événement corporatif</option>
                  <option value="prive">Événement privé</option>
                  <option value="mariage">Mariage</option>
                  <option value="team-building">Team building</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="invites">Nombre d&apos;invités estimé</label>
                <input type="number" id="invites" name="invites" placeholder="Ex: 20" value={formData.invites} onChange={handleChange} />
              </div>

              <div className="form-group full">
                <label htmlFor="projet">Votre projet en quelques mots</label>
                <textarea id="projet" name="projet" placeholder="Décrivez l'ambiance souhaitée, les restrictions alimentaires, etc." value={formData.projet} onChange={handleChange} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary form-submit" id="btn-submit-reservation">
              Envoyer la demande ▶
            </button>
          </form>
        )}
      </section>

      {/* ========================================
          RÉSERVATION (Intégration Cal.com)
          ======================================== */}
      <section className="section" id="cal-booking" style={{ background: '#Fdfcfb', padding: '80px 24px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📅</div>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--text-dark)' }}>Prendre rendez-vous</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-medium)', maxWidth: '600px', margin: '0 auto' }}>
            Vous préférez en discuter directement avec nous ? Choisissez le moment qui vous convient.
          </p>
        </div>

        <div style={{ 
          maxWidth: '1060px', 
          margin: '0 auto', 
          background: 'var(--white)', 
          borderRadius: '24px', 
          overflow: 'hidden', 
          boxShadow: 'var(--shadow-xl)',
          minHeight: '750px'
        }}>
          <iframe
            src="https://cal.com/cafenamasthe"
            width="100%"
            height="100%"
            frameBorder="0"
            title="Prise de rendez-vous Cal.com"
            style={{ minHeight: '750px', border: 'none' }}
          ></iframe>
        </div>
      </section>
    </>
  );
}
