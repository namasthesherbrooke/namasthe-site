"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function NotreHistoire() {
  const [activeAlbum, setActiveAlbum] = useState(null);

  const albums = [
    {
      id: 'coco1',
      title: 'Coco La-Thé 1',
      subtitle: '10e avenue Sud (2018)',
      cover: '/images/nostalgia/albums/coco1_4.jpg',
      images: ['/images/nostalgia/albums/coco1_4.jpg', '/images/nostalgia-12.jpg']
    },
    {
      id: 'fuego',
      title: 'Le Fuego',
      subtitle: 'Les débuts vibrants',
      cover: '/images/nostalgia/albums/fuego_3.jpg',
      images: ['/images/nostalgia/albums/fuego_2.jpg', '/images/nostalgia/albums/fuego_3.jpg', '/images/nostalgia/albums/fuego_4.jpg', '/images/nostalgia/albums/fuego_5.jpg', '/images/nostalgia/albums/fuego_6.jpg']
    },
    {
      id: 'namasthe1',
      title: 'Le Namasthé 1',
      subtitle: 'Brique rouge',
      cover: '/images/nostalgia-10.jpg',
      images: ['/images/nostalgia-10.jpg']
    },
    {
      id: 'coco2',
      title: 'Coco La-Thé 2',
      subtitle: 'Maison blanche',
      cover: '/images/nostalgia/albums/coco2_2.jpg',
      images: ['/images/nostalgia/albums/coco2_1.jpg', '/images/nostalgia/albums/coco2_2.jpg', '/images/nostalgia/albums/coco2_3.jpg', '/images/nostalgia/albums/coco2_4.jpg', '/images/nostalgia/albums/coco2_5.jpg', '/images/nostalgia/albums/coco2_6.jpg']
    },
    {
      id: 'namasthe',
      title: 'Le Namasthé',
      subtitle: 'L\'emplacement actuel',
      cover: '/images/nostalgia-9.jpg',
      images: ['/images/nostalgia-9.jpg', '/images/nostalgia-11.jpg', '/images/nostalgia/albums/namasthe2_5.jpg', '/images/nostalgia/albums/namasthe2_6.jpg']
    }
  ];

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

  return (
    <div style={{ backgroundColor: '#FFFDF9', color: '#2C1810', overflow: 'hidden' }}>
      
      {/* 1. HERO - En haut de la page : une belle photo naturelle de Corine derrière le comptoir */}
      <section style={{ 
        background: 'linear-gradient(to right, rgba(255, 253, 249, 0.95) 0%, rgba(255, 253, 249, 0.4) 100%), url("/images/story-corine.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '120px 20px 80px', 
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ maxWidth: '600px', marginLeft: '5%', padding: '40px', background: 'rgba(255,255,255,0.9)', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }} className="fade-in-hidden">
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontFamily: 'var(--font-serif)', marginBottom: '24px', lineHeight: '1.2', color: '#B8003E' }}>
            Des breuvages qui font plaisir. Un endroit où l’on prend soin de vous.
          </h1>
          <p style={{ fontSize: '1.15rem', lineHeight: '1.8', color: '#5A4A42', marginBottom: '16px' }}>
            À Sherbrooke, le Café NamasThé propose des breuvages colorés, gourmands et personnalisés, pensés comme des alternatives plus équilibrées sans enlever le plaisir.
          </p>
          <p style={{ fontSize: '1.15rem', lineHeight: '1.8', color: '#5A4A42', marginBottom: '32px' }}>
            Mais NamasThé, ce n’est pas seulement un endroit où commander un drink. C’est un café chaleureux où vous pouvez prendre une pause, découvrir quelque chose de nouveau et vous sentir accueilli pour vrai.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/commande" className="btn" style={{ background: '#B8003E', color: 'white', padding: '14px 28px', borderRadius: '30px', fontWeight: 'bold', textDecoration: 'none' }}>
              Découvrir le menu
            </Link>
            <a href="https://maps.google.com/?q=1086+Rue+King+Ouest,+Sherbrooke" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: 'inline-block', padding: '14px 28px' }}>
              Venir nous voir
            </a>
          </div>
        </div>
      </section>

      {/* 2. PARCOURS - Deux ou trois anciennes photos de Coco La-Thé, Fuego */}
      <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '60px' }} className="fade-in-hidden">
        <div style={{ flex: '1 1 500px' }}>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: '#2C1810', marginBottom: '24px' }}>
            Moi, c’est Corine, la femme derrière NamasThé
          </h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#5A4A42', marginBottom: '16px' }}>
            Avant d’arriver au NamasThé d’aujourd’hui, il y a eu plusieurs idées, essais et concepts, dont Coco La-Thé et Fuego. Chaque étape m’a permis d’apprendre, de créer et de préciser ce que je voulais réellement offrir.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#5A4A42', marginBottom: '16px' }}>
            Je ne suis pas partie d’un plan parfait ni d’une grande stratégie tracée des années à l’avance. Je suis partie d’une intuition et de cette conviction qu’il y avait une place à Sherbrooke pour des breuvages différents, servis dans un endroit humain et accueillant.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#5A4A42', marginBottom: '16px' }}>
            Au fil du temps, le café a évolué. Il y a eu un déménagement, des changements de produits, une refonte du concept, beaucoup de nouveautés et quelques moments de doute aussi. Malgré les hauts, les bas et les imprévus, j’ai continué à suivre ma vision.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#5A4A42' }}>
            Aujourd’hui encore, le menu continue de changer et de s’améliorer. J’adore tester, ajuster et imaginer de nouvelles créations jusqu’à trouver le mélange qui fera dire « wow » dès la première gorgée.
          </p>
        </div>
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Anciennes photos avec description */}
          <div style={{ background: '#EAE4D8', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '16px', background: '#B8003E', color: 'white', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                Coco La-Thé – Mes débuts
              </h3>
              <p style={{ margin: 0, fontSize: '0.95rem', fontStyle: 'italic', lineHeight: '1.4', opacity: 0.95 }}>
                « Le bar home made, tout petit, mais c'était mes débuts. J'avais une vision de chaleur, de communautaire... c'était petit mais ça le faisait ! »
              </p>
            </div>
            <img src="/images/story-old-1.jpg" alt="Coco La-Thé" style={{ width: '100%', height: 'auto', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div style={{ background: '#EAE4D8', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <p style={{ margin: 0, padding: '12px 16px', background: '#2C1810', color: 'white', fontWeight: 'bold', fontSize: '0.95rem', textAlign: 'center', letterSpacing: '0.5px' }}>
              Le tout premier local Namasthé
            </p>
            <img src="/images/story-old-2.jpg" alt="Premier local Namasthé" style={{ width: '100%', height: 'auto', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
        </div>
      </section>

      {/* 3. MISSION - Tes mains en train de préparer un breuvage coloré */}
      <section style={{ background: '#F9F7F4', padding: '80px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap-reverse', alignItems: 'center', gap: '60px' }} className="fade-in-hidden">
          <div style={{ flex: '1 1 400px', height: '500px', background: '#EAE4D8', borderRadius: '24px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A7A6E', fontStyle: 'italic' }}>
            <img src="/images/story-preparation.jpg" alt="Préparation de breuvage coloré" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
            <span style={{ display: 'none' }}>[Photo: Mains préparant un breuvage]</span>
          </div>
          <div style={{ flex: '1 1 500px' }}>
            <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: '#2C1810', marginBottom: '24px' }}>
              Ma mission : faire du bien sans enlever le plaisir
            </h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#5A4A42', marginBottom: '16px' }}>
              Pour moi, choisir une option plus équilibrée ne devrait jamais vouloir dire se contenter de quelque chose de fade ou d’ennuyant.
            </p>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#5A4A42', marginBottom: '16px' }}>
              C’est pourquoi vous trouverez chez NamasThé des thés énergisants, des shakes protéinés, des bubble teas, des matchas, des cafés glacés et différentes gourmandises. Plusieurs créations sont offertes sans sucre ajouté et peuvent être adaptées selon vos goûts et vos envies.
            </p>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#B8003E', fontWeight: 'bold' }}>
              Mon objectif n’est pas simplement de vous servir un produit. Je veux vous aider à trouver <strong>votre</strong> drink : celui que vous aurez réellement hâte de reprendre.
            </p>
          </div>
        </div>
      </section>

      {/* 4. EXPÉRIENCE - Toi qui conseilles ou sers une cliente */}
      <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '60px' }} className="fade-in-hidden">
        <div style={{ flex: '1 1 500px' }}>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: '#2C1810', marginBottom: '24px' }}>
            Vous n’avez pas besoin de connaître le menu avant d’entrer
          </h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#5A4A42', marginBottom: '16px' }}>
            Une première visite peut être impressionnante quand on voit toutes les possibilités. C’est justement là que l’expérience NamasThé commence.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#5A4A42', marginBottom: '16px' }}>
            Dites-moi simplement ce que vous aimez : fruité, crémeux, chocolaté, surette, caféiné ou rafraîchissant. Dites-moi si vous cherchez de l’énergie, des protéines, une petite douceur ou simplement quelque chose de bon.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#2C1810', fontWeight: '600', marginBottom: '16px' }}>
            Je prendrai le temps de vous guider.
          </p>
          <div style={{ background: '#FFF0F5', padding: '24px', borderRadius: '16px', borderLeft: '4px solid #B8003E', margin: '24px 0' }}>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#5A4A42', margin: 0 }}>
              Vous pouvez aussi me dire :<br/>
              <strong style={{ fontSize: '1.3rem', color: '#B8003E' }}>« Surprends-moi! »</strong><br/>
              C’est souvent comme ça que naissent les nouveaux favoris.
            </p>
          </div>
        </div>
        <div style={{ flex: '1 1 400px', height: '500px', background: '#EAE4D8', borderRadius: '24px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A7A6E', fontStyle: 'italic' }}>
          <img src="/images/story-service.jpg" alt="Corine conseillant une cliente" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
          <span style={{ display: 'none' }}>[Photo: Service à une cliente]</span>
        </div>
      </section>

      {/* 5. COMMUNAUTÉ - Une photo réelle prise lors d'un événement */}
      <section style={{ background: '#2C1810', color: 'white', padding: '80px 20px', textAlign: 'center' }} className="fade-in-hidden">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: '#FFF8E1', marginBottom: '32px' }}>
            Un café qui grandit avec sa communauté
          </h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'rgba(255,255,255,0.9)', marginBottom: '16px' }}>
            Depuis les débuts, NamasThé s’est construit avec les personnes qui ont franchi sa porte.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'rgba(255,255,255,0.9)', marginBottom: '16px' }}>
            Des mamans, des étudiants, des familles, des amis et des enfants sont venus y chercher un breuvage, étudier, discuter, prendre une pause ou simplement passer un bon moment. Le café a aussi accueilli des journées spéciales, des collaborations locales, des événements et beaucoup de belles rencontres.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'rgba(255,255,255,0.9)', marginBottom: '16px' }}>
            Certaines personnes me suivent depuis Coco La-Thé et Fuego, bien avant l’emplacement actuel. Elles sont restées présentes à travers les changements, les nouveaux produits et le déménagement. Cette confiance me touche encore aujourd’hui.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'rgba(255,255,255,0.9)', marginBottom: '40px', fontWeight: 'bold' }}>
            C’est cette proximité que je veux préserver : connaître vos goûts, écouter vos idées, préparer vos drinks et vous voir repartir avec le sourire et l’envie de revenir.
          </p>
          
          <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', height: '400px', background: 'rgba(255,255,255,0.1)', borderRadius: '24px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF8E1', fontStyle: 'italic' }}>
            <img src="/images/story-community.jpg" alt="Événement communautaire au NamasThé" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
            <span style={{ display: 'none' }}>[Photo: Événement ou communauté]</span>
          </div>
        </div>
      </section>

      {/* 5.5. NOSTALGIE - Galerie de souvenirs */}
      <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }} className="fade-in-hidden">
        <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: '#2C1810', marginBottom: '16px', textAlign: 'center' }}>
          Nostalgie & Souvenirs d'ailleurs
        </h2>
        <div style={{ fontSize: '1.15rem', color: '#5A4A42', textAlign: 'center', marginBottom: '40px', maxWidth: '850px', margin: '0 auto 40px', lineHeight: '1.8' }}>
          <p style={{ marginBottom: '16px' }}>
            Mon aventure a débuté en 2018 avec <strong>Coco La-Thé</strong> sur la 10e avenue Sud. Un tout petit bar <i>home made</i>, mais qui portait déjà toute ma vision de chaleur et de communauté. 
          </p>
          <p style={{ marginBottom: '16px' }}>
            Puis est venu le chapitre vibrant du <strong>Fuego</strong>, suivi de la création du tout premier <strong>NamasThé</strong> (le fameux emplacement en brique rouge !). J'ai ensuite renoué avec mes racines avec <strong>Coco La-Thé 2</strong> (la chaleureuse maison blanche de Deauville), pour finalement rassembler toute mon expérience et créer le <strong>NamasThé</strong> tel que vous le connaissez aujourd'hui.
          </p>
          <p style={{ fontStyle: 'italic', color: '#B8003E' }}>
            De 2018 à aujourd'hui, j'ai acquis énormément d'expérience, et voici quelques instants capturés au fil de cette belle évolution...
          </p>
        </div>
        
        {/* Albums de photos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {albums.map((album) => (
            <div 
              key={album.id} 
              onClick={() => setActiveAlbum(album)}
              style={{ cursor: 'pointer', background: '#EAE4D8', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ height: '200px', width: '100%', overflow: 'hidden' }}>
                <img src={album.cover} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.display = 'none'; }} />
              </div>
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <h3 style={{ margin: '0', fontSize: '1.2rem', color: '#2C1810', fontFamily: 'var(--font-serif)' }}>{album.title}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#8A7A6E' }}>{album.subtitle}</p>
                <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.8rem', background: 'rgba(184, 0, 62, 0.1)', color: '#B8003E', padding: '4px 10px', borderRadius: '12px' }}>
                  Voir l'album ({album.images.length} photos)
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal Lightbox */}
      {activeAlbum && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto' }}
          onClick={() => setActiveAlbum(null)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', color: 'white' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)' }}>{activeAlbum.title}</h2>
              <p style={{ margin: 0, opacity: 0.8 }}>{activeAlbum.subtitle}</p>
            </div>
            <button 
              onClick={() => setActiveAlbum(null)}
              style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', padding: '10px' }}
            >
              &times;
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', width: '100%', maxWidth: '1200px', margin: '0 auto' }} onClick={(e) => e.stopPropagation()}>
            {activeAlbum.images.map((src, index) => (
              <img key={index} src={src} alt={`Souvenir ${index + 1}`} style={{ width: '100%', height: 'auto', borderRadius: '8px', objectFit: 'contain' }} />
            ))}
          </div>
        </div>
      )}


      {/* 6. CONCLUSION - Une vue chaleureuse du café ou de toi à l'entrée */}
      <section style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }} className="fade-in-hidden">
        
        <div style={{ width: '140px', height: '140px', margin: '0 auto 32px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #FFF', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', background: '#EAE4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A7A6E', fontStyle: 'italic' }}>
          <img src="/images/story-welcome.jpg" alt="Corine vous accueille" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
          <span style={{ display: 'none', fontSize: '0.8rem' }}>[Entrée]</span>
        </div>

        <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: '#2C1810', marginBottom: '24px' }}>
          Venez découvrir votre prochain favori
        </h2>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#5A4A42', marginBottom: '16px' }}>
          Que vous passiez avant le travail, entre deux cours, avec les enfants, pour étudier ou simplement pour vous offrir une pause, vous êtes les bienvenus.
        </p>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#B8003E', fontWeight: 'bold', marginBottom: '32px' }}>
          Venez avec une commande précise… ou laissez-moi vous surprendre.
        </p>

        <div style={{ background: '#F9F7F4', padding: '32px', borderRadius: '16px', display: 'inline-block', marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.4rem', color: '#2C1810', marginBottom: '8px' }}>Café NamasThé</h3>
          <p style={{ color: '#5A4A42', fontSize: '1.1rem', margin: 0 }}>
            1086, rue King Ouest<br/>Sherbrooke
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/commande" className="btn" style={{ background: '#B8003E', color: 'white', padding: '16px 36px', borderRadius: '40px', fontSize: '1.1rem', fontWeight: 'bold', textDecoration: 'none', boxShadow: '0 4px 15px rgba(184,0,62,0.3)' }}>
            Voir le menu
          </Link>
          <a href="https://maps.google.com/?q=1086+Rue+King+Ouest,+Sherbrooke" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: 'inline-block', padding: '16px 36px', borderRadius: '40px', fontSize: '1.1rem' }}>
            Obtenir l’itinéraire
          </a>
        </div>
      </section>

    </div>
  );
}
