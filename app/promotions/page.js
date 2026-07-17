/**
 * Promotions — Page cachée affichant les produits en promotion
 * 
 * Accessible via la banderole promotionnelle défilante en haut du site.
 * N'apparaît PAS dans la navigation principale.
 * 
 * Affiche une grille de produits dont is_promotion = true
 * avec les prix barrés et les prix promo.
 */

/* Configuration des promotions (facile à modifier) */

// Promotions quotidiennes (Partie du haut - Grille à droite de la photo)
const dailyPromos = [
  { jour: 'Dimanche', offre: 'Fermé' },
  { jour: 'Lundi', offre: 'Fermé' },
  { jour: 'Mardi', offre: <><strong>Club productif/éducation</strong> : Travailleurs, entrepreneurs, enseignants, éducateurs.</> },
  { jour: 'Mercredi', offre: <><strong>Club Communauté</strong> : Retraités, bénévoles, vétérinaires, refuges.</> },
  { jour: 'Jeudi', offre: <><strong>Club Terrain</strong> : Construction, livraison, sécurité, services essentiels.</> },
  { jour: 'Vendredi', offre: <><strong>Club service</strong> : Restauration, commerce, service à la clientèle.</> },
  { jour: 'Samedi', offre: <><strong>Club Famille</strong> : Familles, mamans avec enfants</> },
];

// Autres promotions en cours (Partie du bas)
const autresPromos = [
  { 
    nom: 'DUO', 
    description: '1,50$ de rabais sur un duo Sandwich + Breuvage', 
    duree: 'En tout temps' 
  },
  { 
    nom: 'Rabais CIUSSS', 
    description: 'Rabais de 15% pour tout employé du CIUSSS', 
    duree: 'En tout temps' 
  },
  { 
    nom: 'Rabais étudiant', 
    description: '10% de rabais pour tous les étudiants', 
    duree: 'En tout temps' 
  },

];

export default function PromotionsPage() {
  return (
    <section className="section" id="promotions-section">
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '60px', paddingBottom: '40px' }}>
        
        {/* --- PARTIE DU HAUT : Promotions Quotidiennes --- */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>Promotions de la semaine</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-medium)' }}>
              Une raison différente de venir nous voir chaque jour !
            </p>
          </div>

          <div className="promo-grid-layout">
            {/* Colonne 1 : Image (Rendue Sticky) */}
            <div className="promo-hero-col">
              <img 
                src="/promo_hero.png" 
                alt="Bubble Tea Namasthé"
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
              />
            </div>

            {/* Colonne 2 : Spéciaux de la semaine */}
            <div className="promo-col-content">
              <span style={{ 
                display: 'inline-block', background: '#FDECEA', color: '#D32F2F', 
                padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '16px', alignSelf: 'flex-start', textTransform: 'uppercase'
              }}>
                 Spéciaux de la semaine, pour nos clubs
              </span>

              <div style={{ marginBottom: '24px', padding: '12px', background: 'var(--beige)', borderRadius: '12px', borderLeft: '3px solid var(--gold)' }}>
                <div style={{ fontWeight: '700', color: 'var(--text-dark)', fontSize: '0.95rem' }}>10% de rabais sur 1 breuvage</div>
                <div style={{ fontWeight: '700', color: 'var(--text-medium)', fontSize: '0.8rem', margin: '4px 0 4px 12px' }}>OU</div>
                <div style={{ fontWeight: '700', color: 'var(--text-dark)', fontSize: '0.95rem' }}>1 Extra gratuit <span style={{ fontWeight: '400', fontSize: '0.85rem' }}>(Bubbles, Mousse, Énergie, Fruits lyophilisés)</span></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dailyPromos.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'grid', gridTemplateColumns: '105px 1fr', gap: '12px', 
                    borderBottom: index !== dailyPromos.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                    paddingBottom: index !== dailyPromos.length - 1 ? '12px' : '0'
                  }}>
                    <span style={{ fontWeight: '700', color: 'var(--crimson)', fontSize: '1.05rem' }}>{item.jour}</span>
                    <span style={{ color: 'var(--text-dark)', lineHeight: '1.4', fontSize: '1.05rem' }}>{item.offre}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Séparateur Vertical Dégradé */}
            <div className="promo-separator"></div>

            {/* Colonne 3 : Autres Promotions */}
            <div className="promo-col-content">
              <span style={{ 
                display: 'inline-block', background: '#FDECEA', color: '#D32F2F', 
                padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '16px', alignSelf: 'flex-start'
              }}>
                🌟 AUTRES PROMOTIONS EN COURS
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {autresPromos.map((promo, i) => (
                  <div key={i} style={{ 
                    background: 'var(--beige)', padding: '12px 16px', borderRadius: '12px', 
                    display: 'flex', flexDirection: 'column', gap: '6px',
                    borderLeft: '4px solid var(--crimson)',
                    height: '120px',
                    justifyContent: 'space-between',
                    overflow: 'hidden'
                  }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-dark)' }}>{promo.nom}</h3>
                    <p style={{ color: 'var(--text-medium)', lineHeight: '1.3', fontSize: '0.85rem' }}>{promo.description}</p>
                    <div style={{ 
                      marginTop: '2px', padding: '2px 6px', background: 'rgba(184,0,62,0.08)', 
                      borderRadius: '6px', color: 'var(--crimson)', fontWeight: '600', fontSize: '0.75rem',
                      display: 'inline-flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start'
                    }}>
                      ⏱️ {promo.duree}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Mentions légales */}
          <div style={{ 
            textAlign: 'right', 
            marginTop: '16px', 
            fontSize: '0.85rem', 
            color: 'var(--text-medium)', 
            fontStyle: 'italic',
            paddingRight: '12px'
          }}>
            * Certaines conditions s'appliquent.
          </div>
        </div>
      </div>
    </section>
  );
}
