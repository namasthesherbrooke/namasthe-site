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

        {/* ========================================
            SECTION BOUTIQUE DYNAMIQUE
            ======================================== */}
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '40px' }}>
            {/* CARTE CADEAU */}
            <div style={{ 
              background: 'white', borderRadius: '16px', overflow: 'hidden', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column',
              transition: 'transform 0.3s ease'
            }}>
              <div style={{ height: '250px', width: '100%', overflow: 'hidden', background: '#FCE4EC', position: 'relative' }}>
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>🎁</div>
              </div>
              
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.4rem', color: '#2C1810', marginBottom: '10px', margin: 0 }}>Certificat Cadeau</h3>
                <p style={{ color: '#5A4A42', fontSize: '0.95rem', marginBottom: '20px', flex: 1, lineHeight: '1.5' }}>
                  Offrez le cadeau parfait ! Les certificats cadeaux électroniques NamasThé peuvent être utilisés en boutique ou pour vos achats en ligne.
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto' }}>
                  <a 
                    href="https://app.squareup.com/gift/MLBTQSZP7CFHZ/order" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      background: 'var(--crimson)',
                      color: 'white',
                      textDecoration: 'none',
                      border: 'none', padding: '12px 24px', borderRadius: '8px',
                      fontWeight: 'bold', cursor: 'pointer',
                      transition: 'background 0.2s, transform 0.1s',
                      display: 'inline-block',
                      width: '100%',
                      textAlign: 'center'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--crimson-light)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--crimson)' }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    Acheter en ligne 🎁
                  </a>
                </div>
              </div>
            </div>

            {filteredItems && filteredItems.map((product) => {
              const isSoldOut = product.is_sold_out;
              const currentVarId = selectedVariations[product.id] || (product.variations?.length > 0 ? product.variations[0].id : '');
                const currentVar = product.variations?.find(v => v.id === currentVarId) || product.variations?.[0];
                const price = currentVar ? currentVar.price : product.price;

                return (
                  <div key={product.id} style={{ 
                    background: 'white', borderRadius: '16px', overflow: 'hidden', 
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column',
                    transition: 'transform 0.3s ease', opacity: isSoldOut ? 0.6 : 1
                  }}>
                    <div className="boutique-card-img-container" style={{ height: '250px', width: '100%', overflow: 'hidden', background: '#f5f5f5', position: 'relative' }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="boutique-card-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div className="boutique-card-img" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🍵</div>
                      )}
                      {isSoldOut && (
                        <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(211, 47, 47, 0.9)', color: 'white', padding: '5px 10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          Épuisé
                        </div>
                      )}
                    </div>
                    
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, textAlign: 'left' }}>
                      <h3 style={{ fontSize: '1.4rem', color: '#2C1810', marginBottom: '10px', margin: 0 }}>{product.name}</h3>
                      <p style={{ color: '#5A4A42', fontSize: '0.95rem', marginBottom: '20px', flex: 1, lineHeight: '1.5' }}>
                        {product.description || "Aucune description pour l'instant."}
                      </p>
                      
                      {product.variations && product.variations.length > 1 && (
                        <div style={{ marginBottom: '15px' }}>
                          <select 
                            value={currentVarId} 
                            onChange={(e) => handleVariationChange(product.id, e.target.value)}
                            disabled={isSoldOut}
                            style={{ 
                              width: '100%', padding: '10px', borderRadius: '8px', 
                              border: '1px solid #ddd', background: isSoldOut ? '#e9e9e9' : '#f9f9f9', 
                              fontFamily: 'inherit', color: '#2C1810', cursor: isSoldOut ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {product.variations.map(v => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Sélecteurs pour les modificateurs de la boutique (ex: Saveur de thé) */}
                      {product.modifier_lists && product.modifier_lists.length > 0 && (() => {
                        let renderLists = [...product.modifier_lists];
                        
                        // Patch : Sachet individuel a 2 listes attachées par erreur dans Square, on n'en garde qu'une
                        if (product.name && product.name.toLowerCase().includes('sachet de jus sans sucre (64 portions)')) {
                          renderLists = [renderLists[0]];
                        }

                        if (product.name && product.name.toLowerCase().includes('ensemble thé, bulle, jus x2')) {
                          const jusListId = menu.modifierLists.find(l => l.name && l.name.toLowerCase().includes('sachet jus sans sucre'))?.id;
                          if (jusListId) {
                            renderLists.push(`${jusListId}_extra`);
                          }
                        }

                        return renderLists.map(rawListId => {
                          const isExtra = rawListId.endsWith('_extra');
                          const listId = isExtra ? rawListId.replace('_extra', '') : rawListId;
                          const list = menu.modifierLists.find(l => l.id === listId);
                          if (!list || list.modifiers.length === 0) return null;
                          
                          const stateKey = isExtra ? `${listId}_extra` : listId;
                          const currentModId = selectedModifiers[product.id]?.[stateKey] || list.modifiers[0].id;

                          return (
                            <div key={stateKey} style={{ marginBottom: '15px' }}>
                              <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>
                                {list.name} {isExtra ? '(2e choix)' : ''}
                              </label>
                              <select 
                                value={currentModId} 
                                onChange={(e) => handleModifierChange(product.id, stateKey, e.target.value)}
                                disabled={isSoldOut}
                                style={{ 
                                  width: '100%', padding: '10px', borderRadius: '8px', 
                                  border: '1px solid #ddd', background: isSoldOut ? '#e9e9e9' : '#f9f9f9', 
                                  fontFamily: 'inherit', color: '#2C1810', cursor: isSoldOut ? 'not-allowed' : 'pointer'
                                }}
                              >
                                {list.modifiers.map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} {m.price > 0 ? `(+${m.price.toFixed(2)}$)` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        });
                      })()}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isSoldOut ? '#999' : 'var(--green-tropical)' }}>
                          {parseFloat(price || 0).toFixed(2)} $
                        </span>
                        <button 
                          onClick={() => handleAddToCart(product)}
                          disabled={isSoldOut || addedState[product.id]}
                          style={{
                            background: addedState[product.id] ? '#4CAF50' : (isSoldOut ? '#ccc' : 'var(--crimson)'),
                            color: isSoldOut ? '#666' : 'white',
                            border: 'none', padding: '12px 24px', borderRadius: '8px',
                            fontWeight: 'bold', cursor: (isSoldOut || addedState[product.id]) ? 'not-allowed' : 'pointer',
                            transition: 'background 0.3s, transform 0.1s'
                          }}
                          onMouseEnter={e => { if (!isSoldOut && !addedState[product.id]) e.currentTarget.style.background = 'var(--crimson-light)' }}
                          onMouseLeave={e => { if (!isSoldOut && !addedState[product.id]) e.currentTarget.style.background = 'var(--crimson)' }}
                          onMouseDown={e => { if (!isSoldOut && !addedState[product.id]) e.currentTarget.style.transform = 'scale(0.95)' }}
                          onMouseUp={e => { if (!isSoldOut && !addedState[product.id]) e.currentTarget.style.transform = 'scale(1)' }}
                        >
                          {addedState[product.id] ? 'Ajouté ! ✓' : 'Ajouter 🛍️'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
            })}
          </div>

          {(!filteredItems || filteredItems.length === 0) && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginTop: '40px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📦</div>
              <h3 style={{ color: '#2C1810', marginBottom: '15px', fontSize: '1.5rem' }}>Boutique en réapprovisionnement</h3>
              <p style={{ color: '#5A4A42', fontSize: '1.1rem' }}>Nos autres produits de la Boutique NamasThé arrivent très bientôt.</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
