'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function RecipesPage() {
  const [ingredientsDb, setIngredientsDb] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Recipe form state
  const [recipeName, setRecipeName] = useState('');
  const [baseSize, setBaseSize] = useState('16'); // The size of the entered recipe
  const [availableSizes, setAvailableSizes] = useState(['16']); // Array of selected sizes
  const [sellingPrices, setSellingPrices] = useState({}); // { '16': 5.50, '24': 6.50 }
  const [wasteMargin, setWasteMarginState] = useState(0); // Marge de perte en %
  const [packagingCost, setPackagingCost] = useState(0); // Coût fixe de l'emballage

  // Configured packaging costs per size (saved in localStorage)
  const [packagingConfig, setPackagingConfig] = useState({
    '16': 0.35,
    '20': 0.40,
    '24': 0.45,
    '32': 0.55
  });
  const [showConfig, setShowConfig] = useState(false);
  
  // Dynamic list of ingredients added to this recipe
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  
  // Select state for adding new ingredient to recipe
  const [selectedIngId, setSelectedIngId] = useState('');
  const [addQuantity, setAddQuantity] = useState('');
  const [measurementUnit, setMeasurementUnit] = useState('base'); // base, 1/4_tsp, 1_tsp, etc.

  // Conversion table for Barista Measurements to base unit (ml/g)
  const measurementMultipliers = {
    'base': 1,
    '1/4_tsp': 1.25,
    '1/2_tsp': 2.5,
    '3/4_tsp': 3.75,
    '1_tsp': 5,
    '1_tbsp': 15,
    '1/2_oz': 15,
    '1_oz': 30,
    '100_ml': 100,
    '250_ml': 250
  };

  const measurementLabels = {
    'base': 'Unité de base (g/ml/portion/pièce)',
    '1/4_tsp': '1/4 c. à thé (1.25)',
    '1/2_tsp': '1/2 c. à thé (2.5)',
    '3/4_tsp': '3/4 c. à thé (3.75)',
    '1_tsp': '1 c. à thé (5)',
    '1_tbsp': '1 c. à soupe (15)',
    '1/2_oz': '1/2 oz (15)',
    '1_oz': '1 oz (30)',
    '100_ml': '100 ml/g',
    '250_ml': '1 tasse (250 ml)'
  };

  useEffect(() => {
    fetchIngredients();
    const savedConfig = localStorage.getItem('namasthe_packaging_config');
    if (savedConfig) {
      setPackagingConfig(JSON.parse(savedConfig));
    }
    const savedWaste = localStorage.getItem('namasthe_waste_margin');
    if (savedWaste) {
      setWasteMarginState(parseFloat(savedWaste));
    }
  }, []);

  const setWasteMargin = (val) => {
    setWasteMarginState(val);
    localStorage.setItem('namasthe_waste_margin', val);
  };

  const handleUpdateConfig = (size, value) => {
    const newConfig = { ...packagingConfig, [size]: parseFloat(value) || 0 };
    setPackagingConfig(newConfig);
    localStorage.setItem('namasthe_packaging_config', JSON.stringify(newConfig));
  };

  const handleAvailableSizeToggle = (size) => {
    if (availableSizes.includes(size)) {
      setAvailableSizes(availableSizes.filter(s => s !== size));
    } else {
      setAvailableSizes([...availableSizes, size].sort((a, b) => parseInt(a) - parseInt(b)));
    }
  };

  const handleSellingPriceChange = (size, value) => {
    setSellingPrices({ ...sellingPrices, [size]: value });
  };

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('ingredients').select('*').order('name');
      if (error) throw error;
      setIngredientsDb(data || []);
    } catch (error) {
      console.error("Erreur de chargement des ingrédients", error);
    }
    setLoading(false);
  };

  const handleAddIngredientToRecipe = () => {
    if (!selectedIngId || !addQuantity) return;
    
    // Allow same ingredient multiple times if different measurement, but to keep it simple, just add it with a unique index.
    const ing = ingredientsDb.find(i => i.id === selectedIngId);
    if (ing) {
      const multiplier = measurementMultipliers[measurementUnit];
      // Quantité réelle en g/ml/portions
      const realQuantity = parseFloat(addQuantity) * multiplier;
      
      setRecipeIngredients([...recipeIngredients, { 
        ...ing, 
        recipeQty: realQuantity, 
        displayQty: parseFloat(addQuantity),
        displayUnit: measurementUnit 
      }]);
      setSelectedIngId('');
      setAddQuantity('');
      setMeasurementUnit('base');
    }
  };

  const removeIngredient = (indexToRemove) => {
    setRecipeIngredients(recipeIngredients.filter((_, index) => index !== indexToRemove));
  };

  // --- CALCULATIONS ---
  const totals = recipeIngredients.reduce((acc, item) => {
    // Calcul coût de base
    acc.cost += item.cost_per_unit * item.recipeQty;
    
    // Calcul macros (basé sur /100 sauf si c'est pièce ou portion)
    let factor = (item.unit === 'piece' || item.unit === 'portion') ? item.recipeQty : (item.recipeQty / 100);

    acc.calories += (item.calories_per_100 || 0) * factor;
    acc.protein += (item.protein_per_100 || 0) * factor;
    acc.carbs += (item.carbs_per_100 || 0) * factor;
    acc.fat += (item.fat_per_100 || 0) * factor;
    acc.sugar += (item.sugar_per_100 || 0) * factor;

    return acc;
  }, { cost: 0, calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 });

  const getScaledCosting = (size) => {
    let scalingFactor = 1;
    if (baseSize !== 'autre' && size !== 'autre') {
      scalingFactor = parseInt(size) / parseInt(baseSize);
    }
    
    const scaledIngCost = totals.cost * scalingFactor;
    const finalCost = (scaledIngCost * (1 + (wasteMargin / 100))) + (packagingConfig[size] || 0);
    const sp = parseFloat(sellingPrices[size] || 0);
    const profit = sp - finalCost;
    const margin = sp > 0 ? (profit / sp) * 100 : 0;
    
    return {
      scaledIngCost,
      finalCost,
      profit,
      margin,
      calories: totals.calories * scalingFactor,
      protein: totals.protein * scalingFactor,
      carbs: totals.carbs * scalingFactor,
      fat: totals.fat * scalingFactor,
      sugar: totals.sugar * scalingFactor
    };
  };

  const handleSaveRecipe = async () => {
    if (!recipeName || recipeIngredients.length === 0) {
      alert("Veuillez entrer un nom et ajouter au moins un ingrédient.");
      return;
    }

    try {
      const sizesToSave = availableSizes.length > 0 ? availableSizes : ['autre'];
      
      for (const size of sizesToSave) {
        const recipeNameToSave = size === 'autre' ? recipeName : `${recipeName} ${size}oz`;
        const scalingFactor = (baseSize !== 'autre' && size !== 'autre') ? (parseInt(size) / parseInt(baseSize)) : 1;
        
        // 1. Insert recipe
        const { data: recipeData, error: recipeError } = await supabase.from('admin_recipes').insert([
          { name: recipeNameToSave, selling_price: parseFloat(sellingPrices[size]) || 0 }
        ]).select();
        
        if (recipeError) throw recipeError;
        
        const newRecipeId = recipeData[0].id;
        
        // 2. Insert ingredients (scaled)
        const recipeIngsToInsert = recipeIngredients.map(ri => ({
          recipe_id: newRecipeId,
          ingredient_id: ri.id,
          quantity: ri.recipeQty * scalingFactor
        }));
        
        const { error: ingError } = await supabase.from('admin_recipe_ingredients').insert(recipeIngsToInsert);
        if (ingError) throw ingError;
      }

      alert("Recette sauvegardée avec succès pour tous les formats sélectionnés !");
      setBaseSize('16');
      setAvailableSizes(['16']);
      setSellingPrices({});
      setRecipeName('');
      setWasteMargin(0);
      setRecipeIngredients([]);
    } catch (error) {
      alert("Erreur: " + error.message);
    }
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-heading)', color: '#1E293B', fontSize: '2.2rem', marginBottom: '30px' }}>
        Créateur de Recettes (Costing)
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* CONSTRUCTEUR */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', alignSelf: 'start' }}>
          
          {/* CONFIGURATION EMBALLAGES */}
          <div style={{ marginBottom: '20px', background: '#F8FAFC', padding: '15px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 'bold' }}>⚙️ Coûts d'emballage par défaut (Verre + Paille + Couvercle)</span>
              <button onClick={() => setShowConfig(!showConfig)} style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', fontSize: '0.85rem' }}>
                {showConfig ? 'Masquer' : 'Modifier'}
              </button>
            </div>
            {showConfig && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
                {['16', '20', '24', '32'].map(size => (
                  <div key={size}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748B' }}>{size} oz ($)</label>
                    <input type="number" step="0.01" value={packagingConfig[size]} onChange={(e) => handleUpdateConfig(size, e.target.value)} style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', color: '#334155', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px' }}>La Recette</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '5px' }}>Nom du breuvage/plat</label>
              <input type="text" value={recipeName} onChange={(e) => setRecipeName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} placeholder="Ex: Frappé Glacé" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '5px' }}>Format de base (recette saisie)</label>
              <select value={baseSize} onChange={(e) => setBaseSize(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F0FDF4' }}>
                <option value="16">16 oz</option>
                <option value="20">20 oz</option>
                <option value="24">24 oz</option>
                <option value="32">32 oz</option>
                <option value="autre">Autre / Aucun</option>
              </select>
            </div>
          </div>
          
          {baseSize !== 'autre' && (
            <div style={{ marginBottom: '20px', padding: '15px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', color: '#334155', fontWeight: 'bold', marginBottom: '10px' }}>Formats disponibles à la vente</label>
              <div style={{ display: 'flex', gap: '15px' }}>
                {['16', '20', '24', '32'].map(size => (
                  <label key={size} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={availableSizes.includes(size)} onChange={() => handleAvailableSizeToggle(size)} style={{ width: '18px', height: '18px' }} />
                    <span style={{ fontSize: '0.95rem', color: '#475569' }}>{size} oz</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '0.95rem', color: '#334155', fontWeight: 'bold', marginBottom: '10px' }}>Prix de vente finaux ($)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
              {(availableSizes.length > 0 ? availableSizes : ['autre']).map(size => (
                <div key={size}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', marginBottom: '3px' }}>{size === 'autre' ? 'Prix' : `${size} oz`}</label>
                  <input type="number" step="0.01" value={sellingPrices[size] || ''} onChange={(e) => handleSellingPriceChange(size, e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1' }} placeholder="Ex: 5.50" />
                </div>
              ))}
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#334155' }}>Ingrédients</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <select value={selectedIngId} onChange={(e) => setSelectedIngId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
              <option value="">-- Choisir un ingrédient --</option>
              {ingredientsDb.map(ing => (
                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
              ))}
            </select>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="number" step="0.1" value={addQuantity} onChange={(e) => setAddQuantity(e.target.value)} placeholder="Quantité" style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              
              <select value={measurementUnit} onChange={(e) => setMeasurementUnit(e.target.value)} style={{ flex: 2, padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                {Object.entries(measurementLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              
              <button onClick={handleAddIngredientToRecipe} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                +
              </button>
            </div>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recipeIngredients.map((ing, index) => (
              <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed #E2E8F0' }}>
                <span style={{ fontWeight: '500', color: '#334155' }}>
                  {ing.displayQty} {ing.displayUnit !== 'base' ? measurementLabels[ing.displayUnit].split('(')[0].trim() : ing.unit} x {ing.name}
                  {ing.displayUnit !== 'base' && <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: '5px' }}>({ing.recipeQty} {ing.unit})</span>}
                </span>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <span style={{ color: '#64748B', fontSize: '0.9rem' }}>{(ing.cost_per_unit * ing.recipeQty).toFixed(2)}$</span>
                  <button onClick={() => removeIngredient(index)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}>×</button>
                </div>
              </li>
            ))}
          </ul>
          
          {recipeIngredients.length > 0 && (
            <button onClick={handleSaveRecipe} style={{ width: '100%', padding: '12px', background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '30px' }}>
              Sauvegarder la recette complète
            </button>
          )}
        </div>

        {/* RÉSULTATS MULTIPLES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '1.1rem', color: '#334155', fontWeight: 'bold' }}>Marge de perte globale :</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input type="number" min="0" max="100" value={wasteMargin} onChange={(e) => setWasteMargin(parseFloat(e.target.value) || 0)} style={{ width: '70px', padding: '8px', borderRadius: '6px', border: '2px solid #E2E8F0', textAlign: 'right', fontWeight: 'bold' }} />
              <span style={{ fontWeight: 'bold', color: '#475569' }}>%</span>
            </div>
          </div>

          {(availableSizes.length > 0 ? availableSizes : ['autre']).map(size => {
            const stats = getScaledCosting(size);
            return (
              <div key={size} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', borderTop: '4px solid #10B981', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h2 style={{ fontSize: '1.3rem', color: '#334155', margin: 0 }}>Costing {size !== 'autre' ? `- ${size} oz` : ''}</h2>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#64748B' }}>
                  <span>Coût ingrédients ({size !== 'autre' && baseSize !== 'autre' ? `${(parseInt(size)/parseInt(baseSize)).toFixed(2)}x la recette de base` : 'Base'}) :</span>
                  <span>{stats.scaledIngCost.toFixed(2)} $</span>
                </div>
                
                {size !== 'autre' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#64748B' }}>
                    <span>Coût Emballage ({size} oz) :</span>
                    <span>{(packagingConfig[size] || 0).toFixed(2)} $</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                  <span style={{ color: '#475569', fontWeight: 'bold' }}>Coût Réel (Total) :</span>
                  <span style={{ fontWeight: 'bold', color: '#EF4444' }}>{stats.finalCost.toFixed(2)} $</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                  <span style={{ color: '#64748B' }}>Prix de vente final :</span>
                  <span style={{ fontWeight: 'bold', color: '#10B981' }}>{parseFloat(sellingPrices[size] || 0).toFixed(2)} $</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E2E8F0', fontSize: '1.2rem' }}>
                  <span style={{ color: '#334155', fontWeight: 'bold' }}>Profit brut :</span>
                  <span style={{ fontWeight: 'bold', color: stats.profit >= 0 ? '#10B981' : '#EF4444' }}>{stats.profit.toFixed(2)} $</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '1rem' }}>
                  <span style={{ color: '#64748B' }}>Marge :</span>
                  <span style={{ fontWeight: 'bold', color: stats.margin >= 70 ? '#10B981' : stats.margin >= 50 ? '#F59E0B' : '#EF4444' }}>{stats.margin.toFixed(1)} %</span>
                </div>

                {/* NUTRITION MINIMISE */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', marginTop: '15px', background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>Cal</span>
                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#0F172A' }}>{stats.calories.toFixed(0)}</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>Prot</span>
                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#0F172A' }}>{stats.protein.toFixed(1)}g</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>Gluc</span>
                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#0F172A' }}>{stats.carbs.toFixed(1)}g</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>Sucr</span>
                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#0F172A' }}>{stats.sugar.toFixed(1)}g</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>Lip</span>
                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#0F172A' }}>{stats.fat.toFixed(1)}g</span>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
