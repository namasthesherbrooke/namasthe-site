'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '', supplier: '', cost_per_unit: '', unit: 'g',
    calories_per_100: '', protein_per_100: '', carbs_per_100: '', fat_per_100: '', sugar_per_100: ''
  });
  const [isScanning, setIsScanning] = useState(false);
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
      const { data, error } = await supabase.from('ingredients').insert([
        {
          name: formData.name,
          supplier: formData.supplier,
          cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
          unit: formData.unit,
          calories_per_100: parseFloat(formData.calories_per_100) || 0,
          protein_per_100: parseFloat(formData.protein_per_100) || 0,
          carbs_per_100: parseFloat(formData.carbs_per_100) || 0,
          fat_per_100: parseFloat(formData.fat_per_100) || 0,
          sugar_per_100: parseFloat(formData.sugar_per_100) || 0,
        }
      ]);
      if (error) throw error;
      
      alert("Ingrédient sauvegardé !");
      setFormData({ name: '', supplier: '', cost_per_unit: '', unit: 'g', calories_per_100: '', protein_per_100: '', carbs_per_100: '', fat_per_100: '', sugar_per_100: '' });
      fetchIngredients();
    } catch (error) {
      alert("Erreur lors de la sauvegarde : " + error.message);
    }
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
          setFormData(prev => ({
            ...prev,
            calories_per_100: data.data.calories_per_100 || '',
            protein_per_100: data.data.protein_per_100 || '',
            carbs_per_100: data.data.carbs_per_100 || '',
            fat_per_100: data.data.fat_per_100 || '',
            sugar_per_100: data.data.sugar_per_100 || ''
          }));
          alert("Succès ! L'IA a rempli les informations nutritionnelles.");
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
          <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', color: '#334155', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px' }}>Ajouter un ingrédient</h2>
          
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
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '5px' }}>Coût d'achat ($) *</label>
                <input type="number" step="0.01" name="cost_per_unit" value={formData.cost_per_unit} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} placeholder="Ex: 4.50" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '5px' }}>Pour 1...</label>
                <select name="unit" value={formData.unit} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                  <option value="g">Gramme (g)</option>
                  <option value="ml">Millilitre (ml)</option>
                  <option value="piece">Unité/Pièce</option>
                </select>
              </div>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic', marginBottom: '20px' }}>
              Astuce : Si vous achetez 1L de lait à 4$, entrez Coût = 0.004 et Unité = ml.
            </p>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#334155' }}>Valeurs nutritives (pour 100{formData.unit === 'piece' ? ' unités' : formData.unit})</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
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
            </div>

            <button type="submit" style={{ width: '100%', padding: '12px', background: '#38BDF8', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Sauvegarder l'ingrédient
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
