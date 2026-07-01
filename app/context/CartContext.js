'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Charger le panier depuis localStorage au démarrage
  useEffect(() => {
    const savedCart = localStorage.getItem('namasthe_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Erreur de chargement du panier", e);
      }
    }
  }, []);

  // Sauvegarder le panier à chaque modification
  useEffect(() => {
    localStorage.setItem('namasthe_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    // Animation de vol vers le panier (Effet "Wow")
    try {
      if (typeof window !== 'undefined' && window.event) {
        const e = window.event;
        const x = e.clientX || e.touches?.[0]?.clientX;
        const y = e.clientY || e.touches?.[0]?.clientY;
        
        if (x && y) {
          const flyingImg = document.createElement('img');
          flyingImg.src = product.image || product.image_url || '/logo.png';
          flyingImg.style.position = 'fixed';
          flyingImg.style.left = `${x - 25}px`;
          flyingImg.style.top = `${y - 25}px`;
          flyingImg.style.width = '50px';
          flyingImg.style.height = '50px';
          flyingImg.style.borderRadius = '50%';
          flyingImg.style.objectFit = 'cover';
          flyingImg.style.zIndex = '999999';
          flyingImg.style.pointerEvents = 'none';
          flyingImg.style.transition = 'all 1.2s cubic-bezier(0.25, 1, 0.5, 1)';
          flyingImg.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
          
          document.body.appendChild(flyingImg);
          
          // Animer vers l'icône du panier en haut à droite
          setTimeout(() => {
            flyingImg.style.left = 'calc(100vw - 60px)'; 
            flyingImg.style.top = '30px';
            flyingImg.style.transform = 'scale(0.1) rotate(180deg)';
            flyingImg.style.opacity = '0';
          }, 10);
          
          setTimeout(() => {
            if (document.body.contains(flyingImg)) {
              document.body.removeChild(flyingImg);
            }
          }, 1200);
        }
      }
    } catch (err) {
      console.log('Erreur animation panier', err);
    }

    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    
    // Délai avant d'ouvrir le panier pour laisser le temps à l'animation de jouer un peu
    setTimeout(() => setIsCartOpen(true), 1200);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  // Calcul des taxes (Québec)
  const TPS_RATE = 0.05;
  const TVQ_RATE = 0.09975;
  const tpsAmount = cartTotal * TPS_RATE;
  const tvqAmount = cartTotal * TVQ_RATE;
  const grandTotal = cartTotal + tpsAmount + tvqAmount;

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, updateQuantity, clearCart, 
      cartTotal, cartItemCount, isCartOpen, setIsCartOpen,
      tpsAmount, tvqAmount, grandTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
