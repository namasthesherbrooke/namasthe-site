'use client';

import { useState, useEffect, useRef } from 'react';

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

export default function ProductsCarousel({ items, type }) {
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  // État de l'utilisateur pour le défilement (drag-to-scroll)
  const carouselRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Multiplicateur de vitesse
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const closeModal = () => setSelectedProduct(null);

  return (
    <div style={{ position: 'relative', margin: '0 -24px', padding: '0 24px' }}>
      {/* Conteneur du Carousel avec barre de défilement stylisée et drag-to-scroll */}
      <div 
        ref={carouselRef}
        className="products-carousel custom-scrollbar"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{
          scrollBehavior: isDragging ? 'auto' : 'smooth', // Désactiver smooth scroll pendant le drag
          position: 'relative',
          zIndex: 1,
          paddingBottom: '24px', // Espace pour la scrollbar
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none', // Empêcher la sélection de texte pendant le glissement
        }}
      >
        {items.map((item, i) => (
          <div className="product-card" key={i} id={`${type}-${i}`}>
            <div style={{
              width: '100%', height: 220,
              position: 'relative',
              background: 'transparent',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={getImageForProduct(item.name, type)} 
                alt={item.name || 'Produit Namasthé'} 
                style={{ 
                  width: '180px', 
                  height: '180px', 
                  objectFit: 'cover', 
                  pointerEvents: 'none',
                  borderRadius: '50%',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                }}
              />
              {item.tag && (
                <span className={`product-card-tag ${(item.tag === 'Zen' || item.tag === 'Salé') ? 'green' : ''}`} style={{ top: '16px', right: '16px', left: 'auto' }}>
                  {item.tag}
                </span>
              )}
            </div>
            <div className="product-card-body">
              <h3 style={{ fontSize: '1.45rem', marginBottom: '8px', lineHeight: '1.3' }}>{item.name}</h3>
              {/* La description a été retirée d'ici comme demandé */}
              <button 
                className="product-card-btn"
                onClick={() => setSelectedProduct({ ...item, index: i })}
                style={{ marginTop: '16px' }}
              >
                Découvrir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pop-up (Modal) */}
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
              width: '100%', height: '320px',
              position: 'relative',
              background: 'transparent',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: '20px'
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={getImageForProduct(selectedProduct.name, type)} 
                alt={selectedProduct.name || 'Produit Namasthé'} 
                style={{ 
                  width: '260px', 
                  height: '260px', 
                  objectFit: 'cover',
                  borderRadius: '50%',
                  boxShadow: '0 15px 30px rgba(0,0,0,0.2)'
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
              <p style={{ fontSize: '1.1rem', color: '#555', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                {selectedProduct.desc}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
