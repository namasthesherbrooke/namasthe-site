'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

export default function BoutiquePage() {
  const [menu, setMenu] = useState({ items: [], modifierLists: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [selectedVariations, setSelectedVariations] = useState({});
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [addedState, setAddedState] = useState({});
  const { addToCart } = useCart();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/menu', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.menu) {
        setMenu(data.menu);
      }
    } catch (err) {
      console.error("Erreur de chargement de la boutique", err);
    }
    setLoading(false);
  };

  const allowedCategories = ['boutique namasthé'];
  const allowedCategoryIds = menu.categories
    ? menu.categories.filter(c => allowedCategories.includes(c.name.toLowerCase().trim())).map(c => c.id)
    : [];

  const filteredItems = menu.items
    ? menu.items.filter(item => allowedCategoryIds.includes(item.category_id))
    : [];

  const handleVariationChange = (productId, variationId) => {
    setSelectedVariations(prev => ({ ...prev, [productId]: variationId }));
  };

  const handleModifierChange = (productId, listId, modifierId) => {
    setSelectedModifiers(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [listId]: modifierId
      }
    }));
  };

  const handleAddToCart = (product) => {
    const variationId = selectedVariations[product.id] || (product.variations?.length > 0 ? product.variations[0].id : null);
    const variation = product.variations?.find(v => v.id === variationId) || product.variations?.[0];

    if (!variation) return;

    let finalPrice = parseFloat(variation.price || product.price || 0);
    const ingredientIds = [];
    const extrasNames = [];

    if (product.modifier_lists) {
      let processLists = [...product.modifier_lists];
      
      // Patch : Sachet individuel a 2 listes attachées par erreur dans Square, on n'en garde qu'une
      if (product.name && product.name.toLowerCase().includes('sachet de jus sans sucre (64 portions)')) {
        processLists = [processLists[0]];
      }

      // Cas spécial : Ensemble x2 donne droit à un 2e sachet de jus
      if (product.name && product.name.toLowerCase().includes('ensemble thé, bulle, jus x2')) {
        const jusList = menu.modifierLists.find(l => l.name && l.name.toLowerCase().includes('sachet jus sans sucre'));
        if (jusList) {
          processLists.push(`${jusList.id}_extra`);
        }
      }

      processLists.forEach(rawListId => {
        const isExtra = rawListId.endsWith('_extra');
        const listId = isExtra ? rawListId.replace('_extra', '') : rawListId;
        const list = menu.modifierLists.find(l => l.id === listId);
        
        if (list && list.modifiers.length > 0) {
          const stateKey = isExtra ? `${listId}_extra` : listId;
          const modId = selectedModifiers[product.id]?.[stateKey] || list.modifiers[0].id;
          const mod = list.modifiers.find(m => m.id === modId);
          if (mod) {
            finalPrice += parseFloat(mod.price || 0);
            ingredientIds.push(mod.id);
            extrasNames.push(mod.name + (isExtra ? ' (2e choix)' : ''));
          }
        }
      });
    }

    const extrasStr = extrasNames.length > 0 ? ` (${extrasNames.join(', ')})` : '';

    const cartItem = {
      id: `${product.id}-${variation.id}-${ingredientIds.join('-')}-${Date.now()}`,
      base_product_id: variation.id || product.id,
      name: `${product.name}${variation.name !== 'Regular' && variation.name !== 'Standard' ? ` - ${variation.name}` : ''}${extrasStr}`,
      price: finalPrice,
      image: product.image_url || '/logo-new.png',
      ingredient_ids: ingredientIds
    };

    addToCart(cartItem);
    
    // Animation Ajouté ! ✓
    setAddedState(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedState(prev => ({ ...prev, [product.id]: false }));
    }, 1500);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div style={{ padding: '100px 20px', textAlign: 'center', fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--crimson)' }}>Chargement de la Boutique...</div>;
  }

  return (
    <div style={{ background: '#fdfcfb', minHeight: '100vh', padding: '120px 20px 60px', fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* ========================================
            HERO GLOBAL
            ======================================== */}
        <header style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', color: '#2C1810', fontSize: '3rem', marginBottom: '10px' }}>
            La boutique
          </h1>
          <p style={{ color: '#5A4A42', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto', marginBottom: '30px' }}>
            Retrouvez tous nos produits dérivés et nos ingrédients pour reproduire l'expérience Namasthé à la maison.
          </p>
        </header>

        
        {/* SECTION BOUTIQUE EN MAINTENANCE */}
        <section>
          <div style={{ textAlign: 'center', background: '#FFF3F3', padding: '60px 20px', borderRadius: '16px', border: '2px solid var(--crimson)', marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--crimson)', fontSize: '2.5rem', marginBottom: '20px' }}>🚧 Boutique en ajustement</h2>
            <p style={{ color: '#2C1810', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
              Nous faisons actuellement une mise à jour majeure de notre système de boutique en ligne. 
              Les achats de produits et de cartes-cadeaux sont <strong>temporairement suspendus</strong>.
            </p>
            <p style={{ color: '#2C1810', fontSize: '1.1rem', marginTop: '20px', fontWeight: 'bold' }}>
              Merci de votre compréhension. Retrouvez tous nos produits directement au Café Namasthé !
            </p>
          </div>
        </section>
      

      </div>
    </div>
  );
}
