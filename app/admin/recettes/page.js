'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function RecipesPage() {
  const [ingredientsDb, setIngredientsDb] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Recipe form state
  const [recipeName, setRecipeName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [wasteMargin, setWasteMargin] = useState(0); // Marge de perte en %
  
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
  }, []);

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
    // Calcul coût
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

  // Ajout de la marge de perte
  const finalCost = totals.cost * (1 + (wasteMargin / 100));

  const profit = parseFloat(sellingPrice || 0) - finalCost;
  const margin = parseFloat(sellingPrice || 0) > 0 ? (profit / parseFloat(sellingPrice)) * 100 : 0;

  const handleSaveRecipe = async () => {
    if (!recipeName || recipeIngredients.length === 0) {
      alert("Veuillez entrer un nom et ajouter au moins un ingrédient.");
      return;
    }

    try {
      // 1. Insert recipe
      const { data: recipeData, error: recipeError } = await supabase.from('admin_recipes').insert([
        { name: recipeName, selling_price: parseFloat(sellingPrice) || 0 }
      ]).select();
      
      if (recipeError) throw recipeError;
      
      const newRecipeId = recipeData[0].id;
      
      // 2. Insert ingredients
      const recipeIngsToInsert = recipeIngredients.map(ri => ({
        recipe_id: newRecipeId,
        ingredient_id: ri.id,
        quantity: ri.recipeQty
      }));
      
      const { error: ingError } = await supabase.from('admin_recipe_ingredients').insert(recipeIngsToInsert);
      if (ingError) throw ingError;

      alert("Recette sauvegardée avec succès !");
      setRecipeName('');
      setSellingPrice('');
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
          <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', color: '#334155', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px' }}>La Recette</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '5px' }}>Nom du breuvage/plat</label>
            <input type="text" value={recipeName} onChange={(e) => setRecipeName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} placeholder="Ex: Frappé Glacé 16oz" />
          </div>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '5px' }}>Prix de vente final ($)</label>
            <input type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} placeholder="Ex: 5.50" />
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

        {/* RÉSULTATS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* CARTE COSTING */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', borderTop: '4px solid #10B981' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', color: '#334155' }}>Finances (Costing)</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1rem', color: '#64748B' }}>
              <span>Coût ingrédients de base :</span>
              <span>{totals.cost.toFixed(2)} $</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '1rem', color: '#64748B' }}>
              <span>Marge de perte (gaspillage) :</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="number" min="0" max="100" value={wasteMargin} onChange={(e) => setWasteMargin(parseFloat(e.target.value) || 0)} style={{ width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid #CBD5E1', textAlign: 'right' }} />
                <span>%</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.1rem', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
              <span style={{ color: '#475569', fontWeight: 'bold' }}>Coût Réel (avec pertes) :</span>
              <span style={{ fontWeight: 'bold', color: '#EF4444' }}>{finalCost.toFixed(2)} $</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.1rem' }}>
              <span style={{ color: '#64748B' }}>Prix de vente final :</span>
              <span style={{ fontWeight: 'bold', color: '#10B981' }}>{parseFloat(sellingPrice || 0).toFixed(2)} $</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E2E8F0', fontSize: '1.2rem' }}>
              <span style={{ color: '#334155', fontWeight: 'bold' }}>Profit brut :</span>
              <span style={{ fontWeight: 'bold', color: profit >= 0 ? '#10B981' : '#EF4444' }}>{profit.toFixed(2)} $</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '1rem' }}>
              <span style={{ color: '#64748B' }}>Marge :</span>
              <span style={{ fontWeight: 'bold', color: margin >= 70 ? '#10B981' : margin >= 50 ? '#F59E0B' : '#EF4444' }}>{margin.toFixed(1)} %</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '10px', fontStyle: 'italic' }}>* Marge idéale suggérée en restauration : 70-75%</p>
          </div>

          {/* CARTE NUTRITION */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', borderTop: '4px solid #38BDF8' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', color: '#334155' }}>Valeurs Nutritives (Total)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ background: '#F8FAFC', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: '#64748B' }}>Calories</span>
                <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 'bold', color: '#0F172A' }}>{totals.calories.toFixed(0)}</span>
              </div>
              <div style={{ background: '#F8FAFC', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: '#64748B' }}>Protéines</span>
                <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 'bold', color: '#0F172A' }}>{totals.protein.toFixed(1)}g</span>
              </div>
              <div style={{ background: '#F8FAFC', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: '#64748B' }}>Glucides</span>
                <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 'bold', color: '#0F172A' }}>{totals.carbs.toFixed(1)}g</span>
              </div>
              <div style={{ background: '#F8FAFC', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: '#64748B' }}>Sucres</span>
                <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 'bold', color: '#0F172A' }}>{totals.sugar.toFixed(1)}g</span>
              </div>
              <div style={{ background: '#F8FAFC', padding: '15px', borderRadius: '8px', textAlign: 'center', gridColumn: 'span 2' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: '#64748B' }}>Lipides (Gras)</span>
                <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 'bold', color: '#0F172A' }}>{totals.fat.toFixed(1)}g</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
