'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function CataloguePage() {
  const [recipes, setRecipes] = useState([]);
  const [ingredientsDb, setIngredientsDb] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null); // { id, name, selling_price, ingredients: [] }

  useEffect(() => {
    fetchRecipes();
    fetchIngredientsDb();
  }, []);

  const fetchIngredientsDb = async () => {
    try {
      const { data, error } = await supabase.from('ingredients').select('*').order('name');
      if (!error) setIngredientsDb(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_recipes')
        .select(`
          id,
          name,
          selling_price,
          created_at,
          admin_recipe_ingredients (
            ingredient_id,
            quantity,
            ingredients (
              id,
              name,
              cost_per_unit,
              unit
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate dynamic costs for each recipe
      const enrichedRecipes = (data || []).map(recipe => {
        let totalCost = 0;
        
        const ingredientsList = recipe.admin_recipe_ingredients.map(ri => {
          // If the ingredient got deleted from the DB, handle gracefully
          if (!ri.ingredients) return null;
          
          const ingCost = (ri.ingredients.cost_per_unit || 0) * ri.quantity;
          totalCost += ingCost;
          
          return {
            ingredient_id: ri.ingredient_id,
            name: ri.ingredients.name,
            qty: ri.quantity,
            unit: ri.ingredients.unit,
            cost_per_unit: ri.ingredients.cost_per_unit,
            cost: ingCost
          };
        }).filter(Boolean);

        // Assume a base 5% waste margin globally for the catalogue display if we want to be safe,
        // or just use raw cost. We'll stick to raw cost for the core catalogue, 
        // as waste margin was a recipe-builder-only feature (unless we save it in DB).
        // Let's just use raw ingredient cost.
        
        const sellingPrice = recipe.selling_price || 0;
        const profit = sellingPrice - totalCost;
        const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
        
        // Suggested price for 75% margin = Cost / (1 - 0.75) = Cost / 0.25 = Cost * 4
        const suggestedPrice = totalCost * 4;

        return {
          ...recipe,
          totalCost,
          profit,
          margin,
          suggestedPrice,
          ingredientsList
        };
      });

      setRecipes(enrichedRecipes);
    } catch (error) {
      console.error("Erreur chargement catalogue:", error);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cette recette ?")) return;
    try {
      const { error } = await supabase.from('admin_recipes').delete().eq('id', id);
      if (error) throw error;
      setRecipes(recipes.filter(r => r.id !== id));
    } catch (error) {
      alert("Erreur lors de la suppression: " + error.message);
    }
  };

  const handleEditClick = (recipe) => {
    setEditingRecipe({
      id: recipe.id,
      name: recipe.name,
      selling_price: recipe.selling_price || '',
      ingredients: [...recipe.ingredientsList] // copy to avoid mutating original state before save
    });
    setExpandedRecipeId(recipe.id);
  };

  const handleCancelEdit = () => {
    setEditingRecipe(null);
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngs = [...editingRecipe.ingredients];
    newIngs[index][field] = value;
    setEditingRecipe({ ...editingRecipe, ingredients: newIngs });
  };

  const handleAddIngredient = (ingredientId) => {
    if (!ingredientId) return;
    const dbIng = ingredientsDb.find(i => i.id === ingredientId);
    if (!dbIng) return;

    const newIngs = [...editingRecipe.ingredients, {
      ingredient_id: dbIng.id,
      name: dbIng.name,
      qty: 1, // default 1
      unit: dbIng.unit,
      cost_per_unit: dbIng.cost_per_unit,
      cost: dbIng.cost_per_unit // qty 1 * cost
    }];
    setEditingRecipe({ ...editingRecipe, ingredients: newIngs });
  };

  const handleRemoveIngredient = (index) => {
    const newIngs = editingRecipe.ingredients.filter((_, i) => i !== index);
    setEditingRecipe({ ...editingRecipe, ingredients: newIngs });
  };

  const handleUpdateRecipe = async () => {
    if (!editingRecipe.name || editingRecipe.ingredients.length === 0) {
      alert("La recette doit avoir un nom et au moins un ingrédient.");
      return;
    }

    try {
      // 1. Update recipe selling price
      const { error: updateError } = await supabase
        .from('admin_recipes')
        .update({ selling_price: parseFloat(editingRecipe.selling_price) || 0 })
        .eq('id', editingRecipe.id);
        
      if (updateError) throw updateError;

      // 2. Delete existing ingredients for this recipe
      const { error: deleteError } = await supabase
        .from('admin_recipe_ingredients')
        .delete()
        .eq('recipe_id', editingRecipe.id);
        
      if (deleteError) throw deleteError;

      // 3. Insert new ingredients list
      const recipeIngsToInsert = editingRecipe.ingredients.map(ri => ({
        recipe_id: editingRecipe.id,
        ingredient_id: ri.ingredient_id,
        quantity: parseFloat(ri.qty) || 0
      }));
      
      const { error: insertError } = await supabase
        .from('admin_recipe_ingredients')
        .insert(recipeIngsToInsert);
        
      if (insertError) throw insertError;

      alert("Recette mise à jour avec succès !");
      setEditingRecipe(null);
      fetchRecipes(); // refresh list to get new calculations
    } catch (error) {
      alert("Erreur lors de la mise à jour : " + error.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#1E293B', fontSize: '2.2rem', margin: 0 }}>
          Dossier Recettes (Catalogue)
        </h1>
        <Link href="/admin/recettes" style={{ background: '#10B981', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          + Nouvelle Recette
        </Link>
      </div>

      {loading ? (
        <p>Chargement du catalogue...</p>
      ) : recipes.length === 0 ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '1.2rem', color: '#64748B' }}>Aucune recette dans le dossier.</p>
          <Link href="/admin/recettes" style={{ display: 'inline-block', marginTop: '15px', color: '#10B981', fontWeight: 'bold' }}>Commencer à créer vos recettes</Link>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', color: '#475569', fontSize: '0.9rem', borderBottom: '2px solid #E2E8F0' }}>
                <th style={{ padding: '15px 20px' }}>Nom de la recette</th>
                <th style={{ padding: '15px 20px' }}>Coût Ingrédients</th>
                <th style={{ padding: '15px 20px' }}>Prix Suggéré (Marge 75%)</th>
                <th style={{ padding: '15px 20px' }}>Prix de vente actuel</th>
                <th style={{ padding: '15px 20px' }}>Profit actuel ($)</th>
                <th style={{ padding: '15px 20px' }}>Marge actuelle (%)</th>
                <th style={{ padding: '15px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map(recipe => (
                <React.Fragment key={recipe.id}>
                  <tr style={{ borderBottom: expandedRecipeId === recipe.id ? 'none' : '1px solid #E2E8F0', cursor: 'pointer', background: expandedRecipeId === recipe.id ? '#F8FAFC' : 'transparent' }} onClick={() => {
                    if (editingRecipe && editingRecipe.id === recipe.id) return; // Prevent collapse if editing
                    setExpandedRecipeId(expandedRecipeId === recipe.id ? null : recipe.id);
                    if (editingRecipe && editingRecipe.id !== recipe.id) setEditingRecipe(null);
                  }}>
                    <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#334155' }}>
                      {recipe.name}
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '5px', fontWeight: 'normal' }}>
                        {recipe.ingredientsList.length} ingrédient(s)
                      </div>
                    </td>
                    <td style={{ padding: '15px 20px', color: '#EF4444', fontWeight: '500' }}>
                      {recipe.totalCost.toFixed(2)} $
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <span style={{ background: '#FEF3C7', color: '#D97706', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {recipe.suggestedPrice.toFixed(2)} $
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px', fontWeight: '500' }}>
                      {recipe.selling_price > 0 ? `${recipe.selling_price.toFixed(2)} $` : 'Non défini'}
                    </td>
                    <td style={{ padding: '15px 20px', color: recipe.profit >= 0 ? '#10B981' : '#EF4444', fontWeight: 'bold' }}>
                      {recipe.profit.toFixed(2)} $
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold',
                        background: recipe.margin >= 70 ? '#D1FAE5' : recipe.margin >= 50 ? '#FEF3C7' : '#FEE2E2',
                        color: recipe.margin >= 70 ? '#065F46' : recipe.margin >= 50 ? '#92400E' : '#991B1B'
                      }}>
                        {recipe.margin.toFixed(1)} %
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleEditClick(recipe); }} style={{ background: 'none', border: 'none', color: '#F59E0B', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline', marginRight: '15px', fontWeight: 'bold' }}>
                        Éditer
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(recipe.id); }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}>
                        Supprimer
                      </button>
                    </td>
                  </tr>

                  {/* EXPANDED VIEW / EDIT MODE */}
                  {expandedRecipeId === recipe.id && (
                    <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                      <td colSpan="7" style={{ padding: '0 20px 20px 20px' }}>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #CBD5E1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                          
                          {editingRecipe && editingRecipe.id === recipe.id ? (
                            // EDIT MODE
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #E2E8F0' }}>
                                <h3 style={{ margin: 0, color: '#F59E0B', fontSize: '1.1rem' }}>Mode Édition: {recipe.name}</h3>
                                <div>
                                  <label style={{ fontSize: '0.9rem', color: '#475569', marginRight: '10px', fontWeight: 'bold' }}>Prix de vente ($):</label>
                                  <input type="number" step="0.01" value={editingRecipe.selling_price} onChange={(e) => setEditingRecipe({...editingRecipe, selling_price: e.target.value})} style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', width: '100px' }} />
                                </div>
                              </div>
                              
                              <table style={{ width: '100%', marginBottom: '15px' }}>
                                <tbody>
                                  {editingRecipe.ingredients.map((ing, idx) => (
                                    <tr key={idx}>
                                      <td style={{ padding: '8px 0', color: '#334155' }}>{ing.name} ({ing.unit})</td>
                                      <td style={{ padding: '8px 0', width: '120px' }}>
                                        <input type="number" step="0.1" value={ing.qty} onChange={(e) => handleIngredientChange(idx, 'qty', e.target.value)} style={{ width: '80px', padding: '5px', borderRadius: '4px', border: '1px solid #CBD5E1' }} />
                                      </td>
                                      <td style={{ padding: '8px 0', textAlign: 'right', color: '#64748B' }}>
                                        {((parseFloat(ing.qty) || 0) * ing.cost_per_unit).toFixed(2)} $
                                      </td>
                                      <td style={{ padding: '8px 0', textAlign: 'right', width: '40px' }}>
                                        <button onClick={() => handleRemoveIngredient(idx)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#F1F5F9', padding: '10px', borderRadius: '6px' }}>
                                <select id="add-ing-select" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1' }}>
                                  <option value="">-- Ajouter un ingrédient --</option>
                                  {ingredientsDb.map(ing => (
                                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                                  ))}
                                </select>
                                <button onClick={() => {
                                  const select = document.getElementById('add-ing-select');
                                  handleAddIngredient(select.value);
                                  select.value = '';
                                }} style={{ background: '#38BDF8', color: 'white', border: 'none', padding: '0 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Ajouter</button>
                              </div>

                              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                                <button onClick={handleCancelEdit} style={{ background: 'none', border: '1px solid #94A3B8', color: '#475569', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Annuler</button>
                                <button onClick={handleUpdateRecipe} style={{ background: '#F59E0B', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Enregistrer les modifications</button>
                              </div>
                            </div>
                          ) : (
                            // VIEW MODE
                            <div>
                              <h3 style={{ margin: '0 0 15px 0', color: '#475569', fontSize: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>Composition</h3>
                              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {recipe.ingredientsList.map((ing, idx) => (
                                  <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx < recipe.ingredientsList.length - 1 ? '1px dashed #E2E8F0' : 'none' }}>
                                    <span style={{ color: '#334155' }}><strong style={{ color: '#0F172A' }}>{ing.qty}</strong> {ing.unit === 'piece' || ing.unit === 'portion' ? 'x' : ing.unit} {ing.name}</span>
                                    <span style={{ color: '#64748B' }}>{ing.cost.toFixed(2)} $</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <p style={{ marginTop: '20px', fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic' }}>
        * Les coûts affichés sont calculés en <strong>temps réel</strong>. Si vous modifiez le prix d'achat d'un ingrédient dans l'onglet Ingrédients, 
        le coût et la rentabilité de toutes les recettes ci-dessus s'ajusteront automatiquement pour toujours refléter la réalité d'aujourd'hui.
      </p>
    </div>
  );
}
