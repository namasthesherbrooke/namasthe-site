'use client';

import { useState, useEffect } from 'react';
import FinanceLock from './components/FinanceLock';
import AddTransactionModal from './components/AddTransactionModal';

export default function FinancesPage() {
  const [pin, setPin] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [balances, setBalances] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const accounts = ['Vue Combinée', 'Entreprise', 'Perso', 'Conjoint', 'Impôts et taxes', 'Urgence', 'Voyage et mon garçon', 'CELI'];
  const [activeTab, setActiveTab] = useState('Vue Combinée'); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [currentBankBalance, setCurrentBankBalance] = useState('');
  const [isSavingBalance, setIsSavingBalance] = useState(false);

  const parseDateLocal = (dStr) => {
    if (!dStr) return new Date();
    const [y, m, d] = dStr.split('T')[0].split('-');
    return new Date(y, m - 1, d);
  };

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleUnlock = (validPin) => {
    setPin(validPin);
    fetchData(validPin);
  };

  const fetchData = async (currentPin) => {
    setIsLoading(true);
    setError('');
    try {
      const [transRes, catRes, balRes] = await Promise.all([
        fetch('/api/admin/finances?action=transactions', { headers: { 'x-finance-pin': currentPin } }),
        fetch('/api/admin/finances?action=categories', { headers: { 'x-finance-pin': currentPin } }),
        fetch('/api/admin/finances?action=balances', { headers: { 'x-finance-pin': currentPin } })
      ]);

      if (!transRes.ok || !catRes.ok || !balRes.ok) throw new Error("Erreur de chargement des données");

      const transData = await transRes.json();
      const catData = await catRes.json();
      const balData = await balRes.json();

      setTransactions(transData.transactions || []);
      setCategories(catData.categories || []);
      setBalances(balData.balances || []);
    } catch (err) {
      setError("Impossible de charger les données financières. " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransaction = (newTransaction) => {
    setTransactions([newTransaction, ...transactions]);
  };

  const handleEditTransaction = (updatedTransaction) => {
    setTransactions(transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  };



  const handleUpdateTransactionStatus = async (id, newStatus) => {
    if (String(id).startsWith('ghost-')) {
      const ghost = ghostExpenses.find(g => g.id === id);
      if (!ghost) return;
      try {
        const res = await fetch('/api/admin/finances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-finance-pin': pin },
          body: JSON.stringify({
            action: 'add_transaction',
            data: {
              date: ghost.date,
              type: ghost.type,
              amount: ghost.amount,
              category_id: ghost.category_id,
              description: ghost.description,
              entity: ghost.entity,
              status: newStatus,
              priority: ghost.priority,
              is_fixed: true
            }
          })
        });
        const data = await res.json();
        if (res.ok) setTransactions([data.transaction, ...transactions]);
      } catch (err) { alert(err.message); }
      return;
    }

    try {
      const res = await fetch(`/api/admin/finances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-finance-pin': pin },
        body: JSON.stringify({
          action: 'update_transaction',
          data: { id, updates: { status: newStatus } }
        })
      });
      if (!res.ok) throw new Error("Erreur de mise à jour");
      const { transaction } = await res.json();
      setTransactions(transactions.map(t => t.id === id ? transaction : t));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (String(id).startsWith('ghost-')) {
      alert("Ceci est une dépense récurrente projetée. Pour l'annuler définitivement, supprimez-la dans le mois de sa création.");
      return;
    }
    if (!confirm('Voulez-vous vraiment supprimer cet élément ?')) return;
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

  const saveBankBalance = async () => {
    if (!currentBankBalance || activeTab === 'Vue Combinée') return;
    setIsSavingBalance(true);
    try {
      const res = await fetch(`/api/admin/finances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-finance-pin': pin },
        body: JSON.stringify({
          action: 'add_balance',
          data: { account: activeTab, date: new Date().toISOString().split('T')[0], amount: currentBankBalance }
        })
      });
      if (!res.ok) throw new Error("Erreur de sauvegarde du solde");
      const { balance } = await res.json();
      setBalances([balance, ...balances]);
      setCurrentBankBalance('');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSavingBalance(false);
    }
  };

  const getCalculatedStartBalance = (m, y, acc) => {
    const manualBal = balances.find(b => {
      const d = parseDateLocal(b.date);
      return b.account === acc && d.getMonth() === m && d.getFullYear() === y;
    });
    if (manualBal) return parseFloat(manualBal.amount);
    
    let prevM = m - 1;
    let prevY = y;
    if (prevM < 0) { prevM = 11; prevY -= 1; }
    if (prevY < 2024) return 0;
    
    return getProjectedEndBalanceForMonth(prevM, prevY, acc);
  };

  const getProjectedEndBalanceForMonth = (m, y, acc) => {
    const startBal = getCalculatedStartBalance(m, y, acc);
    
    const incs = transactions.filter(t => t.entity === acc && t.type === 'income' && parseDateLocal(t.date).getMonth() === m && parseDateLocal(t.date).getFullYear() === y)
      .reduce((a, t) => a + parseFloat(t.amount), 0);
      
    const exps = transactions.filter(t => t.entity === acc && t.type === 'expense' && parseDateLocal(t.date).getMonth() === m && parseDateLocal(t.date).getFullYear() === y)
      .reduce((a, t) => a + parseFloat(t.amount), 0);
      
    const viewedDate = new Date(y, m, 1);
    const pastFixeds = transactions.filter(t => t.is_fixed && t.type === 'expense' && parseDateLocal(t.date) < viewedDate);
    const ghostMap = new Map();
    pastFixeds.forEach(t => {
      const currentExists = transactions.some(c => c.description === t.description && c.category_id === t.category_id && c.entity === t.entity && parseDateLocal(c.date).getMonth() === m && parseDateLocal(c.date).getFullYear() === y);
      if (!currentExists && t.entity === acc) {
        const k = `${t.entity}-${t.category_id}-${t.description}`;
        if (!ghostMap.has(k) || parseDateLocal(t.date) > parseDateLocal(ghostMap.get(k).date)) {
          ghostMap.set(k, t);
        }
      }
    });
    
    const ghostSum = Array.from(ghostMap.values()).reduce((a, t) => a + parseFloat(t.amount), 0);
    
    return startBal + incs - exps - ghostSum;
  };

  const isCombinedView = activeTab === 'Vue Combinée';

  const getCategory = (id) => categories.find(c => c.id === id) || { name: 'Inconnue', color: '#ccc' };
  const formatMoney = (amount) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount);

  const viewedDate = new Date(currentYear, currentMonth, 1);
  let baseCurrentMonthTransactions = transactions.filter(t => {
    const d = parseDateLocal(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const pastFixed = transactions.filter(t => t.is_fixed && t.type === 'expense' && parseDateLocal(t.date) < viewedDate);
  const latestFixedMap = new Map();
  pastFixed.forEach(t => {
    const existsInCurrentMonth = baseCurrentMonthTransactions.some(current => 
      current.description === t.description && current.category_id === t.category_id && current.entity === t.entity
    );
    if (!existsInCurrentMonth) {
      const key = `${t.entity}-${t.category_id}-${t.description || ''}`;
      if (!latestFixedMap.has(key) || parseDateLocal(t.date) > parseDateLocal(latestFixedMap.get(key).date)) {
        latestFixedMap.set(key, t);
      }
    }
  });

  const ghostExpenses = Array.from(latestFixedMap.values()).map(t => ({
    ...t,
    id: `ghost-${t.id}`,
    status: 'pending',
    date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
    is_ghost: true
  }));

  const currentMonthTransactions = [...baseCurrentMonthTransactions, ...ghostExpenses];

  let accountTransactions = currentMonthTransactions;
  if (!isCombinedView) {
    accountTransactions = currentMonthTransactions.filter(t => t.entity === activeTab);
  }

  const fixedExpenses = accountTransactions.filter(t => t.type === 'expense' && t.is_fixed);
  const sporadicExpenses = accountTransactions.filter(t => t.type === 'expense' && !t.is_fixed);
  const incomes = accountTransactions.filter(t => t.type === 'income');

  // Calculs Projection globale ou par compte
  let projectedBalance = 0;
  if (!isCombinedView) {
    projectedBalance = getProjectedEndBalanceForMonth(currentMonth, currentYear, activeTab);
  }
  let pendingIncomes = accountTransactions.filter(t => t.type === 'income' && t.status === 'pending').reduce((acc, t) => acc + parseFloat(t.amount), 0);
  let pendingExpenses = accountTransactions.filter(t => t.type === 'expense' && t.status === 'pending').reduce((acc, t) => acc + parseFloat(t.amount), 0);
  let suggestions = [];

  if (isCombinedView) {
    const pEnt = getProjectedEndBalanceForMonth(currentMonth, currentYear, 'Entreprise');
    const pPer = getProjectedEndBalanceForMonth(currentMonth, currentYear, 'Perso');
    const pCon = getProjectedEndBalanceForMonth(currentMonth, currentYear, 'Conjoint');
    projectedBalance = pEnt + pPer + pCon;
    
    // Algorithme d'équilibrage
    const accountsStatus = [
      { name: 'Entreprise', bal: pEnt },
      { name: 'Perso', bal: pPer },
      { name: 'Conjoint', bal: pCon }
    ];
    
    // Créer des copies pour itérer sans modifier l'original
    let surpluses = accountsStatus.filter(a => a.bal > 0).map(a => ({...a})).sort((a,b) => b.bal - a.bal);
    let deficits = accountsStatus.filter(a => a.bal < 0).map(a => ({...a})).sort((a,b) => a.bal - b.bal); // Plus grand déficit en premier
    
    for (let def of deficits) {
      let needed = Math.abs(def.bal);
      for (let sur of surpluses) {
        if (needed === 0) break;
        if (sur.bal > 0) {
          let transfer = Math.min(sur.bal, needed);
          suggestions.push({
            from: sur.name,
            to: def.name,
            amount: transfer
          });
          sur.bal -= transfer;
          needed -= transfer;
        }
      }
    }
  }

  // --- LE CONSEILLER FINANCIER ---
  // 1. Viabilité Entreprise
  const entrepriseIncomes = transactions.filter(t => t.entity === 'Entreprise' && t.type === 'income' && parseDateLocal(t.date).getMonth() === currentMonth && parseDateLocal(t.date).getFullYear() === currentYear).reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const entrepriseExpenses = transactions.filter(t => t.entity === 'Entreprise' && t.type === 'expense' && parseDateLocal(t.date).getMonth() === currentMonth && parseDateLocal(t.date).getFullYear() === currentYear).reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const profitMargin = entrepriseIncomes > 0 ? ((entrepriseIncomes - entrepriseExpenses) / entrepriseIncomes) * 100 : (entrepriseExpenses > 0 ? -100 : 0);
  
  // 2. Provisions (Basé sur vos objectifs Personnels)
  const persoIncomes = transactions.filter(t => t.entity === 'Perso' && t.type === 'income' && parseDateLocal(t.date).getMonth() === currentMonth && parseDateLocal(t.date).getFullYear() === currentYear).reduce((acc, t) => acc + parseFloat(t.amount), 0);
  
  const taxProvision = persoIncomes * 0.25; // 25% Impôts
  const emergencyProvision = persoIncomes * 0.15; // 10% Urgence + 5% Imprévus
  const voyageProvision = persoIncomes * 0.12; // 7% Voyage + 5% Jacob
  const celiProvision = persoIncomes * 0.08; // 8% CELI

  // 3. Les petits sous (Lousse)
  const safeSurplus = isCombinedView ? projectedBalance : 0;

  // --- GRAND TOTAL (Valeur Nette) ---
  const grandTotalCurrent = accounts.filter(a => a !== 'Vue Combinée').reduce((sum, acc) => sum + getCalculatedStartBalance(currentMonth, currentYear, acc), 0);
  const grandTotalProjected = accounts.filter(a => a !== 'Vue Combinée' && a !== 'CELI').reduce((sum, acc) => sum + getProjectedEndBalanceForMonth(currentMonth, currentYear, acc), 0) + getProjectedEndBalanceForMonth(currentMonth, currentYear, 'CELI');
  
  return (
    <FinanceLock onUnlock={handleUnlock}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-sans)', paddingBottom: '50px' }}>
        
        {/* EN-TÊTE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', color: '#2C1810', margin: '0 0 5px 0' }}>📊 Gestion Budgétaire</h1>
            <div style={{ color: '#666', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              Mois affiché : 
              <button onClick={handlePrevMonth} style={{cursor:'pointer', padding:'2px 8px', borderRadius:'6px', border:'1px solid #CBD5E1', background:'#fff', color: '#475569'}}>◀</button>
              <strong style={{color: '#2C1810', minWidth: '130px', textAlign: 'center', textTransform: 'capitalize'}}>
                {new Date(currentYear, currentMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </strong>
              <button onClick={handleNextMonth} style={{cursor:'pointer', padding:'2px 8px', borderRadius:'6px', border:'1px solid #CBD5E1', background:'#fff', color: '#475569'}}>▶</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: '#F8FAFC', padding: '10px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Actuel</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#334155' }}>{formatMoney(grandTotalCurrent)}</span>
              </div>
              <div style={{ width: '1px', background: '#E2E8F0' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 'bold', textTransform: 'uppercase' }}>Projection Fin de Mois</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#15803D' }}>{formatMoney(grandTotalProjected)}</span>
              </div>
            </div>
            
            <button 
              onClick={() => { setTransactionToEdit(null); setIsModalOpen(true); }}
              style={{ padding: '12px 24px', background: '#2C1810', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
              <span style={{ fontSize: '1.2rem' }}>+</span> Nouvelle Entrée / Dépense
            </button>
          </div>
        </div>

        {/* ONGLETS DES COMPTES */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
          {accounts.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: activeTab === tab ? (tab === 'Vue Combinée' ? '#4F46E5' : '#2C1810') : '#F3F4F6',
                color: activeTab === tab ? 'white' : '#6B7280',
                transition: 'all 0.2s',
                boxShadow: activeTab === tab ? '0 4px 10px rgba(0,0,0,0.15)' : 'none'
              }}
            >
              {tab === 'Vue Combinée' ? '🌐 ' + tab : tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>Chargement...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* RÉCONCILIATION ET PROJECTION */}
            <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                
                {/* Solde Actuel */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #E5E7EB' }}>
                  <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isCombinedView ? '💰 Soldes Actuels' : '💰 Point sur le compte'}
                  </h3>
                  {isCombinedView ? (() => {
                    const combinedBalance = getCalculatedStartBalance(currentMonth, currentYear, 'Entreprise') + getCalculatedStartBalance(currentMonth, currentYear, 'Perso') + getCalculatedStartBalance(currentMonth, currentYear, 'Conjoint');
                    return (
                      <>
                        <div style={{ background: '#F3F4F6', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
                          <p style={{ margin: '0 0 5px 0', color: '#6B7280', fontSize: '0.9rem' }}>Somme des soldes (Ent. + Perso + Conj.)</p>
                          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{formatMoney(combinedBalance)}</div>
                        </div>
                        <div style={{ background: '#EEF2FF', padding: '15px', borderRadius: '12px', color: '#4F46E5', fontSize: '0.85rem' }}>
                          <p style={{ margin: 0 }}>*Pour modifier un solde, veuillez vous rendre dans l'onglet individuel correspondant.</p>
                        </div>
                      </>
                    );
                  })() : (() => {
                    const currentBankBalanceObj = balances.find(b => {
                      const d = parseDateLocal(b.date);
                      return b.account === activeTab && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    });
                    
                    const currentBalance = getCalculatedStartBalance(currentMonth, currentYear, activeTab);
                    const isRollover = !currentBankBalanceObj;

                    return (
                      <>
                        <p style={{ color: '#6B7280', margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                          {isRollover ? <span style={{color: '#3B82F6', fontWeight: 'bold'}}>🪄 Solde reporté automatiquement :</span> : "Dernier solde relevé ce mois-ci :"}
                        </p>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#111827', marginBottom: '20px' }}>
                          {formatMoney(currentBalance)}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={currentBankBalance} 
                            onChange={(e) => setCurrentBankBalance(e.target.value)}
                            placeholder="Solde bancaire actuel..."
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                          />
                          <button 
                            onClick={saveBankBalance}
                            disabled={isSavingBalance || !currentBankBalance}
                            style={{ padding: '10px 20px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            {isSavingBalance ? '...' : 'MAJ'}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Projection */}
                <div style={{ borderLeft: isCombinedView ? 'none' : '1px solid #E5E7EB', paddingLeft: isCombinedView ? '0' : '30px' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#374151', fontSize: '1.2rem' }}>
                    {isCombinedView ? '🔮 Projection Combinée' : '🔮 Projection fin de mois'}
                  </h3>
                  <div style={{ background: projectedBalance >= 0 ? '#ECFDF5' : '#FEF2F2', padding: '20px', borderRadius: '12px', border: `1px solid ${projectedBalance >= 0 ? '#10B981' : '#EF4444'}` }}>
                    <p style={{ margin: '0 0 5px 0', color: '#6B7280' }}>Si tous les paiements prévus passent :</p>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: projectedBalance >= 0 ? '#059669' : '#DC2626' }}>
                      {formatMoney(projectedBalance)}
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#6B7280', display: 'flex', justifyContent: 'space-between' }}>
                      <span>À recevoir : <strong style={{color: '#10B981'}}>+{formatMoney(pendingIncomes)}</strong></span>
                      <span>À payer : <strong style={{color: '#EF4444'}}>-{formatMoney(pendingExpenses)}</strong></span>
                    </div>
                  </div>
                </div>

              </div>
              
              {/* ALGORITHME D'ÉQUILIBRAGE (Seulement dans la Vue Combinée) */}
              {isCombinedView && (
                <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#4F46E5', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🤖 Équilibrage des Comptes
                  </h3>
                  
                  {suggestions.length === 0 ? (
                    projectedBalance >= 0 ? (
                      <div style={{ background: '#F0FDF4', padding: '15px', borderRadius: '12px', color: '#166534', border: '1px solid #BBF7D0' }}>
                        <strong>Parfait !</strong> Aucun des 3 comptes (Entreprise, Perso, Conjoint) n'est projeté dans le rouge ce mois-ci. Aucun virement de renflouement n'est nécessaire.
                      </div>
                    ) : (
                      <div style={{ background: '#FEF2F2', padding: '15px', borderRadius: '12px', color: '#991B1B', border: '1px solid #FECACA' }}>
                        <strong>Alerte de déficit !</strong> Des comptes sont projetés dans le rouge et il n'y a malheureusement aucun surplus disponible dans les autres comptes pour les renflouer.
                      </div>
                    )
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {suggestions.map((s, idx) => (
                        <div key={idx} style={{ background: '#EEF2FF', padding: '15px', borderRadius: '12px', color: '#3730A3', border: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            Transférer depuis <strong>{s.from}</strong> vers <strong>{s.to}</strong>
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {formatMoney(s.amount)}
                          </div>
                        </div>
                      ))}
                      {projectedBalance < 0 && (
                        <div style={{ marginTop: '5px', background: '#FEF2F2', padding: '15px', borderRadius: '12px', color: '#991B1B', border: '1px solid #FECACA' }}>
                          <strong>Attention !</strong> Même avec ces virements, le bilan global de vos comptes reste dans le rouge. Un apport externe est nécessaire.
                        </div>
                      )}
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#6B7280' }}>
                        *Ces virements permettront de couvrir les dépenses prévues des comptes en déficit grâce aux surplus des autres.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* LE CONSEILLER FINANCIER (Seulement dans la Vue Combinée) */}
              {isCombinedView && (
                <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '2px dashed #E5E7EB' }}>
                  <h3 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🧐 Le Conseiller Financier
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    
                    {/* Bilan Entreprise */}
                    <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#475569' }}>🏢 Viabilité Entreprise</h4>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: profitMargin >= 15 ? '#059669' : profitMargin > 5 ? '#D97706' : '#DC2626' }}>
                        {profitMargin.toFixed(1)}%
                      </div>
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                        {profitMargin >= 15 ? 'Excellente marge de profit !' : profitMargin > 5 ? 'Marge stable, mais à surveiller.' : 'Attention, l\'entreprise est en déficit ou marge trop faible.'}
                      </p>
                      <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#94A3B8' }}>
                        Revenus: {formatMoney(entrepriseIncomes)} | Dépenses: {formatMoney(entrepriseExpenses)}
                      </div>
                    </div>

                    {/* Provisions Automatiques */}
                    <div style={{ background: '#FFFBEB', padding: '20px', borderRadius: '12px', border: '1px solid #FEF3C7' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#92400E' }}>🏦 Planification de l'Épargne</h4>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#B45309' }}>
                        Basé sur vos revenus personnels ce mois-ci ({formatMoney(persoIncomes)}) :
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400E', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li><strong>Impôts (25%) :</strong> {formatMoney(taxProvision)}</li>
                        <li><strong>Urgence/Imprévus (15%) :</strong> {formatMoney(emergencyProvision)}</li>
                        <li><strong>Voyage/Jacob (12%) :</strong> {formatMoney(voyageProvision)}</li>
                        <li><strong>CELI (8%) :</strong> {formatMoney(celiProvision)}</li>
                      </ul>
                      <p style={{ margin: '10px 0 0 0', fontSize: '0.8rem', color: '#D97706', fontStyle: 'italic' }}>
                        Virez ces montants vers leurs comptes respectifs pour suivre votre plan exact !
                      </p>
                    </div>

                    {/* Lousse / Petits sous */}
                    <div style={{ background: safeSurplus > 0 ? '#F0FDF4' : '#F9FAFB', padding: '20px', borderRadius: '12px', border: `1px solid ${safeSurplus > 0 ? '#BBF7D0' : '#E5E7EB'}` }}>
                      <h4 style={{ margin: '0 0 10px 0', color: safeSurplus > 0 ? '#166534' : '#6B7280' }}>🏖️ Les Petits Sous (Lousse)</h4>
                      {safeSurplus > 0 ? (
                        <>
                          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#15803D' }}>
                            {formatMoney(safeSurplus)}
                          </div>
                          <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', color: '#166534' }}>
                            Vous avez un surplus sécuritaire ! Toutes vos dépenses prévues pour vos 3 comptes sont couvertes.
                          </p>
                          <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', fontWeight: 'bold', color: '#065F46' }}>
                            💡 Suggéré : Transférer vers "Voyage et mon garçon".
                          </p>
                        </>
                      ) : (
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#6B7280' }}>
                          Pas de surplus sécuritaire détecté ce mois-ci une fois toutes les factures payées. Gardez le cap !
                        </p>
                      )}
                    </div>

                  </div>
                </div>
              )}

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
              
              {/* COLONNE GAUCHE : DÉPENSES */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* Dépenses Fixes */}
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                  <div style={{ padding: '20px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, color: '#374151' }}>🏢 Dépenses Fixes {isCombinedView ? '(Global)' : ''}</h3>
                    <span style={{ fontWeight: 'bold', color: '#6B7280' }}>{formatMoney(fixedExpenses.reduce((a, b) => a + parseFloat(b.amount), 0))}</span>
                  </div>
                  <div style={{ padding: '10px 20px' }}>
                    {fixedExpenses.length === 0 ? <p style={{ color: '#9CA3AF' }}>Aucune dépense fixe.</p> : fixedExpenses.map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F3F4F6', opacity: t.is_ghost ? 0.6 : 1 }}>
                        <div>
                          <div style={{ fontWeight: '500', color: t.status === 'paid' ? '#9CA3AF' : '#111827', textDecoration: t.status === 'paid' ? 'line-through' : 'none' }}>
                            {t.is_ghost && <span title="Projeté automatiquement" style={{marginRight: '5px'}}>👻</span>}
                            {t.description || getCategory(t.category_id).name}
                            <span style={{ fontSize: '0.7rem', background: '#F3F4F6', color: '#4B5563', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', textDecoration: 'none', display: 'inline-block' }}>
                              {(t.priority === 3 || t.priority === 4) ? '🔄 Date variable' : `📅 Le ${String(parseDateLocal(t.date).getDate()).padStart(2, '0')}`}
                            </span>
                            {(t.priority === 1 || t.priority === 4) && (
                              <span style={{ fontSize: '0.7rem', background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px', textDecoration: 'none', display: 'inline-block' }}>
                                🔄 Montant variable
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                            {isCombinedView && <span style={{ fontWeight: 'bold', marginRight: '5px' }}>[{t.entity}]</span>}
                            {getCategory(t.category_id).name}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <span style={{ fontWeight: 'bold', color: t.status === 'paid' ? '#9CA3AF' : '#EF4444' }}>{formatMoney(t.amount)}</span>
                          <input 
                            type="checkbox" 
                            checked={t.status === 'paid'} 
                            onChange={() => handleUpdateTransactionStatus(t.id, t.status === 'paid' ? 'pending' : 'paid')}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            title="Marquer comme payé"
                          />
                          <button onClick={() => { setTransactionToEdit(t); setIsModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '1.1rem' }} title="Modifier">✎</button>
                          <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem' }} title="Supprimer">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dépenses Sporadiques */}
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                  <div style={{ padding: '20px', background: '#FEF2F2', borderBottom: '1px solid #FEE2E2', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, color: '#991B1B' }}>🛒 Achats / Paiements à venir</h3>
                    <span style={{ fontWeight: 'bold', color: '#991B1B' }}>{formatMoney(sporadicExpenses.filter(e => e.status === 'pending').reduce((a, b) => a + parseFloat(b.amount), 0))}</span>
                  </div>
                  <div style={{ padding: '10px 20px' }}>
                    {sporadicExpenses.filter(e => e.status === 'pending').length === 0 ? <p style={{ color: '#9CA3AF' }}>Aucun paiement en attente.</p> : 
                    sporadicExpenses.filter(e => e.status === 'pending').sort((a,b) => a.priority - b.priority).map(t => (
                      <div key={t.id} style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', marginBottom: '10px', borderRadius: '8px',
                        background: t.priority === 1 ? '#FEF2F2' : t.priority === 3 ? '#F0FDF4' : '#F9FAFB',
                        borderLeft: `4px solid ${t.priority === 1 ? '#EF4444' : t.priority === 3 ? '#10B981' : '#D1D5DB'}`
                      }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: t.priority === 1 ? '#991B1B' : '#111827' }}>
                            {isCombinedView && <span style={{ fontSize: '0.8rem', fontWeight: 'normal', display: 'block', color: '#6B7280' }}>[{t.entity}]</span>}
                            {t.description || getCategory(t.category_id).name}
                            <span style={{ fontSize: '0.7rem', background: '#F3F4F6', color: '#4B5563', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', textDecoration: 'none', display: 'inline-block' }}>
                              {`📅 Le ${String(parseDateLocal(t.date).getDate()).padStart(2, '0')}`}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 'bold', color: '#EF4444' }}>{formatMoney(t.amount)}</span>
                          <button 
                            onClick={() => handleUpdateTransactionStatus(t.id, 'paid')}
                            style={{ padding: '6px 12px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            Payer
                          </button>
                          <button onClick={() => { setTransactionToEdit(t); setIsModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '1.1rem' }} title="Modifier">✎</button>
                          <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem' }} title="Supprimer">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* COLONNE DROITE : REVENUS ET HISTORIQUE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* Entrées */}
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                  <div style={{ padding: '20px', background: '#ECFDF5', borderBottom: '1px solid #D1FAE5', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, color: '#065F46' }}>💵 Entrées (Revenus)</h3>
                    <span style={{ fontWeight: 'bold', color: '#065F46' }}>{formatMoney(incomes.reduce((a, b) => a + parseFloat(b.amount), 0))}</span>
                  </div>
                  <div style={{ padding: '10px 20px' }}>
                    {incomes.length === 0 ? <p style={{ color: '#9CA3AF' }}>Aucun revenu pour ce mois.</p> : incomes.map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>{t.description || getCategory(t.category_id).name}</div>
                          {isCombinedView && <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>[{t.entity}]</div>}
                          {t.status === 'pending' && <span style={{ fontSize: '0.75rem', background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: '4px' }}>En attente</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <span style={{ fontWeight: 'bold', color: '#10B981' }}>+{formatMoney(t.amount)}</span>
                          <button onClick={() => { setTransactionToEdit(t); setIsModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '1.1rem' }} title="Modifier">✎</button>
                          <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem' }} title="Supprimer">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Historique des paiements complétés (Sporadiques) */}
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', overflow: 'hidden', opacity: 0.8 }}>
                  <div style={{ padding: '15px 20px', borderBottom: '1px solid #F3F4F6' }}>
                    <h3 style={{ margin: 0, color: '#6B7280', fontSize: '1rem' }}>✅ Achats complétés ce mois-ci</h3>
                  </div>
                  <div style={{ padding: '10px 20px', maxHeight: '200px', overflowY: 'auto' }}>
                    {sporadicExpenses.filter(e => e.status === 'paid').length === 0 ? <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Aucun historique.</p> : 
                    sporadicExpenses.filter(e => e.status === 'paid').map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                        <div style={{ fontSize: '0.9rem', color: '#6B7280', textDecoration: 'line-through' }}>
                          {isCombinedView && `[${t.entity}] `}{t.description || getCategory(t.category_id).name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>{formatMoney(t.amount)}</span>
                          <button onClick={() => { setTransactionToEdit(t); setIsModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '1.1rem' }} title="Modifier">✎</button>
                          <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem' }} title="Supprimer">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setTransactionToEdit(null); }} 
        onAdd={handleAddTransaction}
        onUpdate={handleEditTransaction}
        categories={categories}
        currentPin={pin}
        selectedMonth={currentMonth}
        selectedYear={currentYear}
        initialData={transactionToEdit}
      />
    </FinanceLock>
  );
}
