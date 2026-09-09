'use client';

import React, { useState, useEffect } from 'react';


const DEFAULT_INCOMES = [
  { id: 'inc_1', label: 'Dépôts System', amount: 7017, isActive: true },
  { id: 'inc_2', label: 'Extra', amount: 0, isActive: true }
];

const DEFAULT_EXPENSES = [
  { id: 'exp_1', label: 'Loyer maison', amount: 1710, isActive: true },
  { id: 'exp_2', label: 'Assurance capitale', amount: 258, isActive: true },
  { id: 'exp_3', label: 'Hydro maison', amount: 175, isActive: true },
  { id: 'exp_4', label: 'Hydro namasthé', amount: 200, isActive: true },
  { id: 'exp_5', label: 'Assurance Namasthé', amount: 165, isActive: true },
  { id: 'exp_6', label: 'Internet maison', amount: 86, isActive: true },
  { id: 'exp_7', label: 'Internet namasthé', amount: 135, isActive: true },
  { id: 'exp_8', label: 'Loyer Namasthé', amount: 1208, isActive: true },
  { id: 'exp_9', label: 'Cellulaire', amount: 120, isActive: true },
  { id: 'exp_10', label: 'Chevaux', amount: 900, isActive: true },
  { id: 'exp_11', label: 'Gaz', amount: 600, isActive: true },
  { id: 'exp_12', label: 'Auto', amount: 525, isActive: true },
  { id: 'exp_13', label: 'Prêt étudiant', amount: 100, isActive: true },
  { id: 'exp_14', label: 'Prêt fairstone', amount: 0, isActive: false },
  { id: 'exp_15', label: 'Animaux maison', amount: 150, isActive: true },
  { id: 'exp_16', label: 'Syndic', amount: 250, isActive: true },
  { id: 'exp_17', label: 'Dette impôt', amount: 500, isActive: true },
  { id: 'exp_18', label: 'Assurance vie (1)', amount: 98, isActive: true },
  { id: 'exp_19', label: 'Épicerie', amount: 1500, isActive: true },
  { id: 'exp_20', label: 'SAAQ', amount: 56, isActive: true },
  { id: 'exp_21', label: 'Assurance vie (2)', amount: 42, isActive: true },
  { id: 'exp_22', label: 'Abonnements X', amount: 150, isActive: true },
  { id: 'exp_23', label: 'Assurances invalidités', amount: 185, isActive: true }
];

const DEFAULT_LATER_EXPENSES = [];

const ItemRow = ({ item, type, handleUpdate, handleDelete }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #E5E7EB' }}>
    <button 
      onClick={() => handleUpdate(type, item.id, 'isActive', !item.isActive)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: item.isActive ? '#10B981' : '#9CA3AF' }}
      title={item.isActive ? "Désactiver" : "Activer"}
    >
      {item.isActive ? '✅' : '⚪'}
    </button>
    
    <input 
      type="text" 
      value={item.label} 
      onChange={(e) => handleUpdate(type, item.id, 'label', e.target.value)}
      style={{ flex: 1, padding: '8px', border: '1px solid transparent', borderRadius: '4px', background: item.isActive ? 'transparent' : '#F3F4F6', color: item.isActive ? '#111827' : '#9CA3AF', fontWeight: '500' }}
      placeholder="Nom"
    />
    
    <div style={{ position: 'relative', width: '120px' }}>
      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }}>$</span>
      <input 
        type="text" 
        inputMode="decimal"
        value={item.amount === 0 ? '' : item.amount} 
        onChange={(e) => handleUpdate(type, item.id, 'amount', e.target.value)}
        style={{ width: '100%', padding: '8px 8px 8px 25px', border: '1px solid #D1D5DB', borderRadius: '6px', textAlign: 'right', background: item.isActive ? 'white' : '#F3F4F6' }}
        placeholder="0.00"
      />
    </div>

    <button 
      onClick={() => handleDelete(type, item.id)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
      title="Supprimer"
    >
      🗑️
    </button>
  </div>
);

export default function BudgetSimulator() {
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [laterExpenses, setLaterExpenses] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedIncomes = localStorage.getItem('budget_sim_incomes');
    const savedExpenses = localStorage.getItem('budget_sim_expenses');
    const savedLaterExpenses = localStorage.getItem('budget_sim_later_expenses');

    if (savedIncomes && savedExpenses) {
      setIncomes(JSON.parse(savedIncomes));
      setExpenses(JSON.parse(savedExpenses));
      if (savedLaterExpenses) setLaterExpenses(JSON.parse(savedLaterExpenses));
      else setLaterExpenses(DEFAULT_LATER_EXPENSES);
    } else {
      setIncomes(DEFAULT_INCOMES);
      setExpenses(DEFAULT_EXPENSES);
      setLaterExpenses(DEFAULT_LATER_EXPENSES);
    }
    setIsLoaded(true);
  }, []);

  const saveToLocal = (newIncomes, newExpenses, newLaterExpenses) => {
    localStorage.setItem('budget_sim_incomes', JSON.stringify(newIncomes));
    localStorage.setItem('budget_sim_expenses', JSON.stringify(newExpenses));
    localStorage.setItem('budget_sim_later_expenses', JSON.stringify(newLaterExpenses));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleUpdate = (type, id, field, value) => {
    if (type === 'income') {
      const updated = incomes.map(item => item.id === id ? { ...item, [field]: value } : item);
      setIncomes(updated);
      saveToLocal(updated, expenses, laterExpenses);
    } else if (type === 'expense') {
      const updated = expenses.map(item => item.id === id ? { ...item, [field]: value } : item);
      setExpenses(updated);
      saveToLocal(incomes, updated, laterExpenses);
    } else {
      const updated = laterExpenses.map(item => item.id === id ? { ...item, [field]: value } : item);
      setLaterExpenses(updated);
      saveToLocal(incomes, expenses, updated);
    }
  };

  const handleDelete = (type, id) => {
    if (type === 'income') {
      const updated = incomes.filter(i => i.id !== id);
      setIncomes(updated);
      saveToLocal(updated, expenses, laterExpenses);
    } else if (type === 'expense') {
      const updated = expenses.filter(i => i.id !== id);
      setExpenses(updated);
      saveToLocal(incomes, updated, laterExpenses);
    } else {
      const updated = laterExpenses.filter(i => i.id !== id);
      setLaterExpenses(updated);
      saveToLocal(incomes, expenses, updated);
    }
  };

  const handleAdd = (type) => {
    const newItem = { id: `${type}_${Date.now()}`, label: 'Nouveau', amount: 0, isActive: true };
    if (type === 'income') {
      const updated = [...incomes, newItem];
      setIncomes(updated);
      saveToLocal(updated, expenses, laterExpenses);
    } else if (type === 'expense') {
      const updated = [...expenses, newItem];
      setExpenses(updated);
      saveToLocal(incomes, updated, laterExpenses);
    } else {
      const updated = [...laterExpenses, newItem];
      setLaterExpenses(updated);
      saveToLocal(incomes, expenses, updated);
    }
  };

  const resetDefaults = () => {
    if(confirm('Voulez-vous vraiment réinitialiser avec les valeurs par défaut ?')) {
      setIncomes(DEFAULT_INCOMES);
      setExpenses(DEFAULT_EXPENSES);
      setLaterExpenses(DEFAULT_LATER_EXPENSES);
      saveToLocal(DEFAULT_INCOMES, DEFAULT_EXPENSES, DEFAULT_LATER_EXPENSES);
    }
  };

  if (!isLoaded) return <div>Chargement du simulateur...</div>;

  const parseAmount = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    const cleaned = String(val).replace(',', '.').replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const totalActiveIncome = incomes.filter(i => i.isActive).reduce((acc, curr) => acc + parseAmount(curr.amount), 0);
  const totalActiveExpense = expenses.filter(e => e.isActive).reduce((acc, curr) => acc + parseAmount(curr.amount), 0) + laterExpenses.filter(e => e.isActive).reduce((acc, curr) => acc + parseAmount(curr.amount), 0);
  const balance = totalActiveIncome - totalActiveExpense;

  const formatMoney = (val) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(val);


  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '24px', margin: '0 0 5px 0', color: '#111827' }}>Simulateur de Budget 📊</h2>
          <p style={{ margin: 0, color: '#6B7280' }}>Votre carré de sable Excel. Modifiez, cochez, testez.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {isSaved && <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>💾 Sauvegardé</span>}
          <button onClick={resetDefaults} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'white', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', color: '#374151' }}>
            🔄 Réinitialiser
          </button>
        </div>
      </div>

      {/* RÉSULTAT GLOBAL FIXE EN HAUT POUR VISIBILITÉ */}
      <div style={{ background: balance >= 0 ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${balance >= 0 ? '#10B981' : '#EF4444'}`, borderRadius: '12px', padding: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', gap: '40px' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Revenus cochés</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>{formatMoney(totalActiveIncome)}</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Dépenses cochées</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#EF4444' }}>{formatMoney(totalActiveExpense)}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Reste à la fin du mois</div>
          <div style={{ fontSize: '36px', fontWeight: '900', color: balance >= 0 ? '#059669' : '#DC2626' }}>
            {balance > 0 ? '+' : ''}{formatMoney(balance)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        
        {/* COLONNE REVENUS */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#059669', fontSize: '18px' }}>Entrées d'argent</h3>
            <button onClick={() => handleAdd('income')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#ECFDF5', color: '#059669', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
              ➕ Ajouter
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {incomes.map(item => <ItemRow key={item.id} item={item} type="income" handleUpdate={handleUpdate} handleDelete={handleDelete} />)}
            {incomes.length === 0 && <div style={{ color: '#9CA3AF', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>Aucun revenu configuré</div>}
          </div>
        </div>

        {/* COLONNE DÉPENSES URGENTES */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#DC2626', fontSize: '18px' }}>Dépenses / Sorties</h3>
            <button onClick={() => handleAdd('expense')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
              ➕ Ajouter
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {expenses.map(item => <ItemRow key={item.id} item={item} type="expense" handleUpdate={handleUpdate} handleDelete={handleDelete} />)}
            {expenses.length === 0 && <div style={{ color: '#9CA3AF', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>Aucune dépense configurée</div>}
          </div>
        </div>
        
        {/* COLONNE DÉPENSES MOINS URGENTES */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#D97706', fontSize: '18px' }}>À venir (Moins urgent)</h3>
            <button onClick={() => handleAdd('laterExpense')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#FFFBEB', color: '#D97706', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
              ➕ Ajouter
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {laterExpenses.map(item => <ItemRow key={item.id} item={item} type="laterExpense" handleUpdate={handleUpdate} handleDelete={handleDelete} />)}
            {laterExpenses.length === 0 && <div style={{ color: '#9CA3AF', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>Aucune dépense à venir configurée</div>}
          </div>
        </div>

      </div>
    </div>
  );
}
