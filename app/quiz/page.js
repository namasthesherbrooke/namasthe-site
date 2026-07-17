"use client";

import { useState } from 'react';
import Link from 'next/link';

const questions = [
  {
    question: "Quel est ton objectif principal aujourd'hui ?",
    options: [
      { text: "⚡ Avoir un MAX d'énergie", points: { megathe: 2, lotus: 1, matcha: 0, bubble: 0, fruithe: 0, namastail: 0 } },
      { text: "🧘‍♀️ Me concentrer et rester zen", points: { megathe: 0, lotus: 1, matcha: 2, bubble: 0, fruithe: 0, namastail: 0 } },
      { text: "🧁 Me gâter avec une douceur", points: { megathe: 0, lotus: 0, matcha: 0, bubble: 2, fruithe: 0, namastail: 1 } },
      { text: "🌊 Me désaltérer simplement", points: { megathe: 0, lotus: 0, matcha: 0, bubble: 0, fruithe: 2, namastail: 1 } }
    ]
  },
  {
    question: "Quelle texture as-tu envie de boire ?",
    options: [
      { text: "🧃 Super léger (style jus)", points: { megathe: 1, lotus: 0, matcha: 0, bubble: 0, fruithe: 2, namastail: 1 } },
      { text: "🥛 Crémeux ou laiteux", points: { megathe: 0, lotus: 0, matcha: 2, bubble: 1, fruithe: 0, namastail: 0 } },
      { text: "🫧 Pétillant !", points: { megathe: 0, lotus: 2, matcha: 0, bubble: 0, fruithe: 0, namastail: 1 } },
      { text: "🧋 Amusante (avec des perles à mâcher)", points: { megathe: 0, lotus: 0, matcha: 0, bubble: 2, fruithe: 0, namastail: 0 } }
    ]
  },
  {
    question: "Quel niveau de goût sucré recherches-tu ?",
    options: [
      { text: "🍃 Très peu ou sans sucre ajouté", points: { megathe: 1, lotus: 0, matcha: 2, bubble: 0, fruithe: 1, namastail: 0 } },
      { text: "⚖️ Juste un bel équilibre", points: { megathe: 1, lotus: 2, matcha: 0, bubble: 0, fruithe: 1, namastail: 2 } },
      { text: "🤤 100% Gourmand !", points: { megathe: 0, lotus: 0, matcha: 0, bubble: 2, fruithe: 0, namastail: 0 } }
    ]
  },
  {
    question: "Quelle est ton humeur de couleur aujourd'hui ?",
    options: [
      { text: "🌿 Vert nature", points: { megathe: 0, lotus: 0, matcha: 2, bubble: 0, fruithe: 0, namastail: 0 } },
      { text: "🌺 Rose ou Rouge vibrant", points: { megathe: 1, lotus: 0, matcha: 0, bubble: 0, fruithe: 2, namastail: 0 } },
      { text: "🌌 Bleu océan ou Mauve magique", points: { megathe: 0, lotus: 2, matcha: 0, bubble: 0, fruithe: 0, namastail: 2 } },
      { text: "🧋 Caramel ou Brun classique", points: { megathe: 0, lotus: 0, matcha: 0, bubble: 2, fruithe: 0, namastail: 0 } }
    ]
  }
];

const results = [
  {
    id: 'lotus',
    name: "Lotus Plant Power",
    description: "La force des plantes ! Une boisson pétillante qui te donnera une belle énergie végétale grâce aux extraits de fleurs de lotus et de superfruits.",
    image: "/images/products/Lotus.jpeg"
  },
  {
    id: 'matcha',
    name: "Matcha Glacé",
    description: "Zénitude et concentration au menu. Notre matcha de première qualité t'apportera une énergie calme et prolongée, avec une texture douce et réconfortante.",
    image: "/images/products/Matcha glace.jpeg"
  },
  {
    id: 'bubble',
    name: "Bubble Tea Signature",
    description: "Tu mérites une pause gourmande et amusante ! Un savoureux Bubble Tea avec ses fameuses perles saura combler tes envies sucrées.",
    image: "/images/products/Bubble tea.jpeg"
  },
  {
    id: 'fruithe',
    name: "Fruithé Rafraîchissant",
    description: "Léger, coloré et ultra-désaltérant. C'est le breuvage parfait pour faire le plein de fraîcheur sans alourdir ta journée !",
    image: "/images/products/Fruithé.jpeg"
  },
  {
    id: 'megathe',
    name: "Méga-Thé Énergie",
    description: "Besoin d'un vrai coup de fouet ? Le Méga-Thé est ton allié ultime. De l'énergie explosive avec des saveurs fruitées éclatantes.",
    image: "/images/products/Mega-the.jpeg"
  },
  {
    id: 'namastail',
    name: "Namas-Tails",
    description: "L'élégance d'un cocktail, sans l'alcool. Un mélange sophistiqué, souvent pétillant, qui te donnera l'impression d'être en terrasse !",
    image: "/images/products/Namast-tails.jpeg"
  }
];

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ megathe: 0, lotus: 0, matcha: 0, bubble: 0, fruithe: 0, namastail: 0 });
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (points) => {
    const newScores = {
      megathe: scores.megathe + (points.megathe || 0),
      lotus: scores.lotus + (points.lotus || 0),
      matcha: scores.matcha + (points.matcha || 0),
      bubble: scores.bubble + (points.bubble || 0),
      fruithe: scores.fruithe + (points.fruithe || 0),
      namastail: scores.namastail + (points.namastail || 0)
    };
    setScores(newScores);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  const getWinner = () => {
    const winnerId = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    return results.find(r => r.id === winnerId) || results[0];
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScores({ megathe: 0, lotus: 0, matcha: 0, bubble: 0, fruithe: 0, namastail: 0 });
    setShowResult(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9F7F4', paddingTop: '100px', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 24px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: '#2C1810', fontSize: '2.5rem', marginBottom: '16px' }}>Quel breuvage es-tu ?</h1>
          <p style={{ color: '#5A4A42', fontSize: '1.1rem' }}>Réponds à ces 3 questions rapides pour découvrir ta boisson Namasthé idéale !</p>
        </div>

        <div style={{ background: 'white', borderRadius: '24px', padding: '40px 30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          {!showResult ? (
            <div className="fade-in">
              <div style={{ marginBottom: '24px', color: '#B8003E', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Question {currentQuestion + 1} sur {questions.length}
              </div>
              
              <h2 style={{ color: '#2C1810', fontSize: '1.5rem', marginBottom: '32px', lineHeight: '1.4' }}>
                {questions[currentQuestion].question}
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option.points)}
                    style={{
                      padding: '16px 24px',
                      background: '#Fdfcfb',
                      border: '2px solid #Eae4d8',
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      color: '#2C1810',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#B8003E';
                      e.currentTarget.style.background = '#FFF5F7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#Eae4d8';
                      e.currentTarget.style.background = '#Fdfcfb';
                    }}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="fade-in" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✨</div>
              <h2 style={{ color: '#2C1810', fontSize: '1.8rem', marginBottom: '8px' }}>Ton résultat :</h2>
              <h3 style={{ color: '#B8003E', fontSize: '2.2rem', marginBottom: '24px' }}>{getWinner().name}</h3>
              
              {/* Image simulation */}
              <div style={{ width: '200px', height: '200px', margin: '0 auto 24px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #FFF5F7', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
                <img src={getWinner().image} alt={getWinner().name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.src = '/bg-drink-candle.jpg'} />
              </div>

              <p style={{ color: '#5A4A42', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '32px' }}>
                {getWinner().description}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <Link href="/commande" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem', width: '100%', maxWidth: '300px' }}>
                  Commander maintenant
                </Link>
                <button 
                  onClick={resetQuiz}
                  style={{ background: 'none', border: 'none', color: '#888', textDecoration: 'underline', cursor: 'pointer', fontSize: '1rem' }}
                >
                  Refaire le quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
