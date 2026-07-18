'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

const JUS_MODIFIER_LIST = {
  id: 'ml_jus_custom', name: 'Jus sans sucre / Personnalisation', max: 3, min: 0,
  modifiers: [
    { id: 'j1', name: 'Cerise sure' }, { id: 'j2', name: 'Cerise' }, { id: 'j3', name: 'Framboise bleue' },
    { id: 'j4', name: 'Framboise bleue sure' }, { id: 'j5', name: 'Pomme verte sure' }, { id: 'j6', name: 'Raisin vert' },
    { id: 'j7', name: 'Raisin' }, { id: 'j8', name: 'Fraise' }, { id: 'j9', name: 'Fraise sure' },
    { id: 'j10', name: 'Pêche' }, { id: 'j11', name: 'Pêche sure' }, { id: 'j12', name: 'Melon d\'eau' },
    { id: 'j13', name: 'Melon d\'eau sure' }, { id: 'j14', name: 'Limonade' }, { id: 'j15', name: 'Limonade rose' },
    { id: 'j16', name: 'Concombre' }, { id: 'j17', name: 'Ananas' }, { id: 'j18', name: 'Mangue' },
    { id: 'j19', name: 'Fruit de la passion' }, { id: 'j20', name: 'Fruit du dragon' }, { id: 'j21', name: 'Framboise' },
    { id: 'j22', name: 'Bonbon arc en ciel' }, { id: 'j23', name: 'Canneberge' }, { id: 'j24', name: 'Coconut' },
    { id: 'j25', name: 'Pina colada' }, { id: 'j26', name: 'Banane' }, { id: 'j27', name: 'Margarita' },
    { id: 'j28', name: 'Bubble gum' }, { id: 'j29', name: 'Litchi' }, { id: 'j30', name: 'Kiwi' },
    { id: 'j31', name: 'Fraise kiwi' }, { id: 'j32', name: 'Orange' }, { id: 'j33', name: 'Figue de barbarie' },
    { id: 'j34', name: 'Bleuet' }, { id: 'j35', name: 'Cantaloup' }
  ]
};

const CUSTOMIZABLE_DRINKS = ['méga thé', 'lotus (boisson holistique)', 'lotus (boisson holstique)', 'simplicithé', 'mindblow', 'boisson digestive', 'hydrathé'];

export default function OrderBuilder() {
  const [menu, setMenu] = useState({ items: [], modifierLists: [], categories: [] });
  const [loading, setLoading] = useState(true);
  
  // États de sélection
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [creationMode, setCreationMode] = useState('preset'); // 'preset' or 'custom'
  const [customRecipeName, setCustomRecipeName] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);

  const { addToCart } = useCart();

  useEffect(() => {
    fetchData();
    try {
      const favs = JSON.parse(localStorage.getItem('namasthe_favorites') || '[]');
      setFavorites(favs);
      const history = JSON.parse(localStorage.getItem('namasthe_order_history') || '[]');
      setOrderHistory(history);
    } catch(e) {
      console.error(e);
    }
  }, []);

  // Écouter le chargement du menu pour appliquer la recette si elle est présente dans l'URL
  useEffect(() => {
    if (menu.items && menu.items.length > 0 && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const recipeParam = params.get('recipe');
      if (recipeParam) {
        try {
          const recipe = JSON.parse(recipeParam);
          const product = menu.items.find(i => i.id === recipe.productId);
          if (product) {
            setSelectedProduct(product);
            const variation = product.variations?.find(v => v.id === recipe.variationId);
            setSelectedVariation(variation || (product.variations?.length > 0 ? product.variations[0] : null));
            setSelectedQuantities(recipe.modifiers || {});
            
            // Nettoyer l'URL
            window.history.replaceState({}, '', '/commande');
            
            // Scroll vers la section de personnalisation
            setTimeout(() => window.scrollTo({ top: 400, behavior: 'smooth' }), 200);
          }
        } catch (e) {
          console.error("Impossible de parser la recette de l'URL", e);
        }
      }
    }
  }, [menu]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/menu', { cache: 'no-store' });
      const data = await res.json();
      
      if (data.success && data.menu) {
        setMenu(data.menu);
      }
    } catch (err) {
      console.error("Erreur de chargement du menu", err);
    }
    setLoading(false);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSelectedQuantities({}); // Reset des ingrédients
    setCreationMode('preset'); // Reset du mode
    setCustomRecipeName(''); // Reset custom recipe
    setSelectedVariation(product.variations && product.variations.length > 0 ? product.variations[0] : null);
    
    // Défilement automatique vers la section de personnalisation (pratique sur mobile)
    setTimeout(() => {
      const section = document.getElementById('personnalisation-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const getTotalQtyForList = (listId) => {
    const list = menu.modifierLists.find(l => l.id === listId);
    if (!list) return 0;
    return list.modifiers.reduce((sum, m) => sum + (selectedQuantities[m.id] || 0), 0);
  };

  const updateModifierQty = (modList, modifierId, change) => {
    setSelectedQuantities(prev => {
      const currentQty = prev[modifierId] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      if (change > 0 && modList.max < 999) {
        // Enforce max limit for the list
        const currentListTotal = listModifiers(modList.id).reduce((sum, m) => sum + (prev[m.id] || 0), 0);
        if (currentListTotal >= modList.max) {
          // Cannot add more
          return prev;
        }
      }
      
      const newQuantities = { ...prev };
      if (newQty === 0) {
        delete newQuantities[modifierId];
      } else {
        newQuantities[modifierId] = newQty;
      }
      return newQuantities;
    });
  };

  const listModifiers = (listId) => {
    const list = menu.modifierLists.find(l => l.id === listId);
    return list ? list.modifiers : [];
  };

  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    const base = parseFloat(selectedVariation?.price || selectedProduct.price || 0);
    let supplements = 0;
    
    Object.entries(selectedQuantities).forEach(([modId, qty]) => {
      // Find the modifier's price
      let mod = null;
      for (const list of menu.modifierLists) {
        mod = list.modifiers.find(m => m.id === modId);
        if (mod) break;
      }
      if (!mod) {
        mod = JUS_MODIFIER_LIST.modifiers.find(m => m.id === modId);
      }
      if (mod) {
        supplements += qty * parseFloat(mod.price || 0);
      }
    });
    
    return base + supplements;
  };

  const buildCartItem = () => {
    if (!selectedProduct) return null;

    const selectedNames = [];
    Object.entries(selectedQuantities).forEach(([modId, qty]) => {
      if (qty > 0) {
        let mod = null;
        for (const list of menu.modifierLists) {
          mod = list.modifiers.find(m => m.id === modId);
          if (mod) break;
        }
        if (!mod) {
          mod = JUS_MODIFIER_LIST.modifiers.find(m => m.id === modId);
        }
        if (mod) {
          selectedNames.push(`${qty > 1 ? qty + 'x ' : ''}${mod.name}`);
        }
      }
    });

    const variationName = selectedVariation && selectedVariation.name !== 'Regular' 
      ? ` - ${selectedVariation.name}` 
      : '';

    const isCustom = CUSTOMIZABLE_DRINKS.includes(selectedProduct.name.toLowerCase().trim()) && creationMode === 'custom';
    const customLabel = isCustom ? ' [Sur mesure]' : '';

    let customRecipeLabel = '';
    if (CUSTOMIZABLE_DRINKS.includes(selectedProduct.name.toLowerCase().trim())) {
      customRecipeLabel = ` [Recette : ${customRecipeName.trim()}]`;
    }
    const extrasNames = selectedNames.length > 0 
      ? ` (Avec ${selectedNames.join(', ')})` 
      : (isCustom ? ' (Nature)' : '');

    return {
      // Générer un ID unique
      id: `${selectedProduct.id}-${selectedVariation?.id || 'base'}-${Object.entries(selectedQuantities).map(([k,v]) => `${k}:${v}`).sort().join('-')}-${Date.now()}`,
      base_product_id: selectedVariation?.id || selectedProduct.id,
      name: `${selectedProduct.name}${customLabel}${variationName}${customRecipeLabel}${extrasNames}`,
      price: calculateTotal(),
      image: selectedProduct.image_url || '/logo.png', // Fallback image
      ingredient_ids: Object.keys(selectedQuantities).filter(id => selectedQuantities[id] > 0)
    };
  };

  const handleAddToCart = () => {
    // Validation des minimums
    if (selectedProduct) {
      const isCustomizable = CUSTOMIZABLE_DRINKS.includes(selectedProduct.name.toLowerCase().trim());
      const listsToRender = (isCustomizable && creationMode === 'custom')
        ? [JUS_MODIFIER_LIST]
        : (selectedProduct.modifier_lists || []).map(listId => menu.modifierLists.find(l => l.id === listId)).filter(Boolean);

      for (const list of listsToRender) {
        if (list && list.min > 0) {
          const currentTotal = list.modifiers.reduce((sum, m) => sum + (selectedQuantities[m.id] || 0), 0);
          if (currentTotal < list.min) {
            alert(`Veuillez sélectionner au moins ${list.min} option(s) pour : ${list.name}`);
            return;
          }
        }
      }
    }

    const cartItem = buildCartItem();
    if (!cartItem) return;

    addToCart(cartItem);
    
    setSelectedProduct(null);
    setSelectedQuantities({});
    setCustomRecipeName('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveFavorite = () => {
    const cartItem = buildCartItem();
    if (!cartItem) return;
    
    // Check if it's already in favorites
    const isAlreadyFav = favorites.some(f => f.name === cartItem.name);
    if (isAlreadyFav) {
        alert('Cette recette est déjà dans vos favoris !');
        return;
    }

    const newFavorites = [...favorites, cartItem];
    setFavorites(newFavorites);
    localStorage.setItem('namasthe_favorites', JSON.stringify(newFavorites));
    alert('Ajouté à vos favoris ! ❤️');
  };

  const removeFromFavorites = (favId) => {
    const newFavs = favorites.filter(f => f.id !== favId);
    setFavorites(newFavs);
    localStorage.setItem('namasthe_favorites', JSON.stringify(newFavs));
  };

  if (loading) {
    return <div style={{ padding: '100px 20px', textAlign: 'center', fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--crimson)' }}>Chargement du Menu...</div>;
  }

  const allowedCategories = [
    'café et matcha',
    'gourmandises',
    'shake, smoothie bol et fruithé',
    'thé et boissons énergisantes',
    'breuvages spécialisés'
  ];

  const allowedCategoryIds = menu.categories
    ? menu.categories.filter(c => allowedCategories.includes(c.name.toLowerCase().trim())).map(c => c.id)
    : [];

  const filteredItems = menu.items
    ? menu.items.filter(item => allowedCategoryIds.includes(item.category_id))
    : [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 20px 60px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--crimson)', fontSize: '3rem', marginBottom: '15px' }}>Commandez d'avance</h1>
        <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Construisez votre breuvage sur mesure, payez en ligne et passez le récupérer sans attendre.</p>
        
        {/* Lien vers le suivi de commande */}
        <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <a 
            href="/commande/statut" 
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 24px', borderRadius: '30px', 
              background: 'white', color: '#2C1810', 
              textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem',
              border: '1px solid #ddd', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s'
            }}
          >
            📦 Retrouver ma commande
          </a>
        </div>
      </div>

      {/* HISTORIQUE & FAVORIS */}
      {(favorites.length > 0 || orderHistory.length > 0) && (
        <div style={{ marginBottom: '40px' }}>
          {favorites.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', color: '#2C1810', borderBottom: '2px solid var(--crimson)', paddingBottom: '10px', marginBottom: '20px' }}>❤️ Mes Favoris</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {favorites.map(fav => (
                  <div key={fav.id} style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      {fav.image && <img src={fav.image} alt={fav.name} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 5px 0', color: '#2C1810', fontSize: '1rem' }}>{fav.name}</h4>
                        <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--green-tropical)' }}>{fav.price.toFixed(2)} $</p>
                      </div>
                      <button onClick={() => removeFromFavorites(fav.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#999' }}>✕</button>
                    </div>
                    <button 
                      onClick={() => { addToCart({...fav, id: fav.id + '-' + Date.now()}); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      style={{ padding: '10px', background: 'var(--crimson)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Ajouter au panier 🛍️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {orderHistory.length > 0 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', color: '#2C1810', borderBottom: '2px solid var(--crimson)', paddingBottom: '10px', marginBottom: '20px' }}>🕒 Mes Dernières Commandes</h2>
              <div style={{ display: 'flex', overflowX: 'auto', gap: '20px', paddingBottom: '10px' }}>
                {orderHistory.map(order => (
                  <div key={order.id} style={{ minWidth: '300px', background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>{new Date(order.date).toLocaleDateString('fr-CA')}</span>
                      <span style={{ fontWeight: 'bold', color: '#2C1810' }}>{order.total.toFixed(2)} $</span>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.9rem', color: '#444', marginBottom: '4px' }}>
                          • {item.quantity}x {item.name}
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => { 
                        order.items.forEach(item => addToCart({...item, id: item.id + '-' + Date.now()}));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        alert('Commande rajoutée au panier !');
                      }}
                      style={{ width: '100%', padding: '10px', background: '#2C1810', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Recommander
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
        
        {/* ÉTAPE 1 : CHOIX DU PRODUIT */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', color: '#2C1810', borderBottom: '2px solid var(--crimson)', paddingBottom: '10px', marginBottom: '20px' }}>1. Choisissez votre base</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {(!filteredItems || filteredItems.length === 0) ? (
              <p>Aucun produit n'est disponible dans ces catégories.</p>
            ) : (
              menu.categories
                .filter(c => allowedCategories.includes(c.name.toLowerCase().trim()))
                .map(category => {
                  const categoryItems = filteredItems.filter(item => item.category_id === category.id);
                  if (categoryItems.length === 0) return null;
                  
                  return (
                    <div key={category.id}>
                      <h3 style={{ color: 'var(--green-tropical)', marginBottom: '15px', fontSize: '1.4rem' }}>{category.name}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {categoryItems.map(p => {
                          const isSoldOut = p.is_sold_out;
                          return (
                            <div 
                              key={p.id} 
                              onClick={() => { if (!isSoldOut) handleProductSelect(p); }}
                              style={{ 
                                padding: '20px', 
                                borderRadius: '12px', 
                                border: selectedProduct?.id === p.id ? '2px solid var(--crimson)' : '1px solid #ddd',
                                background: selectedProduct?.id === p.id ? '#FFF0F5' : (isSoldOut ? '#f9f9f9' : 'white'),
                                cursor: isSoldOut ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: selectedProduct?.id === p.id ? '0 4px 12px rgba(184,0,62,0.1)' : '0 2px 5px rgba(0,0,0,0.05)',
                                display: 'flex',
                                gap: '15px',
                                alignItems: 'center',
                                opacity: isSoldOut ? 0.6 : 1
                              }}
                            >
                              {p.image_url && (
                                <img src={p.image_url} alt={p.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                              )}
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <h4 style={{ margin: 0, color: '#2C1810', fontSize: '1.1rem' }}>{p.name} {isSoldOut && <span style={{ color: '#D32F2F', fontSize: '0.85rem', marginLeft: '5px' }}>(Épuisé)</span>}</h4>
                                  <span style={{ fontWeight: 'bold', color: isSoldOut ? '#999' : 'var(--green-tropical)' }}>
                                    {p.variations && p.variations.length > 1 ? `À partir de ` : ''}{parseFloat(p.variations?.[0]?.price || p.price || 0).toFixed(2)}$
                                  </span>
                                </div>
                                {p.description && <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#666' }}>{p.description}</p>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* ÉTAPE 2 : PERSONNALISATION (Affiché seulement si un produit est sélectionné) */}
        <div id="personnalisation-section" style={{ opacity: selectedProduct ? 1 : 0.4, pointerEvents: selectedProduct ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', color: '#2C1810', borderBottom: '2px solid var(--crimson)', paddingBottom: '10px', marginBottom: '20px' }}>2. Personnalisez-le</h2>
          
          {!selectedProduct && <p style={{ color: '#888' }}>Veuillez d'abord sélectionner une base.</p>}

          {selectedProduct && (!selectedProduct.modifier_lists || selectedProduct.modifier_lists.length === 0) && (!selectedProduct.variations || selectedProduct.variations.length <= 1) && (
            <p style={{ color: '#888', fontStyle: 'italic', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>Aucune personnalisation n'est requise pour ce produit.</p>
          )}

          {selectedProduct && selectedProduct.variations && selectedProduct.variations.length > 1 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#5A4A42', margin: '0 0 15px', fontSize: '1.3rem' }}>Format / Option de base</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
                {selectedProduct.variations.map(variation => {
                  const isSelected = selectedVariation?.id === variation.id;
                  const isSoldOut = variation.is_sold_out;
                  const price = parseFloat(variation.price || 0);
                  
                  return (
                    <div 
                      key={variation.id}
                      onClick={() => { if (!isSoldOut) setSelectedVariation(variation); }}
                      style={{
                        padding: '15px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid var(--crimson)' : '1px solid #ddd',
                        background: isSelected ? '#FFF0F5' : (isSoldOut ? '#f5f5f5' : 'white'),
                        textAlign: 'center',
                        cursor: isSoldOut ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 4px 12px rgba(184,0,62,0.1)' : 'none',
                        opacity: isSoldOut ? 0.6 : 1
                      }}
                    >
                      <div style={{ fontWeight: isSelected ? 'bold' : 'normal', color: '#2C1810', fontSize: '1.05rem', marginBottom: '5px' }}>{variation.name}</div>
                      <div style={{ fontSize: '0.9rem', color: isSoldOut ? '#D32F2F' : 'var(--green-tropical)', fontWeight: 'bold' }}>
                        {isSoldOut ? 'Épuisé' : `${price.toFixed(2)}$`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedProduct && CUSTOMIZABLE_DRINKS.includes(selectedProduct.name.toLowerCase().trim()) && (
            <div style={{ marginBottom: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '12px' }}>
              <h3 style={{ color: '#5A4A42', margin: '0 0 15px', fontSize: '1.2rem' }}>Type de création</h3>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => { setCreationMode('preset'); setSelectedQuantities({}); }}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: creationMode === 'preset' ? '2px solid var(--crimson)' : '1px solid #ddd', background: creationMode === 'preset' ? '#FFF0F5' : 'white', cursor: 'pointer', fontWeight: 'bold', color: '#2C1810', transition: 'all 0.2s' }}
                >
                  Choisir une recette du menu
                </button>
                <button 
                  onClick={() => { setCreationMode('custom'); setSelectedQuantities({}); }}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: creationMode === 'custom' ? '2px solid var(--crimson)' : '1px solid #ddd', background: creationMode === 'custom' ? '#FFF0F5' : 'white', cursor: 'pointer', fontWeight: 'bold', color: '#2C1810', transition: 'all 0.2s' }}
                >
                  Créer mon propre mélange
                </button>
              </div>
            </div>
          )}

          {/* INPUT RECETTE CUSTOM */}
          {selectedProduct && CUSTOMIZABLE_DRINKS.includes(selectedProduct.name.toLowerCase().trim()) && creationMode === 'preset' && (
            <div style={{ marginBottom: '30px', padding: '20px', background: '#FFF3E0', borderRadius: '12px', border: '1px solid #FFE0B2' }}>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#2C1810', marginBottom: '10px', fontSize: '1.1rem' }}>
                Tu as un nom d'une autre recette qui ne figure pas dans la liste ? Écris-la ici :
              </label>
              <input 
                type="text" 
                value={customRecipeName}
                onChange={(e) => setCustomRecipeName(e.target.value)}
                placeholder="Ex: Le Pikachu, Le Dragon..."
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', fontFamily: 'var(--font-sans)', outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--crimson)'}
                onBlur={(e) => e.target.style.borderColor = '#ccc'}
              />
            </div>
          )}

          {selectedProduct && (() => {
            const isCustomizable = CUSTOMIZABLE_DRINKS.includes(selectedProduct.name.toLowerCase().trim());
            const listsToRender = (isCustomizable && creationMode === 'custom')
              ? [JUS_MODIFIER_LIST]
              : (selectedProduct.modifier_lists || []).map(listId => menu.modifierLists.find(l => l.id === listId)).filter(Boolean);

            return listsToRender.map(list => {
              if (!list || !list.modifiers || list.modifiers.length === 0) return null;
            
            const currentTotal = list.modifiers.reduce((sum, m) => sum + (selectedQuantities[m.id] || 0), 0);
            const isFull = list.max < 999 && currentTotal >= list.max;

            return (
              <div key={list.id} style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ color: '#5A4A42', margin: 0, fontSize: '1.3rem' }}>{list.name}</h3>
                  {list.max < 999 && (
                    <span style={{ fontSize: '0.85rem', padding: '4px 8px', background: isFull ? '#FFF0F5' : '#E8F5E9', color: isFull ? 'var(--crimson)' : '#2E7D32', borderRadius: '12px', fontWeight: 'bold' }}>
                      {currentTotal} / {list.max} {currentTotal === 0 && list.min > 0 ? `(Min: ${list.min})` : ''}
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
                  {list.modifiers.map(mod => {
                    const qty = selectedQuantities[mod.id] || 0;
                    const price = parseFloat(mod.price || 0);
                    const isSoldOut = mod.is_sold_out;
                    const isSelected = qty > 0;
                    
                    return (
                      <div 
                        key={mod.id}
                        style={{
                          padding: '12px 10px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid var(--green-tropical)' : '1px solid #ddd',
                          background: isSelected ? '#E8F5E9' : (isSoldOut ? '#f5f5f5' : 'white'),
                          textAlign: 'center',
                          transition: 'all 0.15s',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '110px',
                          opacity: isSoldOut ? 0.6 : 1,
                          pointerEvents: isSoldOut ? 'none' : 'auto'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: isSelected ? 'bold' : 'normal', color: '#2C1810', fontSize: '0.95rem', marginBottom: '5px' }}>{mod.name}</div>
                          <div style={{ fontSize: '0.75rem', color: isSoldOut ? '#D32F2F' : (price > 0 ? 'var(--green-tropical)' : '#666'), minHeight: '30px' }}>
                            {isSoldOut ? 'Épuisé' : (price > 0 ? `+${price.toFixed(2)}$ ch.` : 'Inclus')}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateModifierQty(list, mod.id, -1); }}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#ccc', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
                            disabled={qty === 0 || isSoldOut}
                          >-</button>
                          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', width: '20px' }}>{qty}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateModifierQty(list, mod.id, 1); }}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: isFull ? '#ccc' : 'var(--green-tropical)', color: 'white', fontWeight: 'bold', cursor: isFull ? 'not-allowed' : 'pointer', fontSize: '16px' }}
                            disabled={isFull || isSoldOut}
                          >+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}

          {/* RÉSUMÉ ET AJOUT AU PANIER */}
          {selectedProduct && (
            <div style={{ marginTop: '40px', padding: '25px', background: '#2C1810', borderRadius: '16px', color: 'white', position: 'sticky', bottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px', color: '#E0E0E0', fontSize: '1rem', fontWeight: 'normal' }}>Votre création :</h4>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {selectedProduct.name}
                    {selectedVariation && selectedVariation.name !== 'Regular' ? ` - ${selectedVariation.name}` : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h4 style={{ margin: '0 0 5px', color: '#E0E0E0', fontSize: '1rem', fontWeight: 'normal' }}>Prix estimé :</h4>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.8rem', color: '#4ADE80' }}>{calculateTotal().toFixed(2)} $</p>
                </div>
              </div>
              <button 
                onClick={handleAddToCart}
                style={{ width: '100%', padding: '16px', marginBottom: '10px', background: 'var(--crimson)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 15px rgba(184,0,62,0.4)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--crimson-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--crimson)'}
              >
                Ajouter au panier 🛍️
              </button>
              <button 
                onClick={handleSaveFavorite}
                style={{ width: '100%', padding: '14px', background: 'white', color: '#2C1810', border: '2px solid #E0E0E0', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--crimson)'; e.currentTarget.style.color = 'var(--crimson)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.color = '#2C1810'; }}
              >
                Mettre en favori ❤️
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================
          SECTION COMMANDE PARTENAIRES (UBER / DOORDASH)
          ======================================== */}
      <div style={{ marginTop: '80px', borderTop: '2px solid rgba(44, 24, 16, 0.1)', paddingTop: '60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', color: '#2C1810', fontSize: '2.5rem', marginBottom: '15px' }}>Faites-vous livrer</h2>
          <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Vous préférez rester à la maison ? Utilisez nos partenaires de livraison.</p>
        </div>

        <div className="order-cards" id="order-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '40px' }}>
          {/* --- Carte Uber Eats --- */}
          <div className="order-card" id="order-ubereats" style={{ background: 'white', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: '#06C167', fontWeight: 'bold' }}>Uber Eats</h3>
            <p style={{ color: '#666', marginBottom: '24px', fontSize: '1.05rem' }}>Commandez vos produits préférés via l'application Uber Eats pour une livraison rapide.</p>
            <a href="https://www.ubereats.com/ca/store/cafe-namasthe/sYwF26zFVPKzNlM-z9A1Lw" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#06C167', color: 'white', padding: '14px 30px', borderRadius: '50px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem', transition: 'transform 0.2s', boxShadow: '0 4px 15px rgba(6, 193, 103, 0.3)' }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              Commander sur Uber Eats
            </a>
          </div>

          {/* --- Carte DoorDash --- */}
          <div className="order-card" id="order-doordash" style={{ background: 'white', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: '#FF3008', fontWeight: 'bold' }}>DoorDash</h3>
            <p style={{ color: '#666', marginBottom: '24px', fontSize: '1.05rem' }}>Faites-vous livrer directement à votre porte grâce à notre partenaire DoorDash.</p>
            <a href="https://www.doordash.com/store/cafe-namasthe-sherbrooke-29369903/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#FF3008', color: 'white', padding: '14px 30px', borderRadius: '50px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem', transition: 'transform 0.2s', boxShadow: '0 4px 15px rgba(255, 48, 8, 0.3)' }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              Commander sur DoorDash
            </a>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ 
            fontSize: '1.15rem', 
            color: '#5A4A42', 
            fontStyle: 'italic', 
            background: 'rgba(234, 228, 216, 0.4)', 
            padding: '15px 24px', 
            borderRadius: '12px', 
            display: 'inline-block',
            border: '1px solid rgba(234, 228, 216, 0.8)'
          }}>
            Si vous avez des questions ou si vous préférez commander par téléphone, il nous fera un plaisir de vous servir au <a href="tel:8195698380" style={{ color: 'var(--green-tropical)', fontWeight: 'bold', textDecoration: 'none' }}>819-569-8380</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
