"use client";

/**
 * page.js — Page d'Accueil du site Café Namasthé
 * 
 * Structure de la page (fidèle aux maquettes de référence) :
 * 1. Section Hero — Grande image de fond avec titre "Éveillez vos sens..."
 *    et boutons "Voir le Menu" + "Commander"
 * 2. Section "L'esprit Namasthé" — Présentation de la philosophie du café
 *    avec image de l'intérieur et badges (100% Naturel, Fait avec Amour)
 * 3. Section "Paroles de nos clients" — Témoignages avec étoiles (5 étoiles)
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

const partners = [
  { initials: 'Gé', type: 'Café', name: 'Géogène', location: 'Sherbrooke', description: "Torréfacteur de qualité" },
  { initials: 'FL', type: 'Fruits et légumes', name: 'FLE', location: 'Sherbrooke', description: "Sélection de produits frais" },
  { initials: 'FG', type: 'Bacon artisanal', name: 'Fumée Gourmande', location: 'Sherbrooke', description: "Fumoir artisanal en Estrie" },
  { initials: 'MB', type: 'Biscuits', name: 'Miss Biscuit', location: 'Sherbrooke', description: "Biscuits gourmands faits maison" },
  { initials: 'BB', type: 'Bubble tea', name: 'Bulle Bleue', location: 'Windsor (Estrie)', description: "Perles de qualité supérieure" },
  { initials: 'VC', type: 'Fruits lyophilisés', name: 'Verger Croustillant', location: 'Magog', description: "Fruits séchés pour nos boissons" },
  { initials: 'MB', type: 'Énergie', name: 'Mindblow', location: 'Montréal', description: "Boissons nootropiques" },
  { initials: 'Po', type: 'Jus', name: 'Poudrelicieux', location: 'Montréal', description: "Poudres sans sucre innovantes" },
  { initials: 'FC', type: 'Vinaigrettes', name: 'Fit Cook Foodz', location: 'Montréal', description: "Ingrédients santé de référence" },
  { initials: 'MP', type: 'Purées', name: 'Mixo Pro', location: 'Montréal', description: "Purées de fruits premium" },
  { initials: 'SI', type: 'Saveurs', name: 'SIMPS', location: 'Canada', description: "Jets de saveurs" },
];

export default function Home() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  // Animation au défilement (Fade-in)
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-visible');
        }
      });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.fade-in-hidden');
    hiddenElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ========================================
          SECTION 1 : HERO — Impression principale
          ======================================== */}
      <section className="hero" id="hero-accueil">
        {/* Image de fond (boissons tropicales) */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="hero-bg"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        {/* Overlay semi-transparent pour lisibilité du texte */}
        <div className="hero-overlay" />

        {/* Contenu principal du Hero */}
        <div className="hero-content">
          {/* Icônes de boissons personnalisées */}
          <div className="hero-icons">
            <div className="hero-icon"><img src="/drink-1.png" alt="Boisson exotique 1" className="hero-drink-img" /></div>
            <div className="hero-icon"><img src="/drink-2.png" alt="Boisson exotique 2" className="hero-drink-img" /></div>
            <div className="hero-icon"><img src="/drink-3.png" alt="Boisson exotique 3" className="hero-drink-img" /></div>
          </div>

          {/* Titre principal du site (h1 unique pour le SEO) */}
          <h1>Bienvenue au Café Namasthé.</h1>

          {/* BANNER VACANCES */}
          <div style={{ background: '#FFC107', color: '#2C1810', padding: '15px 24px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.15rem', marginBottom: '24px', display: 'inline-block', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', border: '2px solid rgba(255,255,255,0.5)' }}>
            🏖️ Avis à notre clientèle : Nous sommes en vacances du 26 juillet au 3 août inclusivement.
          </div>

<p>
          
Entrez, respirez et laissez-vous envelopper par notre oasis zen où la paix de l'esprit s'accorde avec une énergie vibrante. Que vous veniez pour un café de spécialité ou une pause suspendue, infusez votre journée de bonnes ondes et de lumière !
          </p>

        </div>
      </section>

      {/* ========================================
          SECTION 2 : L'ESPRIT NAMASTHÉ
          Présentation du café et de sa philosophie
          ======================================== */}
      <section className="esprit-section fade-in-hidden" id="esprit-namasthe">
        {/* Colonne texte */}
        <div className="esprit-text">
          {/* Icône de la section */}
          <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🌿</div>

          <h2>L&apos;esprit Namasthé</h2>

          <p>
          Au Café NamasThé, nous croyons qu'il est possible de savourer la vie pleinement sans jamais avoir à choisir entre le plaisir et le bien-être. Chaque breuvage que nous créons est pensé pour être gourmand, conscient et sans culpabilité, parce que prendre soin de soi devrait toujours rester un plaisir.
          </p>

          <p>
            Nous sélectionnons rigoureusement nos ingrédients pour vous offrir des 
            créations qui nourrissent le corps et apaisent l&apos;esprit. Chaque tasse, 
            chaque bol est une invitation au voyage, un équilibre parfait entre 
            l&apos;énergie vibrante des tropiques et le calme absolu de la méditation.
          </p>

          {/* Bouton En savoir plus */}
          <div style={{ marginTop: '24px' }}>
            <button 
              onClick={() => setShowModal(true)} 
              className="btn btn-primary"
              style={{
                background: 'var(--green-tropical)',
                color: 'var(--white)',
                padding: '12px 28px',
                borderRadius: 'var(--radius-xl)',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all var(--transition)',
                boxShadow: 'var(--shadow-sm)',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--green-light)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--green-tropical)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              En savoir plus
            </button>
          </div>
        </div>

        {/* Colonne image — intérieur du café */}
        <div className="esprit-image">
          <img 
            src="/esprit_namasthe_v3.png" 
            alt="La devanture du café Namasthé" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </section>

      {/* ========================================
          SECTION PARTENAIRES (Marquee Défilant)
          ======================================== */}
      <section className="section fade-in-hidden" id="partenaires-section" style={{ background: '#Fdfcfb', paddingTop: '60px', paddingBottom: '60px', overflow: 'hidden' }}>
        <div className="section-header" style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#2C1810', textAlign: 'center' }}>Nos collaborateurs locaux</h2>
          <p style={{ textAlign: 'center', color: '#5A4A42', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>
            Fiers d'encourager les créateurs et producteurs d'ici.
          </p>
        </div>

        <div className="marquee-wrapper">
          <div className="marquee-track">
            {/* On double la liste pour créer l'effet infini */}
            {[...partners, ...partners].map((partner, i) => (
              <div key={i} className="marquee-card">
                <div className="marquee-initial">{partner.initials}</div>
                <div className="marquee-info">
                  <span className="marquee-type">{partner.type}</span>
                  <h4 className="marquee-name">{partner.name}</h4>
                  <span className="marquee-loc">📍 {partner.location}</span>
                </div>
                <div className="marquee-hover">
                  <p>{partner.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION INSTAGRAM (Preuve Sociale)
          ======================================== */}
      <section className="section fade-in-hidden" id="instagram-feed" style={{ background: '#FFFFFF', paddingTop: '60px', paddingBottom: '60px' }}>
        <div className="section-header" style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ color: '#2C1810', textAlign: 'center', marginBottom: '8px' }}>Rejoignez notre communauté</h2>
          <a 
            href="https://www.instagram.com/cafe.namasthe.sherbrooke/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#E1306C', fontWeight: 'bold', fontSize: '1.2rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            📸 @cafe.namasthe.sherbrooke
          </a>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px'
        }}>
          {[
            { src: '/esprit_namasthe_v2.jpg', alt: 'Ambiance zen au café' },
            { src: '/bg-drink-candle.jpg', alt: 'Breuvage Namasthé avec chandelle' },
            { src: '/images/products/Bubble tea.jpeg', alt: 'Nos fameux Bubble Teas' },
            { src: '/images/products/Matcha glace.jpeg', alt: 'Matcha glacé rafraîchissant' }
          ].map((img, index) => (
            <a 
              key={index} 
              href="https://www.instagram.com/cafe.namasthe.sherbrooke/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                position: 'relative',
                aspectRatio: '1',
                overflow: 'hidden',
                borderRadius: '16px',
                display: 'block',
                cursor: 'pointer',
                background: '#f0f0f0'
              }}
              className="insta-post"
              onMouseEnter={(e) => {
                e.currentTarget.querySelector('.insta-overlay').style.opacity = '1';
                e.currentTarget.querySelector('img').style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.querySelector('.insta-overlay').style.opacity = '0';
                e.currentTarget.querySelector('img').style.transform = 'scale(1)';
              }}
            >
              <img 
                src={img.src} 
                alt={img.alt} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} 
              />
              <div 
                className="insta-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                }}
              >
                <span style={{ color: 'white', fontSize: '2rem' }}>❤️</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ========================================
          SECTION 3 : VENEZ NOUS REJOINDRE
          Carte et adresse
          ======================================== */}
      <section className="section fade-in-hidden" id="location-section" style={{ background: '#Fdfcfb', borderTop: '1px solid #Eae4d8' }}>
        <div className="section-header">
          <h2 style={{ color: '#2C1810' }}>Venez nous rejoindre !</h2>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '40px',
          maxWidth: '1000px',
          margin: '0 auto',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px'
        }}>
          {/* Carte */}
          <div style={{ flex: '1 1 500px', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-md)', height: '350px' }}>
            <iframe
              title="Localisation du Café Namasthé"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src="https://www.google.com/maps?q=1086+Rue+King+Ouest,+Sherbrooke,+QC,+J1H+1S2&output=embed"
            ></iframe>
          </div>

          {/* Texte Adresse */}
          <div style={{ flex: '1 1 300px', textAlign: 'left', padding: '20px' }}>
            <h3 style={{ fontSize: '1.6rem', color: '#2C1810', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>Notre adresse</h3>
            <p style={{ fontSize: '1.15rem', color: '#5A4A42', lineHeight: '1.8' }}>
              <strong>Café Namasthé</strong><br/>
              1086 Rue King Ouest<br/>
              Sherbrooke, Québec<br/>
              J1H 1S2<br/>
              Tél : <a href="tel:8195698380" style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(90, 74, 66, 0.4)', fontWeight: '500' }}>(819)-569-8380</a>
            </p>
            
            <h3 style={{ fontSize: '1.4rem', color: '#2C1810', marginTop: '24px', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>Heures d'ouverture</h3>
            <p style={{ fontSize: '1.05rem', color: '#5A4A42', lineHeight: '1.6' }}>
              <strong>Lundi :</strong> Fermé<br/>
              <strong>Mar - Mer :</strong> 07:00 – 17:00<br/>
              <strong>Jeu - Ven :</strong> 07:00 – 17:30<br/>
              <strong>Samedi :</strong> 08:30 – 17:00<br/>
              <strong>Dimanche :</strong> Fermé
            </p>
            
            <div style={{ marginTop: '24px' }}>
              <a href="https://maps.google.com/?q=1086+Rue+King+Ouest,+Sherbrooke,+QC,+J1H+1S2" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: 'inline-block' }}>
                Obtenir l'itinéraire
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 4 : TÉMOIGNAGES CLIENTS
          Trois cartes avec étoiles et citations
          ======================================== */}
      <section className="section fade-in-hidden" id="temoignages-section">
        {/* En-tête de la section */}
        <div className="section-header">
          <div style={{ fontSize: '2rem', color: '#B8003E', marginBottom: 8 }}>❝</div>
          <h2 style={{ color: '#2C1810' }}>Paroles de nos clients</h2>
        </div>

        {/* Grille de 3 témoignages */}
        <div className="testimonials-grid">
          {/* Témoignage 1 — Caro F. */}
          <div className="testimonial-card" id="testimonial-1">
            <div className="stars">★★★★★</div>
            <blockquote>
              &quot;J'adore m'arrêter au Café Namasthé avant d'aller travailler. Leurs drinks sont toujours savoureux et me donnent le petit boost parfait pour commencer la journée du bon pied. L'ambiance est accueillante et le service souriant rend chaque visite agréable. Un incontournable à Sherbrooke !&quot;
            </blockquote>
            <cite>— Caro F.</cite>
          </div>

          {/* Témoignage 2 — JosyAnn R. */}
          <div className="testimonial-card" id="testimonial-2">
            <div className="stars">★★★★★</div>
            <blockquote>
              &quot;Le seul endroit à Sherbrooke où tu peux boire un thé énergisant SANS SUCRE NI INGRÉDIENTS CHIMIQUES créé sur mesure selon tes goûts!&quot;
            </blockquote>
            <cite>— JosyAnn R.</cite>
          </div>

          {/* Témoignage 3 — Steven L. */}
          <div className="testimonial-card" id="testimonial-3">
            <div className="stars">★★★★★</div>
            <blockquote>
              &quot;Place super. Une propriétaire en or avec le coeur sur la main. Le produit vendu goûte le ciel. C'est magique ! Une entreprise qui a pour mission de combler nos envies.&quot;
            </blockquote>
            <cite>— Steven L.</cite>
          </div>
        </div>
        
        {/* Bouton Avis clients */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <a 
            href="https://www.google.com/search?sca_esv=515e544df15d7837&sxsrf=ANbL-n4UpgIxkwI2OwOkI6IycEpsxue71g:1779972991333&q=caf%C3%A9+namasth%C3%A9&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOYg-s64i1GkDwfiJFWjrBDztlARJNvZcli9CuJRqkQQxyu0Nt23HlA1i0uFJ4XwCwUEc4P1wmHSYYCy7v3Rv5MSs95hh&sa=X&ved=2ahUKEwi-wO6OhNyUAxWmMlkFHQDnOBQQrrQLegQIHBAA&biw=1613&bih=897&dpr=1" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-outline"
            style={{ display: 'inline-block' }}
          >
            Lire d'autres avis clients
          </a>
        </div>
      </section>


      {/* Modal Popup pour "En savoir plus" */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            
            {/* Bouton de fermeture en haut à droite */}
            <button 
              onClick={() => setShowModal(false)}
              className="modal-close-btn"
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
            >
              ✕
            </button>

            {/* Titre du Modal */}
            <h2 className="modal-title">
              L&apos;Esprit Café Namasthé
            </h2>

            {/* Ligne décorative */}
            <div className="modal-divider" />

            {/* Contenu du Modal (défilement ici) */}
            <div className="modal-scroll modal-scroll-content">
              <p style={{ fontWeight: '600', color: 'var(--crimson)', fontSize: '1.25rem', textAlign: 'center' }}>
                Ce qui nous définit vraiment, c&apos;est ce qui se passe de l&apos;autre côté du comptoir. Chaque personne qui entre ici est accueillie avec la même attention et le même respect, peu importe qui elle est ou comment elle se sent ce jour-là. Au Namasthé on crée un espace où l&apos;on peut se déposer, souffler et se sentir vraiment vu. Les clients viennent pour un breuvage et repartent avec bien plus : une écoute sincère, un conseil, ou simplement le sourire qui leur manquait.
              </p>

              <p>
                Cette générosité, on la porte aussi vers la communauté, les entrepreneurs d&apos;ici et ceux qui traversent des moments plus difficiles. Parce que NamasThé, c&apos;est bien plus qu&apos;un café, c&apos;est un endroit où l&apos;on se sent enfin chez soi.
              </p>

              <p className="modal-highlight-text">
                Sain. Savoureux. Sans culpabilité. Humain.
              </p>

              <p>
                Le Café NamasThé est né d&apos;un don que Corine porte depuis l&apos;enfance : une intuition naturelle pour les saveurs, les combinaisons, l&apos;équilibre des goûts, un talent que son père avait remarqué bien avant qu&apos;elle-même en comprenne toute la portée. Passionnée de bien-être et de connexions humaines, elle a aussi développé avec le temps un vrai plaisir à découvrir ce dont les gens ont vraiment envie, même quand ils ne savent pas encore le nommer eux-mêmes. C&apos;est de cette double sensibilité qu&apos;elle a voulu créer à Sherbrooke quelque chose qui n&apos;existait pas encore : un endroit chaleureux, créatif et authentique, loin des grandes chaînes, où les boissons gourmandes deviennent plus légères, plus conscientes et toujours plus savoureuses.
              </p>

              <p>
                Au fil du temps, Le Café Namasthé est devenu bien plus qu&apos;un café. C&apos;est un espace où on vient décrocher, découvrir de nouvelles saveurs, et se sentir accueilli comme chez une amie. Près de 80 % des clients arrivent simplement en disant «Fais-moi un jus comme tu le sens» et c&apos;est cette confiance qui définit le mieux la confiance entre le client et le service.
              </p>

              <p>
                Derrière chaque recette se cache une recherche constante d&apos;équilibre entre plaisir, santé et originalité, avec des ingrédients locaux et québécois qui font la fierté de la maison.
              </p>

              <p style={{ fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: 'var(--crimson)', fontWeight: '600', fontSize: '1.15rem' }}>
                Aujourd&apos;hui, Le Café Namasthé continue d&apos;évoluer avec la même mission : offrir un petit moment de bonheur, sans culpabilité et sans jugement, à chaque personne qui pousse la porte. 🌸
              </p>
            </div>

            {/* Bouton Fermer en bas */}
            <div className="modal-footer">
              <button 
                onClick={() => setShowModal(false)}
                className="btn btn-primary modal-footer-btn"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--crimson-dark)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--crimson)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
