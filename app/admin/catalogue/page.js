'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function CataloguePage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, []);

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
            quantity,
            ingredients (
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
            name: ri.ingredients.name,
            qty: ri.quantity,
            unit: ri.ingredients.unit,
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
                <tr key={recipe.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
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
                    <button onClick={() => handleDelete(recipe.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}>
                      Supprimer
                    </button>
                  </td>
                </tr>
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
