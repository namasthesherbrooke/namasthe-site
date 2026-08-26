"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function MenuAutomne() {
  
  // Animation au défilement
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-visible');
        }
      });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.fade-in-hidden');
    hiddenElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const menuCategories = [
    {
      title: "🥤 SHAKES PROTÉINÉS",
      color: "#8B4513", // Brun chaleureux
      items: [
        { name: "Cheesecake pomme épicée", desc: "Crémeux, gourmand, avec le goût réconfortant de la pomme épicée et du cheesecake." },
        { name: "Banana Bread Chai", desc: "Le petit côté épicé du chai rencontre la douceur d’un banana bread. Un shake qui goûte littéralement l’automne." },
        { name: "Cheesecake citrouille", desc: "Crémeux, légèrement épicé et juste assez gourmand pour les fans de pumpkin season. 🎃" },
        { name: "Gâteau citrouille praliné", desc: "Citrouille + notes pralinées dans un shake protéiné ultra réconfortant." }
      ]
    },
    {
      title: "🎃 CHAI LATTÉS",
      color: "#D35400", // Orange automne
      items: [
        { name: "Chai Cheesecake pomme épicée", desc: "Chai, pomme épicée et petite touche cheesecake. Celui-là, c’est le chandail de laine version breuvage. 🍎" },
        { name: "Pumpkin Cream Chai", desc: "Un chai aux saveurs de citrouille épicée avec une finale douce et crémeuse." },
        { name: "Dirty Chai érable", desc: "Chai + café + érable. Plus corsé, réconfortant et parfait quand tu veux ton petit boost avec ton automne. ☕️" },
        { name: "Cinnamon Roll Chai", desc: "Cannelle, chai et côté gourmand inspiré du classique cinnamon roll." }
      ]
    },
    {
      title: "☕ CAFÉS",
      color: "#5C4033", // Espresso foncé
      items: [
        { name: "Pumpkin Spice Latte", desc: "Le grand classique de l’automne, version NamasThé. 🎃" },
        { name: "Tarte aux pommes caramel", desc: "Pomme, caramel et café dans le même verre. Oui, ça goûte aussi bon que ça sonne. 🍏" },
        { name: "Latte pacane caramélisée", desc: "Doux, noisetté et caramélisé. Le genre de café qu’on prend tranquillement et qu’on regrette d’avoir terminé." },
        { name: "Moka blanc cannelle", desc: "Chocolat blanc, café et cannelle pour un latte riche et réconfortant." }
      ]
    },
    {
      title: "⚡ MÉGA THÉS",
      color: "#C0392B", // Rouge cranberry/érable
      description: "Parce que l’automne n’est pas obligé d’être beige. 😂🍁",
      items: [
        { name: "Moka blanc épicé", desc: "Fruité, énergisant et épicé avec une touche de moka blanc. Une combinaison surprenante qui mérite d’être goûtée." },
        { name: "Croustade aux pommes", desc: "Les saveurs de pomme et d’épices d’une croustade, mais en version fraîche et énergisante. 🍎⚡" },
        { name: "Chaleur épicée", desc: "Une création fruitée avec juste ce qu’il faut de chaleur et d’épices pour changer complètement du thé énergisant classique." },
        { name: "Dirty Red Chai", desc: "Coloré, fruité et épicé avec une inspiration chai. Probablement le plus audacieux de la gang. ❤️🔥" }
      ]
    }
  ];

  return (
    <div style={{ backgroundColor: '#FFFDF9', minHeight: '100vh', color: '#2C1810', paddingBottom: '80px' }}>
      
      {/* Hero Automne */}
      <section style={{ 
        background: 'linear-gradient(135deg, rgba(211, 84, 0, 0.9) 0%, rgba(139, 69, 19, 0.9) 100%), url("/images/menu-automne.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay',
        padding: '100px 20px 80px', 
        textAlign: 'center', 
        color: '#FFF8E1' 
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }} className="fade-in-hidden">
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontFamily: 'var(--font-serif)', marginBottom: '16px', lineHeight: '1.2', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            🍂 Les nouveautés d’automne sont arrivées
          </h1>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', fontWeight: '500', textShadow: '1px 1px 3px rgba(0,0,0,0.4)' }}>
            Les saveurs réconfortantes sont de retour au NamasThé ! Pomme épicée, citrouille, chai, caramel, cannelle, moka blanc… on a transformé les saveurs qu’on aime de l’automne en créations gourmandes à découvrir chaudes, froides ou glacées. 🤎
          </p>
        </div>
      </section>

      {/* Menu Categories */}
      <section style={{ maxWidth: '1000px', margin: '-40px auto 0', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        
        {menuCategories.map((category, index) => (
          <div key={index} className="fade-in-hidden" style={{ 
            background: 'white', 
            borderRadius: '20px', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            padding: '40px',
            marginBottom: '40px',
            borderTop: `6px solid ${category.color}`
          }}>
            <h2 style={{ color: category.color, fontSize: '2rem', marginBottom: category.description ? '8px' : '30px', fontFamily: 'var(--font-heading)' }}>
              {category.title}
            </h2>
            {category.description && (
              <p style={{ fontStyle: 'italic', color: '#5A4A42', marginBottom: '30px', fontSize: '1.1rem' }}>
                {category.description}
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
              {category.items.map((item, idx) => (
                <div key={idx} style={{ 
                  background: '#F9F7F4', 
                  padding: '24px', 
                  borderRadius: '16px',
                  transition: 'transform 0.2s',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <h3 style={{ fontSize: '1.3rem', color: '#2C1810', marginBottom: '10px' }}>
                    {item.name}
                  </h3>
                  <p style={{ color: '#5A4A42', lineHeight: '1.5' }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

      </section>

      {/* Conclusion & CTA */}
      <section className="fade-in-hidden" style={{ textAlign: 'center', padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.2rem', color: '#D35400', fontFamily: 'var(--font-serif)', marginBottom: '16px' }}>
          🍁 Ton nouveau favori d’automne est peut-être ici
        </h2>
        <p style={{ fontSize: '1.2rem', color: '#5A4A42', marginBottom: '12px' }}>
          Team pomme, citrouille, chai, caramel ou cannelle ?
        </p>
        <p style={{ fontSize: '1.1rem', color: '#5A4A42', fontStyle: 'italic', marginBottom: '30px' }}>
          Passe au Café NamasThé et viens trouver celui qui va devenir ton drink de l’automne. 🥤🍂<br/>
          (Disponibles pour un temps limité.)
        </p>

        <Link href="/commande" className="btn" style={{ background: '#D35400', color: '#FFF', padding: '16px 36px', borderRadius: '40px', fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', boxShadow: '0 4px 15px rgba(211,84,0,0.3)', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          Commander en ligne
        </Link>
      </section>

    </div>
  );
}
