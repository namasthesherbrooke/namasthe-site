'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function RecipesPage() {
  const [ingredientsDb, setIngredientsDb] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Recipe form state
  const [recipeName, setRecipeName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  
  // Dynamic list of ingredients added to this recipe: { ingId, quantity }
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  
  // Select state for adding new ingredient to recipe
  const [selectedIngId, setSelectedIngId] = useState('');
  const [addQuantity, setAddQuantity] = useState('');

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
    
    // Check if already in list
    if (recipeIngredients.some(ri => ri.id === selectedIngId)) {
      alert("Cet ingrédient est déjà dans la recette.");
      return;
    }
    
    const ing = ingredientsDb.find(i => i.id === selectedIngId);
    if (ing) {
      setRecipeIngredients([...recipeIngredients, { ...ing, recipeQty: parseFloat(addQuantity) }]);
      setSelectedIngId('');
      setAddQuantity('');
    }
  };

  const removeIngredient = (id) => {
    setRecipeIngredients(recipeIngredients.filter(ri => ri.id !== id));
  };

  // --- CALCULATIONS ---
  const totals = recipeIngredients.reduce((acc, item) => {
    // Calcul coût
    acc.cost += item.cost_per_unit * item.recipeQty;
    
    // Calcul macros (basé sur /100)
    // Si c'est en piece, on assume que la DB stocke les macros par pièce (1) ou pour 100g de cette pièce, 
    // mais dans l'UI on a dit "pour 100 unités" si c'est des pièces pour être consistant, ou pour 1 pièce.
    // L'idéal est de dire : macros donnés pour 100, donc :
    let factor = item.unit === 'piece' ? item.recipeQty : (item.recipeQty / 100);
    // Si l'utilisateur a entré les macros pour 1 pièce quand unit='piece', on ajuste :
    // On va assumer factor = recipeQty / 100 pour ml/g, et recipeQty / 1 si piece.
    factor = item.unit === 'piece' ? item.recipeQty : (item.recipeQty / 100);
    // Wait, let's keep it simple: the prompt in the UI said "pour 100 unités". 
    // So factor is always recipeQty / 100, except if it's piece maybe it's just per piece?
    // Let's standardise: always divide by 100 if stored as per_100.
    factor = item.recipeQty / 100;
    // Si la DB a des pièces individuelles, on a conseillé d'entrer les macros pour 100.
    // Mais soyons logique, si unit=piece, les macros sont souvent pour 1 pièce.
    if (item.unit === 'piece') factor = item.recipeQty;

    acc.calories += (item.calories_per_100 || 0) * factor;
    acc.protein += (item.protein_per_100 || 0) * factor;
    acc.carbs += (item.carbs_per_100 || 0) * factor;
    acc.fat += (item.fat_per_100 || 0) * factor;
    acc.sugar += (item.sugar_per_100 || 0) * factor;

    return acc;
  }, { cost: 0, calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 });

  const profit = parseFloat(sellingPrice) - totals.cost;
  const margin = parseFloat(sellingPrice) > 0 ? (profit / parseFloat(sellingPrice)) * 100 : 0;

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
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <div style={{ flex: 2 }}>
              <select value={selectedIngId} onChange={(e) => setSelectedIngId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                <option value="">-- Choisir un ingrédient --</option>
                {ingredientsDb.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <input type="number" step="1" value={addQuantity} onChange={(e) => setAddQuantity(e.target.value)} placeholder="Qté" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
            </div>
            <button onClick={handleAddIngredientToRecipe} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              +
            </button>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recipeIngredients.map((ing, index) => (
              <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed #E2E8F0' }}>
                <span style={{ fontWeight: '500', color: '#334155' }}>{ing.recipeQty} {ing.unit} x {ing.name}</span>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <span style={{ color: '#64748B', fontSize: '0.9rem' }}>{(ing.cost_per_unit * ing.recipeQty).toFixed(2)}$</span>
                  <button onClick={() => removeIngredient(ing.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.1rem' }}>
              <span style={{ color: '#64748B' }}>Coûtant total :</span>
              <span style={{ fontWeight: 'bold', color: '#EF4444' }}>{totals.cost.toFixed(2)} $</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.1rem' }}>
              <span style={{ color: '#64748B' }}>Prix de vente :</span>
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
