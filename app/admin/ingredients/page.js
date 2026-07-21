'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '', supplier: '', cost_per_unit: '', unit: 'g',
    total_price: '', total_quantity: '', // Adding these to help reset
    calories_per_100: '', protein_per_100: '', carbs_per_100: '', fat_per_100: '', sugar_per_100: '', fiber_per_100: '', sodium_per_100: '', calcium_per_100: '', iron_per_100: '', vitamin_a_per_100: '', vitamin_c_per_100: ''
  });
  const [isScanning, setIsScanning] = useState(false);
  const [editIngredientId, setEditIngredientId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('ingredients').select('*').order('name');
      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error("Erreur (la table n'existe peut-être pas encore):", error);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        supplier: formData.supplier,
        cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
        unit: formData.unit === 'oz' ? 'ml' : formData.unit,
        type: 'other', // Fix constraint
        calories_per_100: parseFloat(formData.calories_per_100) || 0,
        protein_per_100: parseFloat(formData.protein_per_100) || 0,
        carbs_per_100: parseFloat(formData.carbs_per_100) || 0,
        fat_per_100: parseFloat(formData.fat_per_100) || 0,
        sugar_per_100: parseFloat(formData.sugar_per_100) || 0,
        fiber_per_100: parseFloat(formData.fiber_per_100) || 0,
        sodium_per_100: parseFloat(formData.sodium_per_100) || 0,
        calcium_per_100: parseFloat(formData.calcium_per_100) || 0,
        iron_per_100: parseFloat(formData.iron_per_100) || 0,
        vitamin_a_per_100: parseFloat(formData.vitamin_a_per_100) || 0,
        vitamin_c_per_100: parseFloat(formData.vitamin_c_per_100) || 0,
      };

      if (editIngredientId) {
        const { error } = await supabase.from('ingredients').update(payload).eq('id', editIngredientId);
        if (error) throw error;
        alert("Ingrédient mis à jour !");
      } else {
        const { error } = await supabase.from('ingredients').insert([payload]);
        if (error) throw error;
        alert("Ingrédient sauvegardé !");
      }
      
      setEditIngredientId(null);
      setFormData({ name: '', supplier: '', cost_per_unit: '', unit: 'g', total_price: '', total_quantity: '', calories_per_100: '', protein_per_100: '', carbs_per_100: '', fat_per_100: '', sugar_per_100: '', fiber_per_100: '', sodium_per_100: '', calcium_per_100: '', iron_per_100: '', vitamin_a_per_100: '', vitamin_c_per_100: '' });
      fetchIngredients();
    } catch (error) {
      alert("Erreur lors de la sauvegarde : " + error.message);
    }
  };

  const handleEditClick = (ing) => {
    setEditIngredientId(ing.id);
    setFormData({
      name: ing.name || '',
      supplier: ing.supplier || '',
      cost_per_unit: ing.cost_per_unit || '',
      unit: ing.unit || 'g',
      total_price: '', // Clear the calculator fields when editing an existing one directly
      total_quantity: '',
      calories_per_100: ing.calories_per_100 || 0,
      protein_per_100: ing.protein_per_100 || 0,
      carbs_per_100: ing.carbs_per_100 || 0,
      fat_per_100: ing.fat_per_100 || 0,
      sugar_per_100: ing.sugar_per_100 || 0,
      fiber_per_100: ing.fiber_per_100 || 0,
      sodium_per_100: ing.sodium_per_100 || 0,
      calcium_per_100: ing.calcium_per_100 || 0,
      iron_per_100: ing.iron_per_100 || 0,
      vitamin_a_per_100: ing.vitamin_a_per_100 || 0,
      vitamin_c_per_100: ing.vitamin_c_per_100 || 0
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditIngredientId(null);
    setFormData({ name: '', supplier: '', cost_per_unit: '', unit: 'g', total_price: '', total_quantity: '', calories_per_100: '', protein_per_100: '', carbs_per_100: '', fat_per_100: '', sugar_per_100: '', fiber_per_100: '', sodium_per_100: '', calcium_per_100: '', iron_per_100: '', vitamin_a_per_100: '', vitamin_c_per_100: '' });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    
    // Compresser l'image côté client (Canvas) pour éviter l'erreur 413 Payload Too Large
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (event) => {
      img.src = event.target.result;
    };
    
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Qualité 0.7 pour réduire le poids
      const base64Data = canvas.toDataURL('image/jpeg', 0.7);

      try {
        const response = await fetch('/api/admin/parse-nutrition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageBase64: base64Data,
            mimeType: 'image/jpeg' 
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur serveur (${response.status}): ${errorText.substring(0,100)}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          const isServing = formData.unit === 'portion' || formData.unit === 'piece';
          setFormData(prev => ({
            ...prev,
            calories_per_100: isServing ? data.data.calories_per_serving : data.data.calories_per_100,
            protein_per_100: isServing ? data.data.protein_per_serving : data.data.protein_per_100,
            carbs_per_100: isServing ? data.data.carbs_per_serving : data.data.carbs_per_100,
            fat_per_100: isServing ? data.data.fat_per_serving : data.data.fat_per_100,
            sugar_per_100: isServing ? data.data.sugar_per_serving : data.data.sugar_per_100,
            fiber_per_100: isServing ? data.data.fiber_per_serving : data.data.fiber_per_100,
            sodium_per_100: isServing ? data.data.sodium_per_serving : data.data.sodium_per_100,
            calcium_per_100: isServing ? data.data.calcium_per_serving : data.data.calcium_per_100,
            iron_per_100: isServing ? data.data.iron_per_serving : data.data.iron_per_100,
            vitamin_a_per_100: isServing ? data.data.vitamin_a_per_serving : data.data.vitamin_a_per_100,
            vitamin_c_per_100: isServing ? data.data.vitamin_c_per_serving : data.data.vitamin_c_per_100
          }));
          alert(`Succès ! L'IA a rempli les informations nutritionnelles (${isServing ? 'Par portion' : 'Pour 100g/ml'}).`);
        } else {
          alert("Erreur de l'IA : " + data.error);
        }
      } catch (err) {
        alert("Erreur lors de l'analyse : " + err.message);
        console.error(err);
      }
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-heading)', color: '#1E293B', fontSize: '2.2rem', marginBottom: '30px' }}>
        Base de données des ingrédients
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        
        {/* COLONNE GAUCHE: FORMULAIRE */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', alignSelf: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px' }}>
            <h2 style={{ fontSize: '1.3rem', color: '#334155', margin: 0 }}>
              {editIngredientId ? 'Modifier un ingrédient' : 'Ajouter un ingrédient'}
            </h2>
            {editIngredientId && (
              <button type="button" onClick={handleCancelEdit} style={{ background: '#EF4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                Annuler
              </button>
            )}
          </div>
          
          <div style={{ marginBottom: '20px', background: '#F0FDF4', padding: '15px', borderRadius: '8px', border: '1px dashed #22C55E', textAlign: 'center' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#166534', fontWeight: 'bold' }}>🤖 Remplissage magique par IA</p>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current.click()}
              disabled={isScanning}
              style={{ background: '#22C55E', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%', opacity: isScanning ? 0.7 : 1 }}
            >
              {isScanning ? 'Analyse en cours... ⏳' : '📸 Prendre en photo l\'étiquette'}
            </button>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: '#15803D' }}>Prenez en photo le tableau des valeurs nutritives. L'IA calculera tout pour 100g/ml.</p>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '5px' }}>Nom de l'ingrédient *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '5px' }}>Fournisseur (Optionnel)</label>
              <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
            </div>
            
            <h3 style={{ fontSize: '1rem', marginTop: '25px', marginBottom: '15px', color: '#334155', borderBottom: '1px solid #E2E8F0', paddingBottom: '5px' }}>Format d'achat (Calculateur)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '5px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '5px' }}>Prix payé ($) *</label>
                <input type="number" step="0.01" name="total_price" value={formData.total_price || ''} onChange={(e) => {
                  const price = parseFloat(e.target.value) || 0;
                  const rawQty = parseFloat(formData.total_quantity) || 1;
                  const isOz = formData.unit === 'oz';
                  const qty = isOz ? rawQty * 30 : rawQty;
                  setFormData({...formData, total_price: e.target.value, cost_per_unit: (price / qty).toFixed(4)});
                }} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} placeholder="Ex: 29.00" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '5px' }}>Quantité totale *</label>
                <input type="number" step="0.01" name="total_quantity" value={formData.total_quantity || ''} onChange={(e) => {
                  const rawQty = parseFloat(e.target.value) || 1;
                  const price = parseFloat(formData.total_price) || 0;
                  const isOz = formData.unit === 'oz';
                  const qty = isOz ? rawQty * 30 : rawQty;
                  setFormData({...formData, total_quantity: e.target.value, cost_per_unit: (price / qty).toFixed(4)});
                }} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} placeholder="Ex: 200" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '5px' }}>Unité *</label>
                <select name="unit" value={formData.unit} onChange={(e) => {
                  const newUnit = e.target.value;
                  const rawQty = parseFloat(formData.total_quantity) || 1;
                  const price = parseFloat(formData.total_price) || 0;
                  const qty = newUnit === 'oz' ? rawQty * 30 : rawQty;
                  setFormData({...formData, unit: newUnit, cost_per_unit: (price / qty).toFixed(4)});
                }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                  <option value="g">Grammes (g)</option>
                  <option value="ml">Millilitres (ml)</option>
                  <option value="oz">Onces liquides (oz)</option>
                  <option value="portion">Portions</option>
                  <option value="piece">Pièces / Unités</option>
                </select>
              </div>
            </div>
            
            <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem', color: '#334155', display: 'flex', justifyContent: 'space-between' }}>
              <span>Coût converti pour la recette :</span>
              <strong>{formData.cost_per_unit || '0.0000'} $ / {formData.unit === 'piece' ? 'pièce' : formData.unit === 'oz' ? 'ml' : formData.unit}</strong>
            </div>
            
            {formData.unit === 'oz' && (
              <p style={{ fontSize: '0.8rem', color: '#0369A1', marginTop: '-15px', marginBottom: '20px', fontStyle: 'italic' }}>
                * Le système convertit automatiquement vos Onces (oz) en Millilitres (ml) dans la base de données (1 oz = 30 ml) pour que vos recettes soient précises au gramme près !
              </p>
            )}

            <p style={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic', marginBottom: '20px' }}>
              Astuce Emballage : Vous pouvez ajouter vos verres ou pailles ! Mettez le prix de la boîte, la quantité, choisissez "Pièces" et laissez les calories à 0.
            </p>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#334155' }}>
              Valeurs nutritives {formData.unit === 'portion' ? '(Pour 1 portion)' : formData.unit === 'piece' ? '(Pour 1 pièce)' : '(Pour 100g/ml)'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '3px' }}>Calories</label>
                <input type="number" step="0.1" name="calories_per_100" value={formData.calories_per_100} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '3px' }}>Protéines (g)</label>
                <input type="number" step="0.1" name="protein_per_100" value={formData.protein_per_100} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '3px' }}>Glucides (g)</label>
                <input type="number" step="0.1" name="carbs_per_100" value={formData.carbs_per_100} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '3px' }}>Sucres (g)</label>
                <input type="number" step="0.1" name="sugar_per_100" value={formData.sugar_per_100} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '3px' }}>Lipides (g)</label>
                <input type="number" step="0.1" name="fat_per_100" value={formData.fat_per_100} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '3px' }}>Fibres (g)</label>
                <input type="number" step="0.1" name="fiber_per_100" value={formData.fiber_per_100} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '3px' }}>Sodium (mg)</label>
                <input type="number" step="0.1" name="sodium_per_100" value={formData.sodium_per_100} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '3px' }}>Calcium (mg)</label>
                <input type="number" step="0.1" name="calcium_per_100" value={formData.calcium_per_100} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '3px' }}>Fer (mg)</label>
                <input type="number" step="0.1" name="iron_per_100" value={formData.iron_per_100} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '3px' }}>Vitamine A (%)</label>
                <input type="number" step="0.1" name="vitamin_a_per_100" value={formData.vitamin_a_per_100} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '3px' }}>Vitamine C (mg)</label>
                <input type="number" step="0.1" name="vitamin_c_per_100" value={formData.vitamin_c_per_100} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
            </div>

            <button type="submit" style={{ width: '100%', padding: '12px', background: editIngredientId ? '#F59E0B' : '#38BDF8', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              {editIngredientId ? "Mettre à jour l'ingrédient" : "Sauvegarder l'ingrédient"}
            </button>
          </form>
        </div>

        {/* COLONNE DROITE: LISTE */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', color: '#334155', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px' }}>Vos Ingrédients</h2>
          
          {loading ? (
            <p>Chargement...</p>
          ) : ingredients.length === 0 ? (
            <p style={{ color: '#94A3B8', fontStyle: 'italic' }}>Aucun ingrédient trouvé. N'oubliez pas d'exécuter le script SQL dans Supabase pour créer la table !</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', textAlign: 'left' }}>
                    <th style={{ padding: '12px 10px', color: '#475569' }}>Nom</th>
                    <th style={{ padding: '12px 10px', color: '#475569' }}>Coût (unitaire)</th>
                    <th style={{ padding: '12px 10px', color: '#475569' }}>Calories/100</th>
                    <th style={{ padding: '12px 10px', color: '#475569' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map(ing => (
                    <tr key={ing.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '500', color: '#334155' }}>
                        {ing.name} <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>{ing.supplier}</span>
                      </td>
                      <td style={{ padding: '12px 10px', color: '#64748B' }}>{ing.cost_per_unit}$ / {ing.unit}</td>
                      <td style={{ padding: '12px 10px', color: '#64748B' }}>{ing.calories_per_100} kcal</td>
                      <td style={{ padding: '12px 10px' }}>
                        <button onClick={() => handleEditClick(ing)} style={{ background: '#E2E8F0', color: '#475569', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          Éditer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
