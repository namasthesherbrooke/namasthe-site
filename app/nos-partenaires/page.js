/**
 * Nos Partenaires — Page de présentation des partenaires locaux
 * 
 * Cette page met en avant l'écosystème local de Namasthé.
 * Tous les partenaires sont présentés de manière textuelle et élégante
 * sans images, pour une clarté optimale et un design épuré.
 */

const partners = [
  { emoji: '🫘', type: 'Café', name: 'Géogène', location: 'Sherbrooke', description: "Fier torréfacteur de Sherbrooke, reconnu pour sa qualité exceptionnelle, ses cafés et son approche éthique, de la plantation à la tasse." },
  { emoji: '🥦', type: 'Fruits et légumes', name: 'FLE', location: 'Sherbrooke', description: "Service alimentaire qui nous fournit une vaste sélection de fruits et légumes de qualité." },
  { emoji: '🥓', type: 'Bacon artisanal', name: 'Fumée Gourmande', location: 'Sherbrooke', description: "Fumoir artisanal situé en Estrie." },
  { emoji: '🍪', type: 'Biscuits', name: 'Miss Biscuit', location: 'Sherbrooke', description: "Nouvellement installée dans nos locaux, Miss Biscuit offre des biscuits gourmands de qualité, faits avec des ingrédients sains et peu transformés." },
  { emoji: '🧋', type: 'Bubble tea', name: 'Bulle Bleue', location: 'Windsor (Estrie)', description: "Partenaire de confiance pour nos perles de bubble tea, faites avec des ingrédients de qualité et un souci de perfection hors du commun, respectant des normes et certifications précises." },
  { emoji: '🍓', type: 'Fruits lyophilisés', name: 'Verger Croustillant', location: 'Magog', description: "Fournisseur de nos fameux fruits lyophilisés pour nos rafraîchi-thés et certains de nos breuvages." },
  { emoji: '⚡', type: 'Boissons énergisantes', name: 'Mindblow', location: 'Montréal', description: "Propose des boissons fonctionnelles conçues pour soutenir l'énergie et la concentration grâce aux nootropiques." },
  { emoji: '🥤', type: 'Jus', name: 'Poudrelicieux', location: 'Montréal', description: "Partenaire innovant et créatif en poudres de jus sans sucre, offrant des alternatives saines pour réduire l'apport en sucre et en glucides." },
  { emoji: '🥗', type: 'Vinaigrettes', name: 'Fit Cook Foodz + Oh Silly Billy', location: 'Montréal', description: "Référence québécoise dans l'univers de la cuisine saine. Il nous fournit plusieurs vinaigrettes, sauces et ingrédients pour cuisiner santé avec saveur." },
  { emoji: '🍑', type: 'Purées de fruits', name: 'Mixo Pro', location: 'Montréal', description: "Purées de fruits de première qualité." },
  { emoji: '💧', type: 'Jets de saveurs', name: 'SIMPS', location: 'Canada' },
];

export default function NosPartenairesPage() {
  return (
    <>
      {/* En-tête / Bannière de la page */}
      <section id="partenaires-banner" className="partner-header">
        {/* Cercles de décoration en arrière-plan */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.03)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.03)',
        }} />

        <div className="partner-badge">
          Nos partenaires
        </div>
      </section>

      {/* Section principale avec introduction et liste */}
      <main className="partner-main-container">
        
        {/* Texte d'introduction - Chez Namasthé, encourager le local... */}
        <div className="partner-intro-box">
          <p className="partner-intro-text">
            « Chez NamasThé, encourager le local n&apos;est pas une tendance marketing, c&apos;est une valeur profondément ancrée dans notre façon de bâtir l&apos;entreprise depuis le premier jour. Nous croyons qu&apos;une communauté forte se construit quand les entreprises d&apos;ici se soutiennent entre elles. C&apos;est pourquoi nous privilégions toujours Sherbrooke et ses environs en premier, puis l&apos;Estrie, le Québec, et le Canada lorsque nécessaire. Chaque partenaire est choisi avec intention : ce sont des familles, des créateurs, des producteurs passionnés qui mettent leur cœur dans ce qu&apos;ils font, tout comme nous. »
          </p>
        </div>

        {/* Liste des partenaires sous forme de grille de cartes typographiques élégantes */}
        <div>
          <style>{`
            .partner-card-inner {
              position: relative;
              overflow: hidden;
              min-height: 130px;
            }
            .partner-default-content {
              display: flex;
              gap: 20px;
              opacity: 1;
              transition: opacity 0.3s ease, transform 0.3s ease;
            }
            .partner-hover-content {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              opacity: 0;
              visibility: hidden;
              padding: 20px;
              transition: opacity 0.3s ease, transform 0.3s ease;
              transform: translateY(10px);
            }
            .partner-hover-content p {
              font-size: 0.95rem;
              color: var(--text-dark, #2C1810);
              font-weight: 500;
              line-height: 1.5;
              margin: 0;
            }
            .partner-card-inner:hover .partner-default-content {
              opacity: 0;
              transform: translateY(-10px);
            }
            .partner-card-inner:hover .partner-hover-content {
              opacity: 1;
              visibility: visible;
              transform: translateY(0);
            }
          `}</style>
          <h2 className="partner-section-title">
            Des collaborations d'ici
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {partners.map((partner, index) => {
              const badge = getBadgeStyles(partner.location);
              return (
                <div 
                  key={index} 
                  id={`partner-text-${index}`}
                  className="partner-card partner-card-text-only partner-card-inner"
                >
                  {/* Contenu par défaut (Logo, Nom, Location) */}
                  <div className="partner-default-content">
                    <div className="partner-emoji">
                      {partner.emoji}
                    </div>

                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span className="partner-type">
                        {partner.type}
                      </span>
                      <h3 className="partner-name">
                        {partner.name}
                      </h3>
                      <div style={{ display: 'flex', marginTop: '6px' }}>
                        <span style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-xl)',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          📍 {partner.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contenu au survol (Description) */}
                  {partner.description && (
                    <div className="partner-hover-content">
                      <p>{partner.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Conclusion / Message de fin */}
        <div className="partner-conclusion">
          <div style={{
            fontSize: '4rem',
            color: 'var(--green-tropical)',
            opacity: '0.25', /* slightly increased opacity so the hands are visible */
            lineHeight: 1,
            marginBottom: '20px',
            fontFamily: 'var(--font-serif)',
          }}>
            🤝
          </div>
          <p className="partner-conclusion-text">
            « Parce qu&apos;au final, chaque achat local crée un impact réel dans notre communauté. Et ça, pour nous, ça change tout. »
          </p>
        </div>

      </main>

      {/* Petit espace sous le contenu */}
      <div style={{ height: 60 }} />
    </>
  );
}

// Styles dynamiques de badge d'emplacement
const getBadgeStyles = (location) => {
  if (location.includes('Sherbrooke')) {
    return {
      bg: 'rgba(74, 124, 89, 0.1)', // Vert clair
      color: '#2D5A3D',
    };
  }
  if (location.includes('Montréal')) {
    return {
      bg: 'rgba(184, 0, 62, 0.1)', // Crimson
      color: '#B8003E',
    };
  }
  if (location.includes('Estrie') || location.includes('Magog') || location.includes('Windsor')) {
    return {
      bg: 'rgba(201, 168, 76, 0.15)', // Gold
      color: '#A0802B',
    };
  }
  return {
    bg: 'rgba(90, 74, 66, 0.1)', // Text-medium
    color: '#5A4A42',
  };
};
