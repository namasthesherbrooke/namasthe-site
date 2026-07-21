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

        
        {/* LISTE DES PRODUITS */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
          {filteredItems.map(product => (
            <div key={product.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1', marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', background: '#f5f5f5' }}>
                <img src={product.image_url || '/logo-new.png'} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                {product.is_sold_out && (
                  <div style={{ position: 'absolute', top: 10, right: 10, background: '#D32F2F', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    Épuisé
                  </div>
                )}
              </div>
              
              <h3 style={{ fontSize: '1.4rem', color: '#2C1810', marginBottom: '10px' }}>{product.name}</h3>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px', flex: 1 }}>{product.description}</p>
              
              {product.variations && product.variations.length > 1 && (
                <div style={{ marginBottom: '15px' }}>
                  <select 
                    value={selectedVariations[product.id] || product.variations[0].id}
                    onChange={(e) => handleVariationChange(product.id, e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  >
                    {product.variations.map(v => (
                      <option key={v.id} value={v.id} disabled={v.is_sold_out}>
                        {v.name} - {parseFloat(v.price).toFixed(2)}$
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--green-tropical)' }}>
                  {product.variations && product.variations.length === 1 ? parseFloat(product.variations[0].price).toFixed(2) : (product.variations?.find(v => v.id === selectedVariations[product.id])?.price || product.price)} $
                </span>
                
                <button 
                  onClick={() => handleAddToCart(product)}
                  disabled={product.is_sold_out}
                  style={{
                    background: addedState[product.id] ? '#4CAF50' : (product.is_sold_out ? '#ccc' : 'var(--crimson)'),
                    color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: product.is_sold_out ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease'
                  }}
                >
                  {addedState[product.id] ? 'Ajouté ! ✓' : (product.is_sold_out ? 'Indisponible' : 'Ajouter')}
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
