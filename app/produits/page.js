/**
 * Produits — Page du menu / catalogue de produits
 * 
 * Structure (fidèle à la maquette img_587f87.png et img_dd1c41.png) :
 * 1. Hero split — "L'Équilibre Parfait dans Chaque Gorgée" + image bowl
 * 2. Section "Nos breuvages" — Carousel horizontal avec tags (Signature, Énergie, Zen)
 * 3. Section "À grignoter" — Carousel horizontal avec tags (Sucré, Salé)
 * 
 * Note : Les données sont en dur pour le moment.
 * À terme, elles seront chargées depuis la table `products` de Supabase.
 */

import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import ProductsCarousel from '../components/ProductsCarousel';

// Fonction pour nettoyer les ingrédients (retire les quantités et les unités)
function formatIngredients(rawText) {
  if (!rawText) return "Mélange secret";
  
  // Séparer par retour à la ligne ou virgule
  const lines = rawText.split(/\n|,/);
  
  const cleanedLines = lines.map(line => {
    let clean = line.trim();
    
    // Cas spéciaux de double mesure (ex: 2x 1/4 jus pêche)
    clean = clean.replace(/^[-\*\s]*\d+x\s*\d+\/\d+\s*(jus)?\s*(de\s+|d')?/i, '').trim();
    
    // Fractions (ex: 1/2 tasse, 1/4 de, 3/4)
    clean = clean.replace(/^[-\*\s]*\d+\/\d+\s*(x|oz|ml|l|tasse|tasses|scoop|scoops|pompe|pompes|jet|jets|cuillère|cuillere|c\.\s*a\s*s|c\.\s*à\s*soupe|c\.\s*a\s*t|c\.\s*à\s*thé|pincée)?\s*(de\s+|d')?/i, '').trim();
    
    // Nombres entiers et décimaux (ex: 300 ml, 1 scoop, 2.5 tasses)
    clean = clean.replace(/^[-\*\s]*\d+([.,]\d+)?\s*(x|oz|ml|l|tasse|tasses|scoop|scoops|pompe|pompes|jet|jets|cuillère|cuillere|c\.\s*a\s*s|c\.\s*à\s*soupe|c\.\s*a\s*t|c\.\s*à\s*thé|pincée)?\s*(de\s+|d')?/i, '').trim();
    
    // Supprimer tout ce qui est en gras html ou autre balise <b>300 ml d'eau</b>
    clean = clean.replace(/<\/?b>/gi, '').trim();

    return clean;
  }).filter(line => line.length > 2 && !line.toLowerCase().includes("donne ") && !line.toLowerCase().includes("oz"));

  if (cleanedLines.length === 0) return "Ingrédients secrets";

  // Mettre la première lettre en majuscule et joindre avec des virgules
  return cleanedLines.map(l => l.charAt(0).toUpperCase() + l.slice(1)).join(', ');
}

/**
 * Met un nom de produit au singulier (retire le "s" final si pluriel)
 * Gère les cas composés comme "Smoothies bubble" → "Smoothie bubble"
 */
function singularize(name) {
  if (!name) return name;
  // Mots qui se terminent naturellement par 's' — ne pas toucher
  const exceptions = ['lotus', 'ananas', 'jus', 'corps', 'bras', 'repas', 'poids', 'bois', 'souris', 'avis', 'radis', 'paradis', 'frais', 'épais'];
  
  // Remplacements manuels spécifiques demandés
  let processedName = name;
  if (processedName.toLowerCase().includes('holisitique')) {
    processedName = processedName.replace(/holisitique/gi, 'holistique');
  }
  if (processedName.toLowerCase().includes('lotus plant power')) {
    processedName = 'Breuvage holistique Lotus';
  }
  if (processedName.toLowerCase().includes('smoothie bolw')) {
    processedName = 'Smoothie bol';
  }
  
  // Traiter chaque mot du nom composé
  const words = processedName.split(/\s+/);
  const result = words.map((word) => {
    const lower = word.toLowerCase();
    // Ne pas toucher aux exceptions
    if (exceptions.includes(lower)) return word;
    // Ne pas toucher aux mots de 2 lettres ou moins
    if (word.length <= 2) return word;
    // Retirer le 's' final sur tous les mots (pour gérer les pluriels des noms ET des adjectifs)
    if (lower.endsWith('s') && !lower.endsWith('ss')) {
      return word.slice(0, -1);
    }
    return word;
  });
  
  return result.join(' ');
}

export const revalidate = 60; // Cache de 60 secondes pour éviter de trop solliciter Supabase

export default async function ProduitsPage() {
  // Récupération des recettes depuis Supabase (tables Breuvage et Nourriture)
  const { data: breuvagesRes, error: err1 } = await supabase.from('Breuvage').select('*');
  const { data: nourrituresRes, error: err2 } = await supabase.from('Nourriture').select('*');
  
  let boissonsData = [];
  let grignotagesData = [];

  if (breuvagesRes && breuvagesRes.length > 0) {
    const seenBreuvages = new Set();
    breuvagesRes.forEach(item => {
      const name = item['Nom du produit'] || item.Nom || item.nom || 'Sans nom';
      if (seenBreuvages.has(name)) return;
      // Exclure les Matchas chauds
      if (name.toLowerCase().trim() === 'matchas chauds') return;
      seenBreuvages.add(name);

      const rawCategories = item.catégories || item.Catégories || item.categories || '';
      const tag = rawCategories ? rawCategories.split(';')[0].trim() : null;
      
      boissonsData.push({
        name: singularize(name),
        desc: item['Description du produit'] || item.description || 'Aucune description disponible.',
        tag: tag === 'NULL' || !tag ? null : tag,
        emoji: '🍹'
      });
    });
  } else {
    // Fallback en attendant la DB ou si erreur
    boissonsData = [
      { name: 'Menu en préparation', desc: "Nos recettes sont en cours de chargement depuis la base de données.", tag: 'Bientôt', emoji: '⏳' }
    ];
  }

  if (nourrituresRes && nourrituresRes.length > 0) {
    const seenNourritures = new Set();
    nourrituresRes.forEach(item => {
      const name = item['Nom du produit'] || item.Nom || item.nom || 'Sans nom';
      if (seenNourritures.has(name)) return;
      seenNourritures.add(name);

      const rawCategories = item.catégories || item.Catégories || item.categories || '';
      const tag = rawCategories ? rawCategories.split(';')[0].trim() : null;
      
      grignotagesData.push({
        name: singularize(name),
        desc: item['Description du produit'] || item.description || 'Aucune description disponible.',
        tag: tag === 'NULL' || !tag ? null : tag,
        emoji: '🍪'
      });
    });
  } else {
    grignotagesData = [
      { name: 'En cuisine...', desc: "Nos savoureux grignotages arrivent très bientôt.", tag: 'Bientôt', emoji: '⏳' }
    ];
  }
  return (
    <>
      {/* ========================================
          HERO SPLIT — Titre + Image du bowl
          ======================================== */}
      <section 
        className="split-hero" 
        id="produits-hero" 
        style={{ 
          backgroundImage: 'url(/bg-drink-candle.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '500px',
          position: 'relative'
        }}
      >
        <div style={{
          background: 'rgba(253, 252, 251, 0.9)',
          padding: '40px',
          borderRadius: '16px',
          maxWidth: '600px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          zIndex: 2
        }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
            L&apos;équilibre parfait dans chaque gorgée
          </h1>
          <p style={{ marginTop: 16 }}>
            Découvrez notre carte vibrante. Une fusion de saveurs, conçue avec des ingrédients choisis pour nourrir le corps et l&apos;esprit.
          </p>
        </div>
        {/* On laisse la colonne de droite vide pour bien voir l'image de fond */}
        <div></div>
      </section>

      {/* ========================================
          PHILOSOPHIE SANTÉ
          ======================================== */}
      <section className="section" style={{ background: '#fdfcfb', borderBottom: '1px solid #eaeaea', padding: '60px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--green-tropical)', marginBottom: '16px', fontSize: '2.2rem' }}>Notre philosophie santé 🌱</h2>
          <p style={{ fontSize: '1.15rem', color: '#5A4A42', lineHeight: '1.6', marginBottom: '20px' }}>
            Pour vous offrir des boissons savoureuses sans compromis, nous privilégions les <strong>alternatives santé</strong> pour sucrer nos créations : <br/>
            <span style={{ color: '#2E7D32', fontWeight: '600' }}>Stevia, fruit du moine, érythritol, allulose et sucre de canne biologique.</span>
          </p>
          <p style={{ fontSize: '1.1rem', color: '#5A4A42', lineHeight: '1.6', marginBottom: '32px' }}>
            Chaque recette est pensée pour nourrir votre corps. Nous visons le <strong>moins de calories possible</strong> tout en intégrant des propriétés fonctionnelles (énergie, concentration, protéines et nutriments). De plus, si vous avez des restrictions ou habitudes alimentaires spécifiques, n'hésitez pas à nous en faire part : nous ajusterons ou modifierons la recette avec plaisir si cela est possible !
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
            <span style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#2E7D32', padding: '10px 20px', borderRadius: '24px', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🌿 Végane
            </span>
            <span style={{ background: 'rgba(245, 124, 0, 0.1)', color: '#E65100', padding: '10px 20px', borderRadius: '24px', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🌾 Sans gluten
            </span>
            <span style={{ background: 'rgba(3, 169, 244, 0.1)', color: '#0277BD', padding: '10px 20px', borderRadius: '24px', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🥛 Sans prod. laitiers
            </span>
            <span style={{ background: 'rgba(156, 39, 176, 0.1)', color: '#7B1FA2', padding: '10px 20px', borderRadius: '24px', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💪 Protéiné
            </span>
            <span style={{ background: 'rgba(255, 193, 7, 0.1)', color: '#F57F17', padding: '10px 20px', borderRadius: '24px', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚡ Énergie & Focus
            </span>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION "NOS BREUVAGES"
          Carousel horizontal de boissons
          ======================================== */}
      <section className="section" id="breuvages-section">
        <h2 style={{ color: 'var(--text-dark)', marginBottom: 4 }}>
          🍹 Nos breuvages
        </h2>
        <p style={{ marginBottom: 24 }}>Rafraîchissants, énergisants et apaisants.</p>

        {/* Carousel horizontal interactif */}
        <ProductsCarousel items={boissonsData} type="boisson" />
      </section>

      {/* ========================================
          SECTION "À GRIGNOTER"
          Carousel horizontal de snacks
          ======================================== */}
      <section className="section section-alt" id="grignoter-section" style={{ background: 'var(--beige)' }}>
        <h2 style={{ color: 'var(--text-dark)', marginBottom: 4 }}>
          🍽️ À grignoter
        </h2>
        <p style={{ marginBottom: 24 }}>Gourmandise saine et réconfortante.</p>

        {/* Carousel horizontal interactif */}
        <ProductsCarousel items={grignotagesData} type="grignotage" />
      </section>
    </>
  );
}
