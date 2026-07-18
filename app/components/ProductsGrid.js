'use client';

import { useState, useEffect } from 'react';
import nutritionData from '../data/nutrition.json';

const imageMap = {
  // Breuvages
  matcha: '/images/products/Matcha.jpeg',
  megaThe: '/images/products/Mega-the.jpeg',
  matchaChaud: '/images/products/Matcha chaud.jpeg',
  matchaGlace: '/images/products/Matcha glace.jpeg',
  matchaSignature: '/images/products/Matcha signature.jpeg',
  hydraThe: '/images/products/Hydra-the.jpeg',
  smoothieBubble: '/images/products/Smoothies bubble.jpeg',
  bubble: '/images/products/Bubble tea.jpeg',
  frappe: '/images/products/Frappé givré.jpeg',
  simplicite: '/images/products/Simplicithé.jpeg',
  cafeGlace: '/images/products/Café glacé.jpeg',
  cafe: '/images/products/Café spécialisé.jpeg',
  dirtySoda: '/images/products/Dirty soda.jpeg',
  fruithe: '/images/products/Fruithé.jpeg',
  lotus: '/images/products/Lotus.jpeg',
  mindblow: '/images/products/Mindblow.jpeg',
  namastTails: '/images/products/Namast-tails.jpeg',
  raffraichiThe: '/images/products/Rafraichi-thé.jpeg',
  shake: '/images/products/Shake.jpeg',
  cremeGlacee: '/images/products/creme glacee.jpeg',
  
  // Grignotages
  namdej: '/images/products/Namdej.png',
  bagelDejeuner: '/images/products/Bagel dejeuner.png',
  smoothie: '/images/products/Smoothie bol.jpeg',
  gaufre: '/images/products/Gaufre.jpeg',
  beigne: '/images/products/Beignes.jpeg',

  // Fallbacks
  fallbackDrink: '/images/products/drink_fallback_1780448448326.png',
  fallbackFood: '/images/products/healthy_food_fallback_1780448434130.png'
};

const getImageForProduct = (name, type) => {
  if (!name) return type === 'boisson' ? imageMap.fallbackDrink : imageMap.fallbackFood;
  
  const n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // enlever les accents
  
  // Grignotages
  if (n.includes('namdej')) return imageMap.namdej;
  if (n.includes('bagel')) return imageMap.bagelDejeuner;
  if (n.includes('smoothie bol') || n.includes('smoothie bowl')) return imageMap.smoothie;
  if (n.includes('gaufre')) return imageMap.gaufre;
  if (n.includes('beigne')) return imageMap.beigne;
  if (n.includes('creme glacee') || n.includes('crème glacée')) return imageMap.cremeGlacee;

  // Boissons
  if (n.includes('mega-the') || n.includes('megathe')) return imageMap.megaThe;
  if (n.includes('hydra-the') || n.includes('hydrathe')) return imageMap.hydraThe;
  if (n.includes('matcha signature') || n.includes('matchas signature')) return imageMap.matchaSignature;
  if (n.includes('matcha chaud') || n.includes('matchas chauds')) return imageMap.matchaChaud;
  if (n.includes('matcha glace') || n.includes('matchas glaces')) return imageMap.matchaGlace;
  if (n.includes('matcha')) return imageMap.matcha;
  if (n.includes('smoothie bubble') || n.includes('smoothies bubble')) return imageMap.smoothieBubble;
  if (n.includes('bubble')) return imageMap.bubble;
  if (n.includes('frappe givre') || n.includes('frappes givres')) return imageMap.frappe;
  if (n.includes('simplici-the') || n.includes('simplicithe')) return imageMap.simplicite;
  if (n.includes('cafe glace') || n.includes('cafes glaces')) return imageMap.cafeGlace;
  if (n.includes('cafe')) return imageMap.cafe;
  if (n.includes('dirty soda')) return imageMap.dirtySoda;
  if (n.includes('fruithe')) return imageMap.fruithe;
  if (n.includes('lotus')) return imageMap.lotus;
  if (n.includes('mindblow')) return imageMap.mindblow;
  if (n.includes('namas-tails') || n.includes('namas tails') || n.includes('namast-tails')) return imageMap.namastTails;
  if (n.includes('raffraichi-the') || n.includes('rafraichi-the') || n.includes('rafraichithe')) return imageMap.raffraichiThe;
  if (n.includes('shake')) return imageMap.shake;
  
  // Fallbacks
  return type === 'boisson' ? imageMap.fallbackDrink : imageMap.fallbackFood;
};

export default function ProductsGrid({ items, type }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeFilter, setActiveFilter] = useState('Tous');

  // Empêcher le défilement de l'arrière-plan quand le modal est ouvert
  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedProduct]);

  // Extraire les tags uniques pour les filtres
  const uniqueTags = Array.from(new Set(items.map(item => item.tag).filter(Boolean)));
  // Trier alphabétiquement (optionnel) mais on garde un ordre défini ou brut
  uniqueTags.sort();

  const filteredItems = activeFilter === 'Tous' 
    ? items 
    : items.filter(item => item.tag === activeFilter);

  const closeModal = () => setSelectedProduct(null);

  return (
    <div style={{ position: 'relative' }}>
      
      {/* ========================================
          BARRE DE FILTRES
          ======================================== */}
      {uniqueTags.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '32px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setActiveFilter('Tous')}
            style={{
              padding: '8px 20px',
              borderRadius: '30px',
              border: activeFilter === 'Tous' ? '2px solid var(--green-tropical)' : '1px solid #ddd',
              background: activeFilter === 'Tous' ? 'rgba(76, 175, 80, 0.1)' : 'white',
              color: activeFilter === 'Tous' ? 'var(--green-tropical)' : '#666',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Tous
          </button>
          {uniqueTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveFilter(tag)}
              style={{
                padding: '8px 20px',
                borderRadius: '30px',
                border: activeFilter === tag ? '2px solid var(--green-tropical)' : '1px solid #ddd',
                background: activeFilter === tag ? 'rgba(76, 175, 80, 0.1)' : 'white',
                color: activeFilter === tag ? 'var(--green-tropical)' : '#666',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* ========================================
          GRILLE DE PRODUITS
          ======================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '30px',
      }}>
        {filteredItems.map((item, i) => (
          <div className="product-card" key={i} id={`${type}-${i}`} style={{ minWidth: 'auto', margin: 0, overflow: 'hidden' }}>
            <div style={{
              width: '100%', height: 260,
              position: 'relative',
              background: '#F9F7F4',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }} className="product-card-img-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={getImageForProduct(item.name, type)} 
                alt={item.name || 'Produit Namasthé'} 
                className="zoom-on-hover"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain', 
                  pointerEvents: 'none',
                  padding: '16px'
                }}
              />
              {item.tag && (
                <span className={`product-card-tag ${(item.tag === 'Zen' || item.tag === 'Salé') ? 'green' : ''}`} style={{ top: '16px', right: '16px', left: 'auto' }}>
                  {item.tag}
                </span>
              )}
            </div>
            <div className="product-card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.45rem', marginBottom: '8px', lineHeight: '1.3', textAlign: 'center' }}>{item.name}</h3>
              {item.desc && item.desc !== 'Aucune description disponible.' && (
                <p style={{ 
                  fontSize: '0.9rem', color: '#666', textAlign: 'center', marginBottom: '15px', 
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' 
                }}>
                  {item.desc}
                </p>
              )}
              <button 
                className="product-card-btn"
                onClick={() => setSelectedProduct({ ...item, index: i })}
                style={{ marginTop: 'auto' }}
              >
                Découvrir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================
          MODAL (POP-UP)
          ======================================== */}
      {selectedProduct && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            backdropFilter: 'blur(5px)',
          }}
          onClick={closeModal}
        >
          <div 
            style={{
              background: 'var(--white)',
              borderRadius: '24px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              transform: 'translateY(0)',
              transition: 'transform 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()} // Empêche la fermeture au clic à l'intérieur
            className="modal-scroll"
          >
            {/* Bouton Fermer */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '1.2rem',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}
            >
              ✕
            </button>

            {/* Photo agrandie */}
            <div style={{
              width: '100%', height: '350px',
              position: 'relative',
              background: '#F9F7F4',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '24px 24px 0 0',
              overflow: 'hidden'
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={getImageForProduct(selectedProduct.name, type)} 
                alt={selectedProduct.name || 'Produit Namasthé'} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  padding: '24px'
                }}
              />
              {selectedProduct.tag && (
                <span className={`product-card-tag ${(selectedProduct.tag === 'Zen' || selectedProduct.tag === 'Salé') ? 'green' : ''}`} style={{ fontSize: '1.1rem', padding: '8px 20px', top: '16px', right: '16px', left: 'auto' }}>
                  {selectedProduct.tag}
                </span>
              )}
            </div>

            {/* Contenu Description */}
            <div style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '2rem', color: 'var(--text-dark)', marginBottom: '20px' }}>
                {selectedProduct.name}
              </h2>
              <div style={{ width: '50px', height: '4px', background: 'var(--green-tropical)', marginBottom: '20px', borderRadius: '2px' }}></div>
              <p style={{ fontSize: '1.1rem', color: '#555', lineHeight: '1.7', whiteSpace: 'pre-line', marginBottom: '24px' }}>
                {selectedProduct.desc}
              </p>

              {/* Valeurs nutritives */}
              {(() => {
                const normalizeString = (str) => {
                  if (!str) return '';
                  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                };
                
                const searchName = normalizeString(selectedProduct.name);
                let matchedKey = Object.keys(nutritionData).find(key => normalizeString(key) === searchName);
                
                // Logique de fallback si le nom de la base de données est différent
                if (!matchedKey) {
                  if (searchName.includes('lotus')) matchedKey = 'Lotus';
                  else if (searchName.includes('mega')) matchedKey = 'Méga thé';
                  else if (searchName.includes('mindblow')) matchedKey = 'Mindblow';
                  else if (searchName.includes('rafraichi') || searchName.includes('raffraichi')) matchedKey = 'Raffraichi-Thé';
                  else if (searchName.includes('simplici')) matchedKey = 'Simplicithé';
                  else if (searchName.includes('bol') || searchName.includes('bowl')) matchedKey = 'Smoothie bol';
                  else if (searchName.includes('shake')) matchedKey = 'Shake';
                }
                
                if (!matchedKey || !nutritionData[matchedKey]) return null;
                const data = Array.isArray(nutritionData[matchedKey]) ? nutritionData[matchedKey] : [nutritionData[matchedKey]];

                return (
                <div style={{ background: '#Fdfcfb', border: '1px solid #Eae4d8', borderRadius: '16px', padding: '20px', marginTop: '20px' }}>
                  <h4 style={{ color: '#2C1810', fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>💪</span> Valeurs nutritives
                  </h4>
                  
                  {data.map((nutrition, idx) => (
                    <div key={idx} style={{ marginBottom: idx !== data.length - 1 ? '24px' : '0' }}>
                      {nutrition.variant && (
                        <div style={{ fontWeight: 'bold', color: '#B8003E', marginBottom: '12px', fontSize: '1.05rem', borderBottom: '1px solid #Eae4d8', paddingBottom: '4px' }}>
                          {nutrition.variant}
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#2C1810' }}>{nutrition.calories}</div>
                          <div style={{ fontSize: '0.85rem', color: '#888' }}>Calories</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#B8003E' }}>{nutrition.proteines}g</div>
                          <div style={{ fontSize: '0.85rem', color: '#888' }}>Protéines</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#FFA000' }}>{nutrition.glucides}g</div>
                          <div style={{ fontSize: '0.85rem', color: '#888' }}>Glucides</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#4CAF50' }}>{nutrition.lipides}g</div>
                          <div style={{ fontSize: '0.85rem', color: '#888' }}>Lipides</div>
                        </div>
                      </div>
                      
                      {/* Vitamines et minéraux optionnels */}
                      {nutrition.vitamines && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #Eae4d8' }}>
                          <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '8px' }}>Vitamines & Minéraux</div>
                          
                          {Array.isArray(nutrition.vitamines) ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                              {nutrition.vitamines.map((vit, vIdx) => (
                                <div key={vIdx} style={{ background: '#FFF5F7', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', color: '#B8003E', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>{vit.nom}</span>
                                  {vit.quantite && <span style={{ color: '#2C1810', background: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>{vit.quantite}</span>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '1rem', color: '#2C1810', fontWeight: '500' }}>
                              {nutrition.vitamines}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
