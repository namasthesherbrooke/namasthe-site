'use client';

import React, { useState } from 'react';

export default function OrderModal({ creation, squareItem, onClose, onAddToCart }) {
  // Filtrer pour ne garder que la liste "Extras" (ou exclure Base et Jus)
  const extraLists = squareItem?.modifierListsData?.filter(ml => 
    !ml.name.toLowerCase().includes('base') && !ml.name.toLowerCase().includes('jus') && !ml.name.toLowerCase().includes('saveur')
  ) || [];

  const [selectedVariation, setSelectedVariation] = useState(squareItem?.variations?.[0] || null);
  const [selectedExtras, setSelectedExtras] = useState(() => {
    const init = {};
    const saveursStr = (creation?.saveurs || '').toLowerCase();
    extraLists.forEach(list => {
      list.modifiers.forEach(mod => {
        const modName = mod.name.toLowerCase();
        if (saveursStr.includes(modName)) {
          init[mod.id] = true;
        } else if (modName === 'lotus crémeux coconut' && saveursStr.includes('lotus crémeux coco')) {
          init[mod.id] = true;
        }
      });
    });
    return init;
  });
  const [commentaires, setCommentaires] = useState('');
  const [isAdded, setIsAdded] = useState(false);

  if (!creation || !squareItem) return null;

  // Calcul du prix de base selon le nom de la base de la création
  const getBasePrice = (baseName) => {
    if (!baseName) return 0;
    const b = baseName.toLowerCase();
    if (b.includes('smoothie bol')) return 9.75;
    if (b.includes('fruithé') || b.includes('fruithe')) return 6.25;
    if (b.includes('lotus')) return 4.00;
    if (b.includes('rafraichi')) return 2.75;
    if (b.includes('bubble')) return 2.75;
    if (b.includes('limonade')) return 2.50;
    if (b.includes('matcha')) return 2.00;
    if (b.includes('méga') || b.includes('mega')) return 2.00;
    if (b.includes('mindblow')) return 1.00;
    if (b.includes('latté') || b.includes('latte')) return 1.00;
    if (b.includes('simplicithé') || b.includes('simplicithe')) return 1.00;
    return 0; // Par défaut
  };

  const basePrice = getBasePrice(creation.base);

  const handleExtraToggle = (modId, isChecked) => {
    setSelectedExtras(prev => ({ ...prev, [modId]: isChecked }));
  };

  const calculateTotal = () => {
    let total = (selectedVariation?.price || 0) + basePrice;
    extraLists.forEach(list => {
      list.modifiers.forEach(mod => {
        if (selectedExtras[mod.id]) {
          total += (mod.price || 0);
        }
      });
    });
    return total;
  };

  const handleAdd = () => {
    const extrasText = [];
    extraLists.forEach(list => {
      list.modifiers.forEach(mod => {
        if (selectedExtras[mod.id]) extrasText.push(mod.name);
      });
    });

    let recipeText = `Recette: Base ${creation.base}`;
    if (creation.saveurs && creation.saveurs !== 'Nature') {
      recipeText += `, Saveurs: ${creation.saveurs}`;
    }
    if (extrasText.length > 0) {
      recipeText += ` | Extras: ${extrasText.join(', ')}`;
    }
    if (commentaires.trim() !== '') {
      recipeText += ` | Notes: ${commentaires.trim()}`;
    }

    const sizeName = selectedVariation ? ` (${selectedVariation.name})` : '';

    onAddToCart({
      id: `custom_${Date.now()}`,
      base_product_id: squareItem.id, // Permet de lier à l'inventaire Square
      name: `Création: ${creation.nom_breuvage}${sizeName} - ${recipeText}`,
      price: calculateTotal(),
      quantity: 1,
    });
    
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1000);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }} onClick={onClose}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}>&times;</button>
        
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#2C1810', marginBottom: '5px' }}>Commander</h2>
        <h3 style={{ color: 'var(--green-tropical)', marginBottom: '20px', fontSize: '1.2rem' }}>{creation.nom_breuvage}</h3>

        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', color: '#555' }}>
          <strong>Recette incluse automatiquement :</strong><br/>
          Base : {creation.base}<br/>
          Saveurs : {creation.saveurs || 'Nature'}
        </div>

        {/* Variations (Grandeurs) */}
        {squareItem.variations && squareItem.variations.length > 0 && (
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ color: '#2C1810', marginBottom: '10px' }}>1. Choisissez votre grandeur *</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {squareItem.variations.map(variation => (
                <button
                  key={variation.id}
                  onClick={() => setSelectedVariation(variation)}
                  style={{
                    padding: '10px 15px',
                    borderRadius: '8px',
                    border: selectedVariation?.id === variation.id ? '2px solid var(--crimson)' : '1px solid #ddd',
                    background: selectedVariation?.id === variation.id ? '#FFF0F5' : 'white',
                    cursor: 'pointer',
                    fontWeight: selectedVariation?.id === variation.id ? 'bold' : 'normal',
                    flex: '1 1 calc(33% - 10px)',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '1rem' }}>{variation.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>{variation.price.toFixed(2)}$</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Extras */}
        {extraLists.map(list => (
          <div key={list.id} style={{ marginBottom: '25px' }}>
            <h4 style={{ color: '#2C1810', marginBottom: '10px' }}>2. Extras optionnels</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {list.modifiers.map(mod => (
                <label key={mod.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '10px', background: selectedExtras[mod.id] ? '#E8F5E9' : 'white', border: selectedExtras[mod.id] ? '1px solid var(--green-tropical)' : '1px solid #ddd', borderRadius: '8px' }}>
                  <input
                    type="checkbox"
                    checked={!!selectedExtras[mod.id]}
                    onChange={(e) => handleExtraToggle(mod.id, e.target.checked)}
                    style={{ marginRight: '15px', width: '20px', height: '20px' }}
                  />
                  <span style={{ flex: 1, fontSize: '1rem', color: '#333' }}>{mod.name}</span>
                  <span style={{ fontWeight: 'bold', color: '#2C1810' }}>+{mod.price.toFixed(2)}$</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* Commentaires supplémentaires */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ color: '#2C1810', marginBottom: '10px' }}>Notes spéciales (optionnel)</h4>
          <textarea
            value={commentaires}
            onChange={(e) => setCommentaires(e.target.value)}
            placeholder="Ex: Moins sucré, ajout de..., extra glace..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontFamily: 'inherit',
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginTop: '30px', borderTop: '2px solid #eee', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Total</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2C1810' }}>{calculateTotal().toFixed(2)}$</div>
          </div>
          <button
            onClick={handleAdd}
            disabled={!selectedVariation || isAdded}
            style={{
              padding: '12px 24px',
              background: isAdded ? '#4CAF50' : (selectedVariation ? 'var(--green-tropical)' : '#ccc'),
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              cursor: (!selectedVariation || isAdded) ? 'not-allowed' : 'pointer',
              boxShadow: selectedVariation ? '0 4px 15px rgba(46, 125, 50, 0.3)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            {isAdded ? 'Ajouté ! ✓' : 'Ajouter au panier'}
          </button>
        </div>
      </div>
    </div>
  );
}
