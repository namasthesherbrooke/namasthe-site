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

      
      {/* SECTION EN MAINTENANCE */}
      <div style={{ textAlign: 'center', background: '#FFF3F3', padding: '40px 20px', borderRadius: '16px', border: '2px solid var(--crimson)', marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--crimson)', fontSize: '2.5rem', marginBottom: '20px' }}>🚧 Système en ajustement temporaire</h2>
        <p style={{ color: '#2C1810', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
          Nous mettons actuellement à niveau notre système de commande en ligne pour mieux vous servir ! 
          La fonction de commande pour emporter est <strong>temporairement suspendue</strong>.
        </p>
        <p style={{ color: '#2C1810', fontSize: '1.1rem', marginTop: '20px', fontWeight: 'bold' }}>
          Vous pouvez tout de même passer nous voir en boutique ou commander en livraison via nos partenaires ci-dessous ! 👇
        </p>
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
            <a href="https://www.ubereats.com/store-browse-uuid/6f35c309-04f2-5b68-9e1d-4727b06d474d?diningMode=DELIVERY" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#06C167', color: 'white', padding: '14px 30px', borderRadius: '50px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem', transition: 'transform 0.2s', boxShadow: '0 4px 15px rgba(6, 193, 103, 0.3)' }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              Commander sur Uber Eats
            </a>
          </div>

          {/* --- Carte DoorDash --- */}
          <div className="order-card" id="order-doordash" style={{ background: 'white', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: '2rem', marginBottom: '20px', color: '#FF3008', fontWeight: 'bold' }}>DoorDash</h3>
            <p style={{ color: '#666', marginBottom: '24px', fontSize: '1.05rem' }}>Faites-vous livrer directement à votre porte grâce à notre partenaire DoorDash.</p>
            <a href="https://www.doordash.com/store/33383693?utm_source=mx_share_android" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#FF3008', color: 'white', padding: '14px 30px', borderRadius: '50px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem', transition: 'transform 0.2s', boxShadow: '0 4px 15px rgba(255, 48, 8, 0.3)' }}
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
