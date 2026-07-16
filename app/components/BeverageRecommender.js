'use client';

import { useState, useMemo } from 'react';
import recipesData from '../data/recipes.json';

const BASES = [
  { id: 'tous', label: 'Surprenez-moi !', icon: '🎲', keywords: [], excludes: ['Menu', 'Beigne'] },
  { id: 'the', label: 'Thé', icon: '🧋', keywords: ['Méga', 'Mega', 'Lotus', 'Mindblow', 'Simplicithé', 'Simplicithe', 'Réinventhé', 'Reinventhe', 'Immunithé', 'Immunithe', ' Thé', 'Thé '], excludes: ['Fruithé', 'Fruite', 'Beigne', 'Beignes'] },
  { id: 'fruite', label: 'Fruithé', icon: '🍓', keywords: ['Fruithé', 'Fruité', 'Smoothie', 'Bol', 'Blender'], excludes: ['Menu'] },
  { id: 'shake', label: 'Shake', icon: '🥛', keywords: ['Shake', 'Protéiné', 'Proteine'], excludes: ['Menu'] },
  { id: 'cafe', label: 'Café', icon: '☕', keywords: ['Café', 'Cafe', 'Moka', 'Expresso', 'Cappucino', 'Coffee'], excludes: ['Namas', 'Namas-tails', 'Menu', 'Frappé', 'Frappe'] },
  { id: 'matcha', label: 'Matcha', icon: '🍵', keywords: ['Matcha'], excludes: [] },
  { id: 'namastails', label: 'Namas-tails', icon: '🍹', keywords: ['Namas-tails', 'Namas', 'Cocktail', 'Virgin'], excludes: [] },
  { id: 'frappes', label: 'Frappés', icon: '🥤', keywords: ['Frappé', 'Frappe', 'Frappucino'], excludes: [] }
];

// Extraction de toutes les saveurs uniques triées alphabétiquement (sauf les bases explicites)
const ALL_FLAVORS = Array.from(new Set(
  recipesData.flatMap(r => r.flavors)
)).sort();

export default function BeverageRecommender() {
  const [step, setStep] = useState(1);
  const [selectedBase, setSelectedBase] = useState(null);
  const [includedFlavors, setIncludedFlavors] = useState([]);
  const [excludedFlavors, setExcludedFlavors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrage des recettes
  const filteredRecipes = useMemo(() => {
    return recipesData.filter(recipe => {
      // 1. Filtrer par base (si ce n'est pas "Surprenez-moi")
      if (selectedBase && selectedBase.id !== 'tous') {
        const hasBaseKeyword = 
          recipe.flavors.some(f => selectedBase.keywords.some(k => f.toLowerCase().includes(k.toLowerCase()))) ||
          selectedBase.keywords.some(k => recipe.name.toLowerCase().includes(k.toLowerCase())) ||
          (recipe.base && selectedBase.keywords.some(k => recipe.base.toLowerCase().includes(k.toLowerCase())));
          
        const hasExcludedKeyword = selectedBase.excludes && selectedBase.excludes.length > 0 && (
          recipe.flavors.some(f => selectedBase.excludes.some(k => f.toLowerCase().includes(k.toLowerCase()))) ||
          selectedBase.excludes.some(k => recipe.name.toLowerCase().includes(k.toLowerCase())) ||
          (recipe.base && selectedBase.excludes.some(k => recipe.base.toLowerCase().includes(k.toLowerCase())))
        );

        if (!hasBaseKeyword || hasExcludedKeyword) return false;

        // Validation stricte pour les Shakes
        if (selectedBase.id === 'shake') {
          const ingredients = (recipe.ingredients || '').toLowerCase();
          const name = recipe.name.toLowerCase();
          const hasProt = ingredients.includes('prot') || name.includes('prot');
          const hasSub = ingredients.includes('sub') || name.includes('sub');
          if (!hasProt || !hasSub) return false;
        }
      }

      // 2. Filtrer par saveurs incluses (doit contenir TOUTES les saveurs incluses)
      if (includedFlavors.length > 0) {
        const hasAllInclusions = includedFlavors.every(inc => 
          recipe.flavors.includes(inc)
        );
        if (!hasAllInclusions) return false;
      }

      // 3. Filtrer par saveurs exclues (ne doit contenir AUCUNE saveur exclue)
      if (excludedFlavors.length > 0) {
        const hasExclusions = excludedFlavors.some(exc => 
          recipe.flavors.includes(exc)
        );
        if (hasExclusions) return false;
      }

      return true;
    });
  }, [selectedBase, includedFlavors, excludedFlavors]);

  const handleBaseSelect = (base) => {
    setSelectedBase(base);
    setIncludedFlavors([]);
    setExcludedFlavors([]);
    setSearchTerm('');
    setStep(2);
  };

  const toggleIncluded = (flavor) => {
    if (excludedFlavors.includes(flavor)) {
      setExcludedFlavors(prev => prev.filter(f => f !== flavor));
    }
    setIncludedFlavors(prev => 
      prev.includes(flavor) ? prev.filter(f => f !== flavor) : [...prev, flavor]
    );
  };

  const toggleExcluded = (flavor) => {
    if (includedFlavors.includes(flavor)) {
      setIncludedFlavors(prev => prev.filter(f => f !== flavor));
    }
    setExcludedFlavors(prev => 
      prev.includes(flavor) ? prev.filter(f => f !== flavor) : [...prev, flavor]
    );
  };

  const resetFilters = () => {
    setSelectedBase(null);
    setIncludedFlavors([]);
    setExcludedFlavors([]);
    setStep(1);
    setSearchTerm('');
  };

  // Saveurs possibles pour la catégorie sélectionnée
  const possibleFlavors = useMemo(() => {
    if (!selectedBase || selectedBase.id === 'tous') return ALL_FLAVORS;
    
    // On prend toutes les recettes de cette catégorie (avant les filtres de saveurs)
    const baseRecipes = recipesData.filter(recipe => {
      const hasBaseKeyword = 
        recipe.flavors.some(f => selectedBase.keywords.some(k => f.toLowerCase().includes(k.toLowerCase()))) ||
        selectedBase.keywords.some(k => recipe.name.toLowerCase().includes(k.toLowerCase())) ||
        (recipe.base && selectedBase.keywords.some(k => recipe.base.toLowerCase().includes(k.toLowerCase())));
        
      const hasExcludedKeyword = selectedBase.excludes && selectedBase.excludes.length > 0 && (
        recipe.flavors.some(f => selectedBase.excludes.some(k => f.toLowerCase().includes(k.toLowerCase()))) ||
        selectedBase.excludes.some(k => recipe.name.toLowerCase().includes(k.toLowerCase())) ||
        (recipe.base && selectedBase.excludes.some(k => recipe.base.toLowerCase().includes(k.toLowerCase())))
      );

      if (!hasBaseKeyword || hasExcludedKeyword) return false;

      // Validation stricte pour les Shakes
      if (selectedBase.id === 'shake') {
        const ingredients = (recipe.ingredients || '').toLowerCase();
        const name = recipe.name.toLowerCase();
        const hasProt = ingredients.includes('prot') || name.includes('prot');
        const hasSub = ingredients.includes('sub') || name.includes('sub');
        if (!hasProt || !hasSub) return false;
      }

      return true;
    });

    return Array.from(new Set(baseRecipes.flatMap(r => r.flavors))).sort();
  }, [selectedBase]);

  const displayedFlavors = possibleFlavors.filter(f => 
    f.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 40); // Limiter pour ne pas polluer l'interface

  return (
    <div style={{ background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* En-tête de l'assistant */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#2C1810', fontSize: '2rem', marginBottom: '10px' }}>🔍 Trouvez votre breuvage idéal</h2>
        <p style={{ color: '#666' }}>Laissez-vous guider parmi nos {recipesData.length} recettes légendaires !</p>
      </div>

      {/* Barre de progression */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '40px' }}>
        <div style={{ height: '8px', width: '30%', borderRadius: '4px', background: step >= 1 ? 'var(--green-tropical)' : '#eee', transition: '0.3s' }}></div>
        <div style={{ height: '8px', width: '30%', borderRadius: '4px', background: step >= 2 ? 'var(--green-tropical)' : '#eee', transition: '0.3s' }}></div>
        <div style={{ height: '8px', width: '30%', borderRadius: '4px', background: step >= 3 ? 'var(--green-tropical)' : '#eee', transition: '0.3s' }}></div>
      </div>

      {/* ÉTAPE 1 : La Base */}
      {step === 1 && (
        <div className="fade-in">
          <h3 style={{ textAlign: 'center', marginBottom: '25px', color: '#2C1810' }}>1. Quel type de breuvage vous fait envie ?</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
            {BASES.map(base => (
              <button
                key={base.id}
                onClick={() => handleBaseSelect(base)}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: selectedBase?.id === base.id ? '2px solid var(--green-tropical)' : '1px solid #ddd',
                  background: selectedBase?.id === base.id ? '#E8F5E9' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: '2.5rem' }}>{base.icon}</span>
                <span style={{ fontWeight: 'bold', color: '#2C1810', fontSize: '1.1rem' }}>{base.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ÉTAPE 2 & 3 : Inclusions / Exclusions et Résultats */}
      {step >= 2 && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', padding: '15px 20px', borderRadius: '12px' }}>
            <div>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>Filtre actif :</span>
              <h4 style={{ margin: '5px 0 0 0', color: 'var(--green-tropical)', fontSize: '1.2rem' }}>{selectedBase.icon} {selectedBase.label}</h4>
            </div>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: '1px underline #666', cursor: 'pointer', color: '#666' }}>Modifier</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            
            {/* Colonne de gauche : Filtres */}
            <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#2C1810', fontSize: '1.2rem' }}>2. Affinez vos goûts</h3>
                <button 
                  onClick={() => { setIncludedFlavors([]); setExcludedFlavors([]); setSearchTerm(''); }} 
                  style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Réinitialiser
                </button>
              </div>
              
              <input 
                type="text" 
                placeholder="Rechercher une saveur (ex: Mangue)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '20px' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                {displayedFlavors.map(flavor => {
                  const isIncluded = includedFlavors.includes(flavor);
                  const isExcluded = excludedFlavors.includes(flavor);
                  
                  return (
                    <div key={flavor} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: isIncluded ? '#E8F5E9' : isExcluded ? '#FFEBEE' : '#f9f9f9', borderRadius: '8px', border: `1px solid ${isIncluded ? 'var(--green-tropical)' : isExcluded ? '#E53935' : '#eee'}`, transition: 'all 0.2s' }}>
                      <span style={{ fontWeight: isIncluded || isExcluded ? 'bold' : 'normal', color: '#333' }}>{flavor}</span>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button 
                          onClick={() => toggleIncluded(flavor)}
                          style={{ background: isIncluded ? 'var(--green-tropical)' : 'white', color: isIncluded ? 'white' : '#666', border: '1px solid #ddd', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="J'en veux"
                        >✓</button>
                        <button 
                          onClick={() => toggleExcluded(flavor)}
                          style={{ background: isExcluded ? '#E53935' : 'white', color: isExcluded ? 'white' : '#666', border: '1px solid #ddd', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Je déteste"
                        >✗</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Colonne de droite : Résultats */}
            <div style={{ background: '#fdfcfb', borderRadius: '16px', padding: '20px', border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#2C1810', fontSize: '1.2rem' }}>Résultats ({filteredRecipes.length})</h3>
                <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9rem' }}>Réinitialiser</button>
              </div>

              {filteredRecipes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🤔</div>
                  <p style={{ color: '#666' }}>Aucun breuvage ne correspond exactement à ces critères.</p>
                  <button onClick={resetFilters} style={{ marginTop: '10px', padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Effacer les filtres</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                  {filteredRecipes.slice(0, 50).map(recipe => (
                    <div key={recipe.id} style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '4px solid var(--green-tropical)' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#2C1810', fontSize: '1.1rem' }}>{recipe.name}</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {recipe.flavors.map(f => (
                          <span key={f} style={{ background: includedFlavors.includes(f) ? '#E8F5E9' : '#f5f5f5', color: includedFlavors.includes(f) ? 'var(--green-tropical)' : '#666', padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: includedFlavors.includes(f) ? 'bold' : 'normal', border: includedFlavors.includes(f) ? '1px solid var(--green-tropical)' : '1px solid transparent' }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {filteredRecipes.length > 50 && (
                    <p style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem', marginTop: '10px' }}>
                      + {filteredRecipes.length - 50} autres résultats. Affinez vos filtres !
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      <style jsx>{`
        .fade-in {
          animation: fadeIn 0.4s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
