'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import OrderModal from '../components/OrderModal';
import { useCart } from '../context/CartContext';
import BeverageRecommender from '../components/BeverageRecommender';

// Les 10 bases permises pour le menu secret
const ALLOWED_BASES = [
  "Simplicithé", 
  "Méga thé", 
  "Lotus", 
  "Matcha latté", 
  "Latté glacé", 
  "Shake protéiné", 
  "Fruithé", 
  "Smoothie bol", 
  "Rafraichi-thé", 
  "Bubble tea"
];

// Sous-composant pour l'affichage des étoiles
function StarRating({ creation, onRate, onRemove, userRating }) {
  const [hover, setHover] = useState(0);
  
  const ratingSum = creation.rating_sum || 0;
  const ratingCount = creation.rating_count || 0;
  const avg = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      {userRating > 0 && (
        <button 
          onClick={() => onRemove(creation.id)}
          title="Annuler mon vote"
          style={{ position: 'absolute', left: '-30px', top: '5px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#B8003E', transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          ↩️
        </button>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map(star => {
          // Si l'utilisateur a voté, on met en surbrillance son vote. Sinon la moyenne de la communauté.
          const isHighlighted = hover ? hover >= star : (userRating ? userRating >= star : avg >= star);
          // Si on veut afficher la demi-étoile pour la moyenne (seulement si pas de survol et pas de vote perso)
          const color = isHighlighted ? '#FFD700' : (!hover && !userRating && avg >= star - 0.5) ? '#FFC107' : '#E0E0E0';
          
          return (
            <button
              key={star}
              onClick={() => onRate(creation.id, star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              title={userRating === star ? "Votre note actuelle" : `Donner ${star} étoiles`}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '1.6rem', padding: '0', margin: '0', lineHeight: '1',
                color: color,
                transition: 'color 0.2s, transform 0.2s',
                transform: hover === star ? 'scale(1.2)' : 'scale(1)'
              }}
            >
              ★
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '6px', fontWeight: 'bold' }}>
        {ratingCount > 0 ? `Moyenne: ${avg}/5 (${ratingCount} avis)` : 'Soyez le premier à noter !'}
      </div>
    </div>
  );
}

export default function CreationsPage() {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' ou 'labo'
  const [creations, setCreations] = useState([]);
  const [votedCreations, setVotedCreations] = useState({}); // Garde en mémoire l'objet { id: rating } des votes de la session
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const { addToCart } = useCart();
  
  // États pour la commande
  const [orderModalCreation, setOrderModalCreation] = useState(null);
  const [squareCustomItem, setSquareCustomItem] = useState(null);

  // État du menu Square
  const [menuData, setMenuData] = useState({ items: [], modifierLists: [] });
  const [loadingMenu, setLoadingMenu] = useState(false);

  // État du formulaire de création
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedQuantities, setSelectedQuantities] = useState({}); // { modifierId: qty }
  
  const [nomBreuvage, setNomBreuvage] = useState('');
  const [createur, setCreateur] = useState('');
  const [notesSpeciales, setNotesSpeciales] = useState('');
  
  const [submitStatus, setSubmitStatus] = useState({ loading: false, error: null, success: false });

  // Charger les créations et le menu Square
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/creations', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setCreations(data.creations);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchSquareCustomItem = async () => {
    try {
      const res = await fetch('/api/menu', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.menu) {
        const item = data.menu.items.find(i => i.name.toLowerCase().includes('créez le de toute pièce') || i.name.toLowerCase().includes('creez'));
        if (item) {
           const fullItem = { ...item };
           fullItem.modifierListsData = data.menu.modifierLists.filter(ml => item.modifier_lists?.includes(ml.id));
           setSquareCustomItem(fullItem);
        }
      }
    } catch(e) { console.error("Erreur chargement Créez le de toute pièce", e); }
  };

  const fetchSquareMenu = async () => {
    setLoadingMenu(true);
    
    // Le menu secret a été déconnecté de Square pour permettre la liberté de création totale
    // comme avant l'intégration. Voici le menu codé en dur pour le "laboratoire".
    const hardcodedMenu = {
      items: [
        { id: 'b1', name: 'Simplicithé', image_url: null, modifier_lists: ['ml_the', 'ml_jus', 'ml_extra'] },
        { id: 'b2', name: 'Méga thé', image_url: null, modifier_lists: ['ml_the', 'ml_energie', 'ml_jus', 'ml_extra'] },
        { id: 'b3', name: 'Lotus', image_url: null, modifier_lists: ['ml_lotus', 'ml_jus', 'ml_extra'] },
        { id: 'b4', name: 'Mindblow', image_url: null, modifier_lists: ['ml_mindblow', 'ml_jus', 'ml_extra'] },
        { id: 'b5', name: 'Fruithé', image_url: null, modifier_lists: ['ml_base_fruit', 'ml_jus', 'ml_fruits'] },
        { id: 'b6', name: 'Smoothie bol', image_url: null, modifier_lists: ['ml_base_bol', 'ml_jus', 'ml_fruits', 'ml_toppings', 'ml_coulis'] },
        { id: 'b7', name: 'Rafraichi-thé', image_url: null, modifier_lists: ['ml_fruit_lyo', 'ml_jus', 'ml_extra'] },
        { id: 'b8', name: 'Bubble tea', image_url: null, modifier_lists: ['ml_the', 'ml_jus', 'ml_boba', 'ml_extra'] },
        { id: 'b9', name: 'Latté glacé', image_url: null, modifier_lists: ['ml_lait', 'ml_saveurs', 'ml_coulis', 'ml_extra_latte'] },
        { id: 'b10', name: 'Matcha latté', image_url: null, modifier_lists: ['ml_lait', 'ml_saveurs', 'ml_coulis', 'ml_extra_latte'] },
        { id: 'b11', name: 'Limonade', image_url: null, modifier_lists: ['ml_jus', 'ml_extra'] },
      ],
      modifierLists: [
        {
          id: 'ml_the', name: 'Choix de Thé', max: 1,
          modifiers: [
            { id: 't1', name: 'Thé noir (décaféiné)' }, { id: 't2', name: 'Thé vert' }, { id: 't3', name: 'Sans thé' },
            { id: 't4', name: 'Thé vert citron' }, { id: 't5', name: 'Thé vert framboise' }, { id: 't6', name: 'Thé vert melon d\'eau' },
            { id: 't7', name: 'Thé vert pommegrenade' }, { id: 't8', name: 'Thé vert bleuet' }, { id: 't9', name: 'Thé vert ananas' },
            { id: 't10', name: 'Thé vert fraise' }, { id: 't11', name: 'Thé noir pêche' }, { id: 't12', name: 'Thé noir bleuet' },
            { id: 't13', name: 'Chai' }, { id: 't14', name: 'Earl grey' }
          ]
        },
        {
          id: 'ml_jus', name: 'Jus sans sucre / Personnalisation', max: 3,
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
        },
        {
          id: 'ml_saveurs', name: 'Saveurs / Sirops', max: 3,
          modifiers: [
            { id: 's1', name: 'Caramel' }, { id: 's2', name: 'Caramel salé moka' }, { id: 's3', name: 'Noisette' },
            { id: 's4', name: 'Chocolat blanc' }, { id: 's5', name: 'Guimauve' }, { id: 's6', name: 'Pistache' },
            { id: 's7', name: 'Chai' }, { id: 's8', name: 'Cassonade et cannelle' }, { id: 's9', name: 'Vanille' },
            { id: 's10', name: 'Lavande' }, { id: 's11', name: 'Fraise' }, { id: 's12', name: 'Framboise' }
          ]
        },
        {
          id: 'ml_coulis', name: 'Coulis', max: 3,
          modifiers: [
            { id: 'c1', name: 'Caramel' }, { id: 'c2', name: 'Caramel salé' }, { id: 'c3', name: 'Chocolat noir' },
            { id: 'c4', name: 'Chocolat blanc' }, { id: 'c5', name: 'Épice de citrouille' }, { id: 'c6', name: 'Coconut' },
            { id: 'c7', name: 'Pistache' }, { id: 'c8', name: 'Fraise' }, { id: 'c9', name: 'Cerise' }
          ]
        },
        {
          id: 'ml_extra', name: 'Extras', max: 5,
          modifiers: [
            { id: 'ex1', name: 'Fibres pomme' }, { id: 'ex2', name: 'Fibre tropicale' }, { id: 'ex3', name: 'Fibre baie' },
            { id: 'ex4', name: 'Fibre orange' }, { id: 'ex5', name: 'Collagène' }, { id: 'ex6', name: 'Aloès surette' },
            { id: 'ex7', name: 'Aloès tropicale' }, { id: 'ex8', name: 'Protéine baie' }, { id: 'ex9', name: 'Protéine tropicale' },
            { id: 'ex10', name: 'Splash lait de coco' }, { id: 'ex11', name: 'Eau pétillante' }, { id: 'ex12', name: 'Bubble tea' },
            { id: 'ex13', name: 'Hydratation' }, { id: 'ex14', name: 'Énergie baie' }, { id: 'ex15', name: 'Énergie orange' },
            { id: 'ex16', name: 'Énergie lime' }, { id: 'ex17', name: 'Lotus crémeux coco' }, { id: 'ex18', name: 'Lotus crémeux avoine' }
          ]
        },
        {
          id: 'ml_extra_latte', name: 'Extras', max: 5,
          modifiers: [
            { id: 'el1', name: 'Bulle tapioca' }, { id: 'el2', name: 'Cannelle' }, { id: 'el3', name: 'Cannelle sucré' },
            { id: 'el4', name: 'Cacao' }, { id: 'el5', name: 'Cacao sucré' }, { id: 'el6', name: 'Éclat d\'érable' },
            { id: 'el7', name: 'Caramel salé' }, { id: 'el8', name: 'Pépittes de chocolat' }
          ]
        },
        {
          id: 'ml_fruit_lyo', name: 'Fruit lyophilisé', max: 2,
          modifiers: [
            { id: 'fl1', name: 'Fraise' }, { id: 'fl2', name: 'Framboise' }, { id: 'fl3', name: 'Bleuet' },
            { id: 'fl4', name: 'Pomme verte' }, { id: 'fl5', name: 'Banane' }, { id: 'fl6', name: 'Pêche/Mangue' },
            { id: 'fl7', name: 'Fruit du dragon' }
          ]
        },
        {
          id: 'ml_energie', name: 'Énergisant', max: 1,
          modifiers: [
            { id: 'e1', name: 'Orange' }, { id: 'e2', name: 'Baie' }, { id: 'e3', name: 'Lime' }
          ]
        },
        {
          id: 'ml_lotus', name: 'Type de Lotus', max: 1,
          modifiers: [
            { id: 'lo1', name: 'Blanc (citronné hydratant)' }, { id: 'lo2', name: 'Rose (Cerise framboise)' }, 
            { id: 'lo3', name: 'Bleue (Bleuet acai)' }, { id: 'lo4', name: 'Limonade rose' }
          ]
        },
        {
          id: 'ml_mindblow', name: 'Base Mindblow', max: 1,
          modifiers: [
            { id: 'mb1', name: 'Pêche mangue' }, { id: 'mb2', name: 'Limonade rose' }, 
            { id: 'mb3', name: 'Framboise bleue' }, { id: 'mb4', name: 'Pina colada' }, { id: 'mb5', name: 'Fruit du dragon' },
            { id: 'mb6', name: 'Orange crème (Édition limitée)' }
          ]
        },
        {
          id: 'ml_fruits', name: 'Vrais fruits', max: 3,
          modifiers: [
            { id: 'fr1', name: 'Fraise' }, { id: 'fr2', name: 'Framboise' }, { id: 'fr3', name: 'Bleuet' },
            { id: 'fr4', name: 'Mangue' }, { id: 'fr5', name: 'Pêche' }, { id: 'fr6', name: 'Ananas' },
            { id: 'fr7', name: 'Banane' }, { id: 'fr8', name: 'Baies' }
          ]
        },
        {
          id: 'ml_boba', name: 'Perles (Boba)', max: 2,
          modifiers: [
            { id: 'bo1', name: 'Boba Fraise' }, { id: 'bo2', name: 'Boba Mangue' }, { id: 'bo3', name: 'Boba Pêche' },
            { id: 'bo4', name: 'Boba Litchi' }, { id: 'bo5', name: 'Boba Cerise' }
          ]
        },
        {
          id: 'ml_lait', name: 'Type de lait', max: 1,
          modifiers: [
            { id: 'la1', name: 'Lait régulier' }, { id: 'la2', name: 'Lait d\'avoine' }, { id: 'la3', name: 'Lait d\'amande' },
            { id: 'la4', name: 'Soja' }, { id: 'la5', name: 'Coco' }, { id: 'la6', name: 'Half and half' },
            { id: 'la7', name: 'Crème' }, { id: 'la8', name: 'Half and half coco et soja' }
          ]
        },
        {
          id: 'ml_base_fruit', name: 'Base liquide', max: 1,
          modifiers: [
            { id: 'bf1', name: 'Eau' }, { id: 'bf2', name: 'Lotus crémeux coconut' }, { id: 'bf3', name: 'Lotus crémeux avoine' }, { id: 'bf4', name: 'Lait régulier' }
          ]
        },
        {
          id: 'ml_base_bol', name: 'Base de Bol', max: 1,
          modifiers: [
            { id: 'bb1', name: 'Lotus crémeux coconut' }, { id: 'bb2', name: 'Lotus crémeux avoine' }, { id: 'bb3', name: 'Protéine baie' }, { id: 'bb4', name: 'Protéine tropicale' }, { id: 'bb5', name: 'Protéine vanille' }, { id: 'bb6', name: 'Protéine chocolat' }
          ]
        },
        {
          id: 'ml_toppings', name: 'Toppings', max: 3,
          modifiers: [
            { id: 'tp1', name: 'Éclat d\'érable' }, { id: 'tp2', name: 'Granola' }, { id: 'tp3', name: 'Chia' },
            { id: 'tp4', name: 'Pépittes de chocolat' }, { id: 'tp5', name: 'Fruits lyophilisés' }, { id: 'tp6', name: 'Cannelle' },
            { id: 'tp7', name: 'Cacao' }, { id: 'tp8', name: 'Amandes émincés' }, { id: 'tp9', name: 'Chocolat blanc' }
          ]
        }
      ]
    };

    setMenuData(hardcodedMenu);
    setLoadingMenu(false);
  };

  useEffect(() => {
    fetchInitialData();
    fetchSquareMenu();
    fetchSquareCustomItem();
    
    // Lire le cookie pour restaurer les votes locaux de la session
    const match = document.cookie.match(/(^| )namasthe_rated=([^;]+)/);
    if (match) {
      try {
        const parsed = JSON.parse(decodeURIComponent(match[2]));
        if (!Array.isArray(parsed)) {
          setVotedCreations(parsed);
        } else {
          const legacyObj = {};
          parsed.forEach(id => { legacyObj[id] = 5; });
          setVotedCreations(legacyObj);
        }
      } catch(e) {}
    }

    // Auth Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session?.user) {
        fetchProfileName(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
         setCreateur('');
      } else {
         fetchProfileName(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfileName = async (user) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('prenom')
        .eq('id', user.id)
        .single();
      if (data && data.prenom) {
        setCreateur(data.prenom);
      } else {
        setCreateur(user.email.split('@')[0]);
      }
    } catch (e) {
      setCreateur(user.email.split('@')[0]);
    }
  };

  // Logique de sélection Square
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSelectedQuantities({});
    setSelectedVariation(product.variations && product.variations.length > 0 ? product.variations[0] : null);
  };

  const updateModifierQty = (modList, modifierId, change) => {
    setSelectedQuantities(prev => {
      const currentQty = prev[modifierId] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      if (change > 0 && modList.max < 999) {
        const listTotal = modList.modifiers.reduce((sum, m) => sum + (prev[m.id] || 0), 0);
        if (listTotal >= modList.max) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ loading: true, error: null, success: false });

    if (!selectedProduct || !nomBreuvage || !createur) {
      setSubmitStatus({ loading: false, error: "Veuillez remplir toutes les informations requises et choisir une base.", success: false });
      return;
    }

    // Construire le texte pour la base
    const variationName = selectedVariation && selectedVariation.name !== 'Regular' 
      ? ` - ${selectedVariation.name}` 
      : '';
    const baseFormatee = `${selectedProduct.name}${variationName}`;

    // Construire le texte pour les saveurs
    const selectedNames = [];
    Object.entries(selectedQuantities).forEach(([modId, qty]) => {
      if (qty > 0) {
        for (const list of menuData.modifierLists) {
          const mod = list.modifiers.find(m => m.id === modId);
          if (mod) {
            selectedNames.push(`${qty > 1 ? qty + 'x ' : ''}${mod.name}`);
            break;
          }
        }
      }
    });
    
    let saveursFormatees = selectedNames.length > 0 ? selectedNames.join(', ') : "Nature";
    if (notesSpeciales.trim() !== '') {
      saveursFormatees += ` | Notes: ${notesSpeciales.trim()}`;
    }

    // Format JSON pour commander plus tard (Bouton "Commander cette recette")
    const recipeData = {
      productId: selectedProduct.id,
      variationId: selectedVariation?.id || null,
      modifiers: selectedQuantities
    };

    try {
      const res = await fetch('/api/creations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom_breuvage: nomBreuvage,
          createur: createur,
          base: baseFormatee,
          saveurs: saveursFormatees,
          // note: recipe_data sera ignoré par l'API si la colonne n'existe pas, ou on l'ajoutera plus tard
          recipe_data: JSON.stringify(recipeData)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue");

      setSubmitStatus({ loading: false, error: null, success: true });
      
      // Reset
      setSelectedProduct(null); setSelectedVariation(null); setSelectedQuantities({}); setNomBreuvage(''); setNotesSpeciales('');
      // Optionnel: on peut garder le créateur.
      
      fetchInitialData(); // Rafraîchir la liste
      setTimeout(() => setActiveTab('menu'), 2000);

    } catch (err) {
      setSubmitStatus({ loading: false, error: err.message, success: false });
    }
  };

  const handleRate = async (id, rating) => {
    const previousRating = votedCreations[id] || 0;
    if (previousRating === rating) return; 

    setVotedCreations(prev => ({ ...prev, [id]: rating }));
    setCreations(prev => prev.map(c => {
      if (c.id !== id) return c;
      const isNewVote = !previousRating;
      return { 
        ...c, 
        rating_sum: (c.rating_sum || 0) - previousRating + rating, 
        rating_count: (c.rating_count || 0) + (isNewVote ? 1 : 0) 
      };
    }));

    try {
      await fetch('/api/creations/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, rating })
      });
    } catch (err) {
      setVotedCreations(prev => {
        const newState = { ...prev };
        if (previousRating) newState[id] = previousRating;
        else delete newState[id];
        return newState;
      });
      fetchInitialData(); 
    }
  };

  const handleRemoveVote = async (id) => {
    const previousRating = votedCreations[id];
    if (!previousRating) return;

    setVotedCreations(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
    setCreations(prev => prev.map(c => {
      if (c.id !== id) return c;
      return { 
        ...c, 
        rating_sum: Math.max(0, (c.rating_sum || 0) - previousRating), 
        rating_count: Math.max(0, (c.rating_count || 0) - 1) 
      };
    }));

    try {
      await fetch('/api/creations/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'remove' })
      });
    } catch (err) {
      setVotedCreations(prev => ({ ...prev, [id]: previousRating }));
      fetchInitialData();
    }
  };

  const handleDeleteCreation = async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session ? session.access_token : null;

      const res = await fetch('/api/creations', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id })
      });
      
      const responseData = await res.json();
      
      if (res.ok) {
        setCreations(prev => prev.filter(c => c.id !== id));
        setConfirmDeleteId(null);
      } else {
        alert("Erreur: " + (responseData.error || "Erreur lors de la suppression."));
        setConfirmDeleteId(null);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
      setConfirmDeleteId(null);
    }
  };

  const isAdmin = session?.user?.email === 'namasthesherbrooke@gmail.com';

  if (authLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Vérification de vos accès VIP...</p>
      </div>
    );
  }

  // Écran verrouillé si non connecté
  if (!session) {
    return (
      <div style={{ background: '#1A1A1A', minHeight: '100vh', padding: '100px 24px', fontFamily: 'var(--font-body)', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: '#2A2A2A', padding: '50px 30px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid #333' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🤫</div>
          <span style={{ background: 'linear-gradient(90deg, #FFD700, #FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Accès Restreint
          </span>
          <h1 style={{ color: 'white', marginBottom: '16px', fontSize: '2.5rem', marginTop: '10px' }}>Le Menu Secret</h1>
          <p style={{ color: '#A0A0A0', fontSize: '1.1rem', marginBottom: '32px', lineHeight: '1.6' }}>
            Chut... Ce menu exclusif est réservé uniquement à nos membres VIP. 
            Connectez-vous à votre compte ou inscrivez-vous gratuitement pour débloquer ces recettes cachées !
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              href="/connexion" 
              className="btn"
              style={{ background: '#FFD700', color: '#1A1A1A', padding: '12px 30px', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold' }}
            >
              Me connecter
            </Link>
            <Link 
              href="/inscription" 
              className="btn btn-outline"
              style={{ padding: '12px 30px', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold', border: '2px solid #FFD700', color: '#FFD700' }}
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fdfcfb', minHeight: '100vh', padding: '60px 20px', fontFamily: 'var(--font-body)' }}>
      {orderModalCreation && (
        <OrderModal 
          creation={orderModalCreation} 
          squareItem={squareCustomItem} 
          onClose={() => setOrderModalCreation(null)} 
          onAddToCart={addToCart} 
        />
      )}
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', color: '#2C1810', fontSize: '3rem', marginBottom: '10px' }}>
            Menu Secret 🤫
          </h1>
          <p style={{ color: '#5A4A42', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Découvrez les créations virales de notre communauté ou inventez le prochain breuvage vedette du Namasthé !
          </p>
        </header>

        {/* Onglets */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('menu')}
            style={{
              padding: '12px 30px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderRadius: '30px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'menu' ? 'var(--green-tropical)' : '#eee',
              color: activeTab === 'menu' ? 'white' : '#5A4A42',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'menu' ? '0 4px 15px rgba(46, 125, 50, 0.3)' : 'none'
            }}
          >
            🌟 Hall of Fame
          </button>
          <button 
            onClick={() => setActiveTab('labo')}
            style={{
              padding: '12px 30px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderRadius: '30px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'labo' ? '#FF9800' : '#eee',
              color: activeTab === 'labo' ? 'white' : '#5A4A42',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'labo' ? '0 4px 15px rgba(255, 152, 0, 0.3)' : 'none'
            }}
          >
            🧪 Créer un breuvage
          </button>
          <button 
            onClick={() => setActiveTab('recommender')}
            style={{
              padding: '12px 30px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderRadius: '30px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'recommender' ? '#B8003E' : '#eee',
              color: activeTab === 'recommender' ? 'white' : '#5A4A42',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'recommender' ? '0 4px 15px rgba(184, 0, 62, 0.3)' : 'none'
            }}
          >
            🔍 Trouver mon breuvage
          </button>
        </div>

        {/* SECTION 1 : Le Menu Secret (Liste) */}
        {activeTab === 'menu' && (
          <div>
            {loading ? (
              <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666' }}>Chargement des recettes secrètes...</p>
            ) : creations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🌪️</div>
                <h3>Le menu est vide !</h3>
                <p>Soyez la première personne à inventer un breuvage légendaire.</p>
                <button onClick={() => setActiveTab('labo')} style={{ marginTop: '20px', padding: '10px 20px', background: '#FF9800', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Aller au laboratoire</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
                {creations.map((creation, index) => (
                  <div key={creation.id} style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', position: 'relative', borderTop: index === 0 ? '5px solid #FFD700' : index === 1 ? '5px solid #C0C0C0' : index === 2 ? '5px solid #CD7F32' : 'none' }}>
                    {isAdmin && confirmDeleteId === creation.id && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.95)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20, gap: '15px', padding: '20px' }}>
                        <p style={{ color: '#C62828', fontWeight: 'bold', fontSize: '1rem', textAlign: 'center', margin: 0 }}>Supprimer cette recette ?</p>
                        <p style={{ color: '#666', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>{creation.nom_breuvage}</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleDeleteCreation(creation.id)}
                            style={{ padding: '8px 20px', background: '#C62828', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                          >Oui, supprimer</button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            style={{ padding: '8px 20px', background: '#eee', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                          >Annuler</button>
                        </div>
                      </div>
                    )}
                    {isAdmin && (
                      <button 
                        onClick={() => setConfirmDeleteId(creation.id)}
                        style={{ position: 'absolute', bottom: '15px', right: '15px', background: 'white', border: '1px solid #eee', cursor: 'pointer', fontSize: '1.1rem', padding: '4px 8px', borderRadius: '8px', transition: 'all 0.2s', zIndex: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                        title="Supprimer la recette (Admin)"
                        onMouseEnter={e => { e.currentTarget.style.background = '#FDECEA'; e.currentTarget.style.borderColor = '#C62828'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#eee'; }}
                      >
                        🗑️
                      </button>
                    )}
                    {index < 3 && (
                      <div style={{ position: 'absolute', top: '-15px', right: '-15px', background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                        #{index + 1}
                      </div>
                    )}
                    <h3 style={{ fontSize: '1.6rem', color: '#2C1810', marginBottom: '5px', paddingRight: '20px' }}>{creation.nom_breuvage}</h3>
                    <p style={{ color: '#8B002E', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Par {creation.createur}
                    </p>
                    
                    <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
                      <p style={{ margin: '0 0 10px 0' }}><strong>Base :</strong> <span style={{ color: 'var(--green-tropical)', fontWeight: 'bold' }}>{creation.base}</span></p>
                      <p style={{ margin: 0 }}><strong>Personnalisation :</strong> {creation.saveurs ? creation.saveurs : 'Nature'}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <StarRating 
                          creation={creation} 
                          onRate={handleRate} 
                          onRemove={handleRemoveVote}
                          userRating={votedCreations[creation.id]} 
                        />
                        {squareCustomItem && (
                          <button
                            onClick={() => setOrderModalCreation(creation)}
                            style={{
                              marginTop: '15px',
                              padding: '10px 20px',
                              background: 'var(--green-tropical)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '30px',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              cursor: 'pointer',
                              boxShadow: '0 4px 10px rgba(46, 125, 50, 0.3)',
                              transition: 'transform 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            🥤 Commander
                          </button>
                        )}
                      </div>
                      

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2 : Le Laboratoire (Création) avec API SQUARE */}
        {activeTab === 'labo' && (
          <div style={{ background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ color: '#2C1810', marginBottom: '30px', textAlign: 'center', fontSize: '2rem' }}>Créez votre chef-d'œuvre</h2>
            
            {authLoading || loadingMenu ? (
              <p style={{ textAlign: 'center', color: '#666', fontSize: '1.2rem', padding: '40px' }}>Chargement des ingrédients...</p>
            ) : !session ? (
              <div style={{ textAlign: 'center', padding: '40px', background: '#fdfcfb', borderRadius: '12px', border: '1px dashed #ccc' }}>
                 <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔒</div>
                 <h3 style={{ color: '#2C1810', marginBottom: '10px' }}>Connexion requise</h3>
                 <p style={{ color: '#5A4A42', marginBottom: '20px', fontSize: '1.1rem' }}>Vous devez être connecté pour inventer et sauvegarder votre breuvage au Menu Secret !</p>
                 <Link href="/connexion" style={{ padding: '12px 24px', background: 'var(--green-tropical)', color: 'white', textDecoration: 'none', borderRadius: '30px', fontWeight: 'bold', display: 'inline-block', boxShadow: '0 4px 10px rgba(46, 125, 50, 0.3)', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                   Se connecter
                 </Link>
              </div>
            ) : submitStatus.success ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
                <h3 style={{ color: 'var(--green-tropical)', marginBottom: '10px' }}>Recette enregistrée !</h3>
                <p>Votre breuvage est maintenant dans le Menu Secret. Partagez-le avec vos amis pour obtenir des votes !</p>
                <button onClick={() => setSubmitStatus({ ...submitStatus, success: false })} style={{ marginTop: '20px', padding: '10px 20px', background: '#FF9800', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Créer un autre breuvage</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                
                {/* 1. Sélection de la Base (Filtrée) */}
                <div style={{ marginBottom: '40px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#2C1810', marginBottom: '15px', fontSize: '1.2rem', borderBottom: '2px solid #FF9800', paddingBottom: '10px' }}>1. Choisissez votre base de breuvage *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                    {menuData.items.map(p => {
                      const isSoldOut = p.is_sold_out;
                      const isSelected = selectedProduct?.id === p.id;
                      return (
                        <div 
                          key={p.id}
                          onClick={() => { if (!isSoldOut) handleProductSelect(p); }}
                          style={{
                            padding: '15px',
                            borderRadius: '12px',
                            border: isSelected ? '2px solid var(--crimson)' : '1px solid #ddd',
                            background: isSelected ? '#FFF0F5' : (isSoldOut ? '#f9f9f9' : 'white'),
                            cursor: isSoldOut ? 'not-allowed' : 'pointer',
                            textAlign: 'center',
                            opacity: isSoldOut ? 0.6 : 1,
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? '0 4px 12px rgba(184,0,62,0.1)' : '0 2px 5px rgba(0,0,0,0.05)'
                          }}
                        >
                          {p.image_url && (
                            <img src={p.image_url} alt={p.name} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', marginBottom: '10px' }} />
                          )}
                          <h4 style={{ margin: 0, color: '#2C1810', fontSize: '1rem' }}>{p.name} {isSoldOut && <span style={{ color: '#D32F2F', fontSize: '0.8rem', display: 'block' }}>(Épuisé)</span>}</h4>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Variations (Si applicables) */}
                {selectedProduct && selectedProduct.variations && selectedProduct.variations.length > 1 && (
                  <div style={{ marginBottom: '40px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#2C1810', marginBottom: '15px', fontSize: '1.2rem', borderBottom: '2px solid #FF9800', paddingBottom: '10px' }}>Format / Option *</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                      {selectedProduct.variations.map(variation => {
                        const isSelected = selectedVariation?.id === variation.id;
                        const isSoldOut = variation.is_sold_out;
                        return (
                          <div 
                            key={variation.id}
                            onClick={() => { if (!isSoldOut) setSelectedVariation(variation); }}
                            style={{
                              padding: '12px 20px',
                              borderRadius: '8px',
                              border: isSelected ? '2px solid var(--crimson)' : '1px solid #ddd',
                              background: isSelected ? '#FFF0F5' : (isSoldOut ? '#f5f5f5' : 'white'),
                              cursor: isSoldOut ? 'not-allowed' : 'pointer',
                              fontWeight: isSelected ? 'bold' : 'normal',
                              opacity: isSoldOut ? 0.6 : 1
                            }}
                          >
                            {variation.name} {isSoldOut && '(Épuisé)'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Modificateurs (Saveurs, Extras, etc.) */}
                {selectedProduct && (
                  <div style={{ marginBottom: '40px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#2C1810', marginBottom: '20px', fontSize: '1.2rem', borderBottom: '2px solid #FF9800', paddingBottom: '10px' }}>
                      2. Personnalisez votre création
                    </label>
                    
                    {(!selectedProduct.modifier_lists || selectedProduct.modifier_lists.length === 0) && (
                      <p style={{ color: '#666', fontStyle: 'italic' }}>Aucune personnalisation requise pour cette base.</p>
                    )}

                    {selectedProduct.modifier_lists?.map(listId => {
                      const list = menuData.modifierLists.find(l => l.id === listId);
                      if (!list || !list.modifiers || list.modifiers.length === 0) return null;
                      
                      const currentTotal = list.modifiers.reduce((sum, m) => sum + (selectedQuantities[m.id] || 0), 0);
                      const isFull = list.max < 999 && currentTotal >= list.max;

                      return (
                        <div key={list.id} style={{ marginBottom: '25px', background: '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ color: '#5A4A42', margin: 0, fontSize: '1.1rem' }}>{list.name}</h3>
                            {list.max < 999 && (
                              <span style={{ fontSize: '0.85rem', padding: '4px 8px', background: isFull ? '#FFF0F5' : '#E8F5E9', color: isFull ? 'var(--crimson)' : '#2E7D32', borderRadius: '12px', fontWeight: 'bold' }}>
                                {currentTotal} / {list.max} {currentTotal === 0 && list.min > 0 ? `(Min: ${list.min})` : ''}
                              </span>
                            )}
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                            {list.modifiers.map(mod => {
                              const qty = selectedQuantities[mod.id] || 0;
                              const isSoldOut = mod.is_sold_out;
                              const isSelected = qty > 0;
                              
                              return (
                                <div 
                                  key={mod.id}
                                  style={{
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: isSelected ? '2px solid var(--green-tropical)' : '1px solid #ddd',
                                    background: isSelected ? '#E8F5E9' : (isSoldOut ? '#f5f5f5' : 'white'),
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    opacity: isSoldOut ? 0.6 : 1,
                                    pointerEvents: isSoldOut ? 'none' : 'auto'
                                  }}
                                >
                                  <div style={{ fontSize: '0.9rem', color: '#2C1810', marginBottom: '10px', fontWeight: isSelected ? 'bold' : 'normal', textAlign: 'center' }}>
                                    {mod.name} {isSoldOut && '(Épuisé)'}
                                  </div>
                                  
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <button 
                                      type="button"
                                      onClick={(e) => { e.preventDefault(); updateModifierQty(list, mod.id, -1); }}
                                      style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#ccc', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
                                      disabled={qty === 0 || isSoldOut}
                                    >-</button>
                                    <span style={{ fontSize: '1rem', fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{qty}</span>
                                    <button 
                                      type="button"
                                      onClick={(e) => { e.preventDefault(); updateModifierQty(list, mod.id, 1); }}
                                      style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: isFull ? '#ccc' : 'var(--green-tropical)', color: 'white', fontWeight: 'bold', cursor: isFull ? 'not-allowed' : 'pointer', fontSize: '16px' }}
                                      disabled={isFull || isSoldOut}
                                    >+</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. Infos Finales */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px', opacity: selectedProduct ? 1 : 0.5, pointerEvents: selectedProduct ? 'auto' : 'none' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#2C1810', marginBottom: '10px' }}>Nom épique du Breuvage *</label>
                    <input 
                      required={!!selectedProduct}
                      type="text" 
                      placeholder="Ex: L'Élixir Tropical" 
                      value={nomBreuvage}
                      onChange={e => setNomBreuvage(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', color: '#2C1810', marginBottom: '10px' }}>Votre Nom/Pseudo *</label>
                    <input 
                      required={!!selectedProduct}
                      type="text" 
                      placeholder="Ex: Sarah T." 
                      value={createur}
                      onChange={e => setCreateur(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}
                    />
                  </div>
                </div>

                {/* Notes Spéciales */}
                <div style={{ marginBottom: '30px', opacity: selectedProduct ? 1 : 0.5, pointerEvents: selectedProduct ? 'auto' : 'none' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#2C1810', marginBottom: '10px' }}>Notes spéciales / Ajustements (Optionnel)</label>
                  <textarea 
                    placeholder="Ex: Moins sucré, extra glace, mélanger les sirops..." 
                    value={notesSpeciales}
                    onChange={e => setNotesSpeciales(e.target.value)}
                    style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>

                {submitStatus.error && (
                  <div style={{ background: '#FDECEA', color: '#D32F2F', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    ❌ {submitStatus.error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={submitStatus.loading || !selectedProduct}
                  style={{ width: '100%', padding: '16px', background: !selectedProduct ? '#ccc' : 'var(--green-tropical)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: submitStatus.loading || !selectedProduct ? 'not-allowed' : 'pointer', transition: 'background 0.3s' }}
                >
                  {submitStatus.loading ? 'Enregistrement...' : '✨ Publier ma recette'}
                </button>

              </form>
            )}
          </div>
        )}

        {/* SECTION 3 : Assistant Trouver mon Breuvage */}
        {activeTab === 'recommender' && (
          <BeverageRecommender />
        )}

      </div>
    </div>
  );
}
