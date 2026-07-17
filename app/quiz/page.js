"use client";

import { useState } from 'react';
import Link from 'next/link';

const questions = [
  {
    question: "Quel est ton objectif principal aujourd'hui ?",
    options: [
      { text: "⚡ Un gros boost d'énergie !", points: { energie: 2, rafraichissant: 0, gourmand: 0 } },
      { text: "🌊 Me rafraîchir et relaxer", points: { energie: 0, rafraichissant: 2, gourmand: 0 } },
      { text: "🧁 Me gâter avec une petite douceur", points: { energie: 0, rafraichissant: 0, gourmand: 2 } }
    ]
  },
  {
    question: "Préfères-tu les textures légères ou crémeuses ?",
    options: [
      { text: "🍓 100% Léger et fruité", points: { energie: 1, rafraichissant: 2, gourmand: 0 } },
      { text: "🥛 Crémeux et onctueux", points: { energie: 0, rafraichissant: 0, gourmand: 2 } },
      { text: "🧋 Un mix amusant (avec des perles !)", points: { energie: 0, rafraichissant: 1, gourmand: 2 } }
    ]
  },
  {
    question: "Es-tu plutôt du genre aventure ou classique ?",
    options: [
      { text: "🤠 Aventure ! Fais-moi découvrir quelque chose", points: { energie: 1, rafraichissant: 1, gourmand: 1 } },
      { text: "🧘 Classique ! Une valeur sûre", points: { energie: 1, rafraichissant: 1, gourmand: 0 } }
    ]
  }
];

const results = [
  {
    id: 'energie',
    name: "Méga-Thé Énergie",
    description: "Tu as besoin d'un vrai coup de fouet ! Le Méga-Thé t'apportera toute l'énergie nécessaire avec des saveurs fruitées éclatantes, sans la chute d'énergie du sucre.",
    image: "/images/products/M%C3%A9ga-Th%C3%A9s.jpeg"
  },
  {
    id: 'rafraichissant',
    name: "Fruithé Signature",
    description: "Rafraîchissant, léger et coloré. C'est le breuvage parfait pour se désaltérer et profiter d'un pur moment de fraîcheur !",
    image: "/images/products/Fruith%C3%A9s.jpeg"
  },
  {
    id: 'gourmand',
    name: "Bubble Tea ou Dirty Soda",
    description: "Tu mérites une pause gourmande ! Un savoureux Bubble Tea ou un Dirty Soda onctueux saura combler tes envies sucrées (tout en restant sain !).",
    image: "/images/products/Bubble%20tea.jpeg"
  }
];

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ energie: 0, rafraichissant: 0, gourmand: 0 });
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (points) => {
    const newScores = {
      energie: scores.energie + points.energie,
      rafraichissant: scores.rafraichissant + points.rafraichissant,
      gourmand: scores.gourmand + points.gourmand
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
    return results.find(r => r.id === winnerId) || results[1];
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScores({ energie: 0, rafraichissant: 0, gourmand: 0 });
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
