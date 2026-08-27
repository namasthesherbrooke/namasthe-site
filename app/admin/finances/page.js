'use client';

import { useState, useEffect } from 'react';
import FinanceLock from './components/FinanceLock';
import AddTransactionModal from './components/AddTransactionModal';

export default function FinancesPage() {
  const [pin, setPin] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Global'); // Global, Namasthé, Personnel
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUnlock = (validPin) => {
    setPin(validPin);
    fetchData(validPin);
  };

  const fetchData = async (currentPin) => {
    setIsLoading(true);
    setError('');
    try {
      const [transRes, catRes] = await Promise.all([
        fetch('/api/admin/finances?action=transactions', { headers: { 'x-finance-pin': currentPin } }),
        fetch('/api/admin/finances?action=categories', { headers: { 'x-finance-pin': currentPin } })
      ]);

      if (!transRes.ok || !catRes.ok) throw new Error("Erreur de chargement des données");

      const transData = await transRes.json();
      const catData = await catRes.json();

      setTransactions(transData.transactions || []);
      setCategories(catData.categories || []);
    } catch (err) {
      setError("Impossible de charger les données financières. " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransaction = (newTransaction) => {
    setTransactions([newTransaction, ...transactions]);
  };

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer cette transaction ?')) return;
    
    try {
      const res = await fetch(`/api/admin/finances?id=${id}&table=finances_transactions`, {
        method: 'DELETE',
        headers: { 'x-finance-pin': pin }
      });
      if (!res.ok) throw new Error("Erreur de suppression");
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  // Filtrage des données selon l'onglet actif
  const filteredTransactions = transactions.filter(t => 
    activeTab === 'Global' ? true : t.entity === activeTab
  );

  // Calculs pour le mois en cours
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthTransactions = filteredTransactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const totalExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const netBalance = totalIncome - totalExpense;

  // Formatter pour l'affichage ($)
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount);
  };

  return (
    <FinanceLock onUnlock={handleUnlock}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-sans)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', color: '#2C1810', margin: '0 0 5px 0' }}>💰 Gestion Budgétaire</h1>
            <p style={{ color: '#666', margin: 0 }}>Mois en cours : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '12px 24px', background: '#2C1810', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
          >
            <span style={{ fontSize: '1.2rem' }}>+</span> Nouvelle Transaction
          </button>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          {['Global', 'Namasthé', 'Personnel'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: activeTab === tab ? (tab === 'Namasthé' ? '#FCE7F3' : tab === 'Personnel' ? '#DBEAFE' : '#F3F4F6') : 'transparent',
                color: activeTab === tab ? (tab === 'Namasthé' ? '#BE185D' : tab === 'Personnel' ? '#1D4ED8' : '#374151') : '#6B7280',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', borderLeft: '5px solid #10B981' }}>
            <p style={{ margin: '0 0 10px 0', color: '#6B7280', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Revenus (Ce mois)</p>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#10B981' }}>{formatMoney(totalIncome)}</h2>
          </div>
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', borderLeft: '5px solid #EF4444' }}>
            <p style={{ margin: '0 0 10px 0', color: '#6B7280', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Dépenses (Ce mois)</p>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#EF4444' }}>{formatMoney(totalExpense)}</h2>
          </div>
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', borderLeft: `5px solid ${netBalance >= 0 ? '#10B981' : '#EF4444'}` }}>
            <p style={{ margin: '0 0 10px 0', color: '#6B7280', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Solde Net (Ce mois)</p>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: netBalance >= 0 ? '#10B981' : '#EF4444' }}>{formatMoney(netBalance)}</h2>
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #F3F4F6' }}>
            <h3 style={{ margin: 0, color: '#374151', fontSize: '1.2rem' }}>Dernières Transactions ({activeTab})</h3>
          </div>
          
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Chargement des données...</div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Aucune transaction trouvée pour cette vue.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', color: '#6B7280', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '15px 20px', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '15px 20px', fontWeight: '600' }}>Description & Catégorie</th>
                    <th style={{ padding: '15px 20px', fontWeight: '600' }}>Entité</th>
                    <th style={{ padding: '15px 20px', fontWeight: '600', textAlign: 'right' }}>Montant</th>
                    <th style={{ padding: '15px 20px', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.slice(0, 50).map(t => {
                    const cat = categories.find(c => c.id === t.category_id);
                    const catColor = cat ? cat.color : '#CBD5E1';
                    const isExpense = t.type === 'expense';
                    
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '15px 20px', color: '#4B5563', whiteSpace: 'nowrap' }}>
                          {new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '15px 20px' }}>
                          <div style={{ fontWeight: '500', color: '#111827' }}>{t.description || (cat ? cat.name : 'Inconnue')}</div>
                          <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', background: `${catColor}20`, color: catColor, fontWeight: 'bold', marginTop: '4px' }}>
                            {cat ? cat.name : 'Inconnue'}
                          </div>
                        </td>
                        <td style={{ padding: '15px 20px' }}>
                          <span style={{ 
                            padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600',
                            background: t.entity === 'Namasthé' ? '#FCE7F3' : '#DBEAFE',
                            color: t.entity === 'Namasthé' ? '#BE185D' : '#1D4ED8'
                          }}>
                            {t.entity}
                          </span>
                        </td>
                        <td style={{ padding: '15px 20px', textAlign: 'right', fontWeight: 'bold', color: isExpense ? '#EF4444' : '#10B981', whiteSpace: 'nowrap' }}>
                          {isExpense ? '-' : '+'}{formatMoney(t.amount)}
                        </td>
                        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                          <button 
                            onClick={() => handleDelete(t.id)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.7 }}
                            title="Supprimer"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddTransaction}
        categories={categories}
        currentPin={pin}
      />
    </FinanceLock>
  );
}
