'use client';

import { useState, useEffect } from 'react';
import FinanceLock from './components/FinanceLock';
import AddTransactionModal from './components/AddTransactionModal';

export default function FinancesPage() {
  const [pin, setPin] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [balances, setBalances] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const accounts = ['Vue Combinée', 'À Payer', 'À Commander', 'Entreprise', 'Perso', 'Conjoint', 'Impôts et taxes', 'Urgence', 'Voyage et mon garçon', 'CELI'];
  const [activeTab, setActiveTab] = useState('Vue Combinée'); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [currentBankBalance, setCurrentBankBalance] = useState('');
  const [isSavingBalance, setIsSavingBalance] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [incomePatterns, setIncomePatterns] = useState([]);

  // Nouveaux états pour l'ajout rapide de commandes
  const [quickAddDesc, setQuickAddDesc] = useState('');
  const [quickAddAmount, setQuickAddAmount] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  
  // Nouveaux états pour le formulaire d'ajout de patron de revenus
  const [newPattern, setNewPattern] = useState({ entity: 'Entreprise', category_id: '', description: '', is_monthly: false, monthly_day: '', monthly_amount: '', 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 0: '' });
  const [editingPatternId, setEditingPatternId] = useState(null);

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
      const [transRes, catRes, fourRes, balRes, patRes] = await Promise.all([
        fetch('/api/admin/finances?action=transactions', { headers: { 'x-finance-pin': currentPin } }),
        fetch('/api/admin/finances?action=categories', { headers: { 'x-finance-pin': currentPin } }),
        fetch('/api/admin/finances?action=fournisseurs', { headers: { 'x-finance-pin': currentPin } }),
        fetch('/api/admin/finances?action=balances', { headers: { 'x-finance-pin': currentPin } }),
        fetch('/api/admin/finances?action=patterns', { headers: { 'x-finance-pin': currentPin } }).catch(() => ({ ok: false }))
      ]);

      if (!transRes.ok || !catRes.ok || !balRes.ok) throw new Error("Erreur de chargement des données principales");

      const transData = await transRes.json();
      const catData = await catRes.json();
      const fourData = fourRes.ok ? await fourRes.json() : { fournisseurs: [] };
      const balData = await balRes.json();
      
      let patData = { patterns: [] };
      if (patRes.ok) {
        try {
          patData = await patRes.json();
        } catch (e) {}
      }

      setTransactions(transData.transactions || []);
      setCategories(catData.categories || []);
      setFournisseurs(fourData.fournisseurs || []);
      setBalances(balData.balances || []);
      setIncomePatterns(patData.patterns || []);
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

  const handleMoveToBudget = async (id) => {
    try {
      const res = await fetch(`/api/admin/finances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-finance-pin': pin },
        body: JSON.stringify({
          action: 'update_transaction',
          data: { id, updates: { priority: 2 } }
        })
      });
      if (!res.ok) throw new Error("Erreur de mise à jour");
      const { transaction } = await res.json();
      setTransactions(transactions.map(t => t.id === id ? transaction : t));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickAddWishlist = async (e) => {
    e.preventDefault();
    if (!quickAddAmount || !quickAddDesc.trim()) return;
    setIsQuickAdding(true);
    
    const expenseCategories = categories.filter(c => c.type === 'expense');
    const defaultCategoryId = expenseCategories.length > 0 ? expenseCategories[0].id : null;

    if (!defaultCategoryId) {
       alert("Erreur: Aucune catégorie de dépense trouvée pour classer la commande.");
       setIsQuickAdding(false);
       return;
    }

    try {
      const res = await fetch('/api/admin/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-finance-pin': pin },
        body: JSON.stringify({
          action: 'add_transaction',
          data: {
            date: new Date().toISOString().split('T')[0],
            type: 'expense',
            entity: 'Entreprise',
            amount: parseFloat(quickAddAmount),
            category_id: defaultCategoryId,
            description: quickAddDesc,
            is_fixed: false,
            status: 'pending',
            priority: 99
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'ajout rapide');
      
      setTransactions([data.transaction, ...transactions]);
      setQuickAddDesc('');
      setQuickAddAmount('');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsQuickAdding(false);
    }
  };

  const handleExecuteTransfer = async (from, to, amount) => {
    try {
      const res = await fetch('/api/admin/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-finance-pin': pin },
        body: JSON.stringify({
          action: 'execute_transfer',
          data: { from, to, amount, date: new Date().toISOString().split('T')[0] }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setTransactions([...data.transactions, ...transactions]);
      alert('Transfert marqué comme fait et enregistré !');
    } catch (err) { alert(err.message); }
  };

  const handleAddPattern = async (e) => {
    e.preventDefault();
    if (!newPattern.category_id) return alert("Veuillez sélectionner une catégorie");
    if (newPattern.is_monthly && (!newPattern.monthly_day || !newPattern.monthly_amount)) return alert("Veuillez remplir le jour et le montant mensuel");
    
    try {
      const isUpdating = !!editingPatternId;
      const res = await fetch('/api/admin/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-finance-pin': pin },
        body: JSON.stringify({
          action: isUpdating ? 'update_pattern' : 'add_pattern',
          data: {
            id: editingPatternId,
            entity: newPattern.entity,
            category_id: newPattern.category_id,
            description: newPattern.description,
            is_monthly: newPattern.is_monthly,
            monthly_day: newPattern.monthly_day ? parseInt(newPattern.monthly_day) : null,
            monthly_amount: newPattern.monthly_amount ? parseFloat(newPattern.monthly_amount) : 0,
            monday_amount: newPattern[1] || 0,
            tuesday_amount: newPattern[2] || 0,
            wednesday_amount: newPattern[3] || 0,
            thursday_amount: newPattern[4] || 0,
            friday_amount: newPattern[5] || 0,
            saturday_amount: newPattern[6] || 0,
            sunday_amount: newPattern[0] || 0
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (isUpdating) {
        setIncomePatterns(incomePatterns.map(p => p.id === editingPatternId ? data.pattern : p));
        setEditingPatternId(null);
      } else {
        setIncomePatterns([...incomePatterns, data.pattern]);
      }
      
      setNewPattern({ entity: 'Entreprise', category_id: '', description: '', is_monthly: false, monthly_day: '', monthly_amount: '', 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 0: '' });
    } catch (err) { alert(err.message); }
  };

  const handleEditClick = (p) => {
    setEditingPatternId(p.id);
    setNewPattern({
      entity: p.entity,
      category_id: p.category_id,
      description: p.description || '',
      is_monthly: p.is_monthly || false,
      monthly_day: p.monthly_day || '',
      monthly_amount: p.monthly_amount || '',
      1: p.monday_amount || '',
      2: p.tuesday_amount || '',
      3: p.wednesday_amount || '',
      4: p.thursday_amount || '',
      5: p.friday_amount || '',
      6: p.saturday_amount || '',
      0: p.sunday_amount || ''
    });
  };

  const handleDeletePattern = async (id) => {
    if (!confirm("Supprimer ce patron de revenus ?")) return;
    try {
      const res = await fetch(`/api/admin/finances?id=${id}&table=finances_income_patterns`, {
        method: 'DELETE',
        headers: { 'x-finance-pin': pin }
      });
      if (!res.ok) throw new Error("Erreur de suppression");
      setIncomePatterns(incomePatterns.filter(p => p.id !== id));
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (String(id).startsWith('ghost-')) {
      if (!confirm("Voulez-vous ARRÊTER DÉFINITIVEMENT cette dépense récurrente à partir de ce mois-ci ? (L'historique des mois précédents sera conservé)")) return;
      
      const ghostId = id.replace('ghost-', '');
      const originalT = transactions.find(t => t.id === parseInt(ghostId) || t.id === ghostId);
      if (!originalT) return;

      try {
        const res = await fetch(`/api/admin/finances`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-finance-pin': pin },
          body: JSON.stringify({
            action: 'add_transaction',
            data: {
              date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
              type: originalT.type,
              entity: originalT.entity,
              amount: 0,
              category_id: originalT.category_id,
              description: originalT.description,
              is_fixed: true,
              status: 'paid',
              priority: 99
            }
          })
        });
        if (!res.ok) throw new Error("Erreur lors de l'arrêt de la récurrence.");
        const { transaction } = await res.json();
        setTransactions([...transactions, transaction]);
      } catch (err) {
        alert(err.message);
      }
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
    if (manualBal) {
      const manualDate = parseDateLocal(manualBal.date);
      let backwardAdjustment = 0;
      
      transactions.forEach(t => {
        const d = parseDateLocal(t.date);
        // Seulement ajuster avec les transactions 'paid', car les 'pending' n'ont pas encore affecté le vrai solde bancaire !
        if (t.entity === acc && d.getMonth() === m && d.getFullYear() === y && d <= manualDate && t.status === 'paid') {
          if (t.type === 'income') backwardAdjustment += parseFloat(t.amount);
          else backwardAdjustment -= parseFloat(t.amount);
        }
      });
      
      return parseFloat(manualBal.amount) - backwardAdjustment;
    }
    
    let prevM = m - 1;
    let prevY = y;
    if (prevM < 0) { prevM = 11; prevY -= 1; }
    if (prevY < 2024) return 0;
    
    return getProjectedEndBalanceForMonth(prevM, prevY, acc);
  };

  const getVirtualIncomesForMonth = (m, y) => {
    let vi = [];
    if (incomePatterns.length === 0) return vi;

    const daysInM = new Date(y, m + 1, 0).getDate();
    const today = new Date();
    const isCurrent = today.getMonth() === m && today.getFullYear() === y;
    const isFuture = y > today.getFullYear() || (y === today.getFullYear() && m > today.getMonth());
    
    let sDay = 1;
    if (isCurrent) sDay = today.getDate();

    // OPTIMISATION CRITIQUE : Pré-filtrer et parser les dates des revenus pour ce mois précis
    // Cela évite de faire des millions de Date parsing dans la boucle interne.
    const monthIncomes = transactions
      .filter(t => t.type === 'income')
      .map(t => {
        const d = parseDateLocal(t.date);
        return { ...t, pMonth: d.getMonth(), pYear: d.getFullYear(), pDay: d.getDate() };
      })
      .filter(t => t.pMonth === m && t.pYear === y);

    for (let day = sDay; day <= daysInM; day++) {
      const d = new Date(y, m, day);
      const dayOfWeek = d.getDay();
      
      const dayMapping = {
        1: 'monday_amount',
        2: 'tuesday_amount',
        3: 'wednesday_amount',
        4: 'thursday_amount',
        5: 'friday_amount',
        6: 'saturday_amount',
        0: 'sunday_amount'
      };
      const column = dayMapping[dayOfWeek];

      incomePatterns.forEach(pattern => {
        let projectedAmount = 0;
        
        if (pattern.is_monthly) {
          if (day === parseInt(pattern.monthly_day)) {
            projectedAmount = parseFloat(pattern.monthly_amount) || 0;
          }
        } else {
          projectedAmount = parseFloat(pattern[column]) || 0;
        }

        if (projectedAmount > 0) {
          const hasRealIncomeNearby = monthIncomes.some(t => 
            t.entity === pattern.entity && 
            (t.description === (pattern.description || 'Revenu simulé') || (!pattern.category_id || t.category_id === pattern.category_id)) &&
            Math.abs(t.pDay - day) <= 3
          );
          
          if (!hasRealIncomeNearby) {
            vi.push({
              id: `sim-${pattern.id}-${m}-${day}`,
              date: `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
              type: 'income',
              amount: projectedAmount,
              category_id: pattern.category_id,
              entity: pattern.entity,
              description: pattern.description || 'Revenu simulé',
              status: 'pending',
              is_ghost: true,
              is_simulation: true
            });
          }
        }
      });
    }
    return vi;
  };

  const virtualIncomes = getVirtualIncomesForMonth(currentMonth, currentYear);

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
    
    const getManualDateFor = (account, mm, yy) => {
      const manualBal = balances.find(b => {
        const d = parseDateLocal(b.date);
        return b.account === account && d.getMonth() === mm && d.getFullYear() === yy;
      });
      return manualBal ? parseDateLocal(manualBal.date) : new Date(yy, mm, 1);
    };

    let manualDate = new Date(y, m, 1);
    if (acc === 'Vue Combinée') {
      const d1 = getManualDateFor('Entreprise', m, y);
      const d2 = getManualDateFor('Perso', m, y);
      const d3 = getManualDateFor('Conjoint', m, y);
      manualDate = new Date(Math.max(d1, d2, d3));
    } else {
      manualDate = getManualDateFor(acc, m, y);
    }
    
    const ghosts = Array.from(ghostMap.values())
      .filter(t => t.priority !== 99)
      .flatMap(t => {
        const cat = getCategory(t.category_id);
        const catName = (cat ? cat.name : '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const isVariableDate = Number(t.priority) === 3 || Number(t.priority) === 4 || 
                               catName.includes('épicerie') || catName.includes('epicerie') || 
                               catName.includes('animaux') || catName.includes('essence') ||
                               catName.includes('pharmacie') ||
                               desc.includes('épicerie') || desc.includes('epicerie') || desc.includes('animaux');

        if (isVariableDate) {
          const weeklyAmount = (parseFloat(t.amount) / 4).toFixed(2);
          return [7, 14, 21, 28].map(day => ({
            date: `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            amount: weeklyAmount
          }));
        }
        return [{
          date: `${y}-${String(m + 1).padStart(2, '0')}-01`,
          amount: t.amount
        }];
      });

    const ghostSum = ghosts
      .filter(g => parseDateLocal(g.date) > manualDate)
      .reduce((a, g) => a + parseFloat(g.amount), 0);
      
    const simSum = getVirtualIncomesForMonth(m, y)
      .filter(t => (acc === 'Vue Combinée' ? true : t.entity === acc))
      .filter(t => parseDateLocal(t.date) > manualDate)
      .reduce((a, t) => a + parseFloat(t.amount), 0);
    
    return startBal + incs - exps - ghostSum + simSum;
  };

  const getLiveBalanceForAccount = (m, y, acc) => {
    const startBal = getCalculatedStartBalance(m, y, acc);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const paidTxs = transactions.filter(t => 
      t.entity === acc && 
      t.status === 'paid' &&
      parseDateLocal(t.date).getMonth() === m && 
      parseDateLocal(t.date).getFullYear() === y &&
      parseDateLocal(t.date) <= today
    );
    
    let sum = startBal;
    paidTxs.forEach(t => {
      if (t.type === 'income') sum += parseFloat(t.amount);
      else sum -= parseFloat(t.amount);
    });
    return sum;
  };


  // Transfer Recommendation Algorithm (Centralization)
  const getTotalMondaysAndThursdays = (viewMonth, viewYear) => {
    let daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    let count = 0;
    
    // Count ALL Mondays and Thursdays in the month to establish a standard 'cruising' target amount
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 1 || dayOfWeek === 4) count++;
    }
    
    return count > 0 ? count : 1;
  };

  const getTransferRecommendations = () => {
    const recommendations = [];
    let totalTransferred = 0;
    
    const divisor = getTotalMondaysAndThursdays(currentMonth, currentYear);

    // Accounts that generate surplus to be transferred to Entreprise
    const otherAccounts = ['Conjoint', 'Perso'];
    
    for (const acc of otherAccounts) {
      const madeTransfers = transactions.filter(t => 
        t.entity === acc && 
        t.type === 'expense' && 
        t.description?.toLowerCase().includes('transfert vers entreprise') &&
        parseDateLocal(t.date).getMonth() === currentMonth &&
        parseDateLocal(t.date).getFullYear() === currentYear
      );
      const totalTransferredAlready = madeTransfers.reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const accSurplus = getProjectedEndBalanceForMonth(currentMonth, currentYear, acc);
      const grossSurplus = accSurplus + totalTransferredAlready;

      if (grossSurplus > 0) {
        const amountPerTransfer = grossSurplus / divisor;
        let completedCount = madeTransfers.length;
        // S'assurer qu'on ne dépasse pas le nombre de coches
        if (completedCount > divisor) completedCount = divisor;

        recommendations.push({
          from: acc,
          to: 'Entreprise',
          amount: amountPerTransfer,
          totalAmount: grossSurplus,
          completedCount,
          totalCount: divisor,
          frequencyText: divisor > 1 ? `(cible bi-hebdomadaire, ${divisor}x par mois)` : `(immédiatement)`
        });
        totalTransferred += accSurplus; // Seul le vrai surplus actuel compte pour sauver l'entreprise
      }
    }
    
    // Calculate if Entreprise is still in deficit after these transfers
    const entBalance = getProjectedEndBalanceForMonth(currentMonth, currentYear, 'Entreprise');
    const remainingDeficit = (entBalance + totalTransferred) < 0 ? Math.abs(entBalance + totalTransferred) : 0;
    
    // Return recommendations and if Entreprise is fully covered
    if (recommendations.length === 0 && entBalance >= 0) return null; // Nothing to do

    return { recommendations, fullyCovered: remainingDeficit === 0, remainingDeficit };
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

  const ghostExpenses = Array.from(latestFixedMap.values())
    .filter(t => t.priority !== 99)
    .flatMap(t => {
      // Identifier si la dépense est à date variable (soit par priorité, soit par mot-clé)
      const cat = getCategory(t.category_id);
      const catName = (cat ? cat.name : '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      
      const isVariableDate = Number(t.priority) === 3 || Number(t.priority) === 4 || 
                             catName.includes('épicerie') || catName.includes('epicerie') || 
                             catName.includes('animaux') || catName.includes('essence') ||
                             catName.includes('pharmacie') ||
                             desc.includes('épicerie') || desc.includes('epicerie') || desc.includes('animaux');

      // Pour les dépenses variables, on les divise en 4 semaines pour ne pas plomber le solde le jour 1
      if (isVariableDate) {
        const weeklyAmount = (parseFloat(t.amount) / 4).toFixed(2);
        return [7, 14, 21, 28].map((day, idx) => ({
          ...t,
          id: `ghost-${t.id}-${idx}`,
          status: 'pending',
          amount: weeklyAmount,
          date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          is_ghost: true
        }));
      }

      // Pour les dépenses fixes normales, on les place le jour 1 par défaut, ou à leur jour habituel si on le connaissait (ici on force le 1 pour l'instant)
      return [{
        ...t,
        id: `ghost-${t.id}`,
        status: 'pending',
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
        is_ghost: true
      }];
    });

  const currentMonthTransactions = [...baseCurrentMonthTransactions, ...ghostExpenses, ...virtualIncomes];

  let accountTransactions = currentMonthTransactions.filter(t => t.priority !== 99);
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

  // --- CHRONOLOGIE DU SOLDE ---
  const getManualBalanceDate = (acc) => {
    const manualBal = balances.find(b => {
      const d = parseDateLocal(b.date);
      return b.account === acc && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    return manualBal ? parseDateLocal(manualBal.date) : new Date(currentYear, currentMonth, 1);
  };

  let timelineStartBalance = 0;
  let manualDateCombined = new Date(currentYear, currentMonth, 1);
  
  if (isCombinedView) {
    timelineStartBalance = getCalculatedStartBalance(currentMonth, currentYear, 'Entreprise') +
                           getCalculatedStartBalance(currentMonth, currentYear, 'Perso') +
                           getCalculatedStartBalance(currentMonth, currentYear, 'Conjoint');
    // On prend la date la plus récente parmi les soldes manuels
    const d1 = getManualBalanceDate('Entreprise');
    const d2 = getManualBalanceDate('Perso');
    const d3 = getManualBalanceDate('Conjoint');
    manualDateCombined = new Date(Math.max(d1, d2, d3));
  } else {
    timelineStartBalance = getCalculatedStartBalance(currentMonth, currentYear, activeTab);
    manualDateCombined = getManualBalanceDate(activeTab);
  }

  // Filtrer les fantômes et simulations qui sont passés par rapport au solde manuel
  const filteredAccountTransactions = accountTransactions.filter(t => {
    if (t.is_ghost || t.is_simulation) {
      return parseDateLocal(t.date) > manualDateCombined;
    }
    return true;
  });

  const sortedTransactions = [...filteredAccountTransactions].sort((a, b) => {
    const da = parseDateLocal(a.date);
    const db = parseDateLocal(b.date);
    if (da.getTime() !== db.getTime()) {
      return da.getTime() - db.getTime();
    }
    if (a.type !== b.type) {
      return a.type === 'income' ? -1 : 1;
    }
    return 0;
  });

  const timelineEvents = [];
  let runningBal = timelineStartBalance;
  
  sortedTransactions.forEach(t => {
    const amt = parseFloat(t.amount);
    if (t.type === 'income') {
      runningBal += amt;
    } else {
      runningBal -= amt;
    }
    timelineEvents.push({
      ...t,
      runningBalance: runningBal
    });
  });

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

  // --- LE CONSEILLER FINANCIER (L'Algorithme CFO) ---
  
  // 1. Analyse Entreprise (Inclus les revenus virtuels/simulés)
  const realEntrepriseIncomes = transactions.filter(t => t.entity === 'Entreprise' && t.type === 'income' && parseDateLocal(t.date).getMonth() === currentMonth && parseDateLocal(t.date).getFullYear() === currentYear).reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const virtualEntrepriseIncomes = virtualIncomes.filter(t => t.entity === 'Entreprise').reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const entrepriseIncomes = realEntrepriseIncomes + virtualEntrepriseIncomes;
  
  const entrepriseTaxProvision = entrepriseIncomes * 0.15; // 15% provision pour Taxes/TPS/TVQ

  // Simulation isolée de l'Entreprise pour trouver le "Extra" sécuritaire
  const entrepriseStartBal = getCalculatedStartBalance(currentMonth, currentYear, 'Entreprise');
  let entRunningBal = entrepriseStartBal;
  let entMinBal = entrepriseStartBal;
  
  const entTransactions = currentMonthTransactions.filter(t => t.entity === 'Entreprise' && t.priority !== 99);
  const entSorted = [...entTransactions].sort((a, b) => {
    const dA = parseDateLocal(a.date).getTime();
    const dB = parseDateLocal(b.date).getTime();
    if (dA === dB) {
      if (a.is_fixed && !b.is_fixed) return -1;
      if (!a.is_fixed && b.is_fixed) return 1;
      return 0;
    }
    return dA - dB;
  });

  entSorted.forEach(t => {
    const amt = parseFloat(t.amount);
    if (t.type === 'income') entRunningBal += amt;
    else if (t.type === 'expense') entRunningBal -= amt;
    if (entRunningBal < entMinBal) entMinBal = entRunningBal;
  });

  const entrepriseExtra = entMinBal;

  // --- NOUVEAU : Calcul du profit et de la marge pour l'Entreprise ---
  const allEntIncomes = entSorted.filter(t => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const allEntExpenses = entSorted.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount), 0);
  
  const profitNet = allEntIncomes - allEntExpenses;
  const profitMargin = allEntIncomes > 0 ? (profitNet / allEntIncomes) * 100 : 0;
  
  let marginColor = '#475569';
  let marginMessage = '';
  let marginIcon = '';
  if (profitMargin >= 20) {
    marginColor = '#059669'; // Vert
    marginIcon = '🚀';
    marginMessage = 'Excellent ! L\'entreprise est très rentable. Vos revenus surpassent largement vos dépenses.';
  } else if (profitMargin >= 10) {
    marginColor = '#10B981'; // Vert clair
    marginIcon = '✅';
    marginMessage = 'Bonne rentabilité. L\'entreprise est saine et dégage un profit convenable.';
  } else if (profitMargin >= 0) {
    marginColor = '#F59E0B'; // Orange
    marginIcon = '⚠️';
    marginMessage = 'Viabilité fragile. La marge est très mince. Attention à vos prochaines dépenses !';
  } else {
    marginColor = '#DC2626'; // Rouge
    marginIcon = '🚨';
    marginMessage = 'Déficit ! Trop de dépenses ou pas assez de revenus ce mois-ci. L\'entreprise perd de l\'argent.';
  }
  
  // 2. Provisions (Basé sur vos objectifs Personnels)
  const persoIncomes = transactions.filter(t => t.entity === 'Perso' && t.type === 'income' && parseDateLocal(t.date).getMonth() === currentMonth && parseDateLocal(t.date).getFullYear() === currentYear).reduce((acc, t) => acc + parseFloat(t.amount), 0);
  
  const taxProvision = persoIncomes * 0.25; // 25% Impôts personnels (si applicable)
  const emergencyProvision = persoIncomes * 0.15; // 10% Urgence + 5% Imprévus
  const voyageProvision = persoIncomes * 0.12; // 7% Voyage + 5% Jacob
  const celiProvision = persoIncomes * 0.08; // 8% CELI

  // --- GRAND TOTAL (Valeur Nette) ---
  const grandTotalCurrent = accounts.filter(a => a !== 'Vue Combinée').reduce((sum, acc) => sum + getLiveBalanceForAccount(currentMonth, currentYear, acc), 0);
  const grandTotalProjected = accounts.filter(a => a !== 'Vue Combinée' && a !== 'CELI').reduce((sum, acc) => sum + getProjectedEndBalanceForMonth(currentMonth, currentYear, acc), 0) + getProjectedEndBalanceForMonth(currentMonth, currentYear, 'CELI');
  
  return (
    <FinanceLock onUnlock={handleUnlock}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-sans)', paddingBottom: '50px' }}>
        
        {/* EN-TÊTE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', color: '#2C1810', margin: '0 0 5px 0' }}>📊 Gestion Budgétaire</h1>
            <div style={{ color: '#059669', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px' }}>
              Aujourd'hui : <span style={{ textTransform: 'capitalize' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
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
                background: activeTab === tab ? (tab === 'Vue Combinée' ? '#4F46E5' : (tab === 'À Payer' ? '#DC2626' : (tab === 'À Commander' ? '#D97706' : '#2C1810'))) : '#F3F4F6',
                color: activeTab === tab ? 'white' : '#6B7280',
                transition: 'all 0.2s',
                boxShadow: activeTab === tab ? '0 4px 10px rgba(0,0,0,0.15)' : 'none'
              }}
            >
              {tab === 'Vue Combinée' ? '🌐 ' + tab : (tab === 'À Payer' ? '🛒 ' + tab : (tab === 'À Commander' ? '📝 ' + tab : tab))}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>Chargement...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {activeTab === 'À Payer' || activeTab === 'À Commander' ? (() => {
              const isWishlist = activeTab === 'À Commander';
              const actualPending = transactions.filter(t => t.type === 'expense' && t.status === 'pending' && (isWishlist ? t.priority == 99 : t.priority != 99) && !t.is_ghost && !t.is_simulation);
              const ghostPending = currentMonthTransactions.filter(t => t.is_ghost && t.type === 'expense' && t.status === 'pending' && (isWishlist ? t.priority == 99 : t.priority != 99));
              
              const allPendingMap = new Map();
              [...actualPending, ...ghostPending].forEach(t => {
                // Pour éviter des conflits d'IDs entre les vraies et les fantômes
                const key = t.is_ghost ? t.id : `real-${t.id}`;
                if (!allPendingMap.has(key)) allPendingMap.set(key, t);
              });
              
              const allPending = Array.from(allPendingMap.values());
              const totalPending = allPending.reduce((sum, t) => sum + parseFloat(t.amount), 0);
              
              const grouped = {};
              allPending.forEach(t => {
                if (!grouped[t.entity]) grouped[t.entity] = [];
                grouped[t.entity].push(t);
              });

              return (
                <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #E5E7EB' }}>
                  <h2 style={{ margin: '0 0 20px 0', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isWishlist ? '📝 Commandes à faire (Wishlist)' : '🛒 Factures et Commandes à Payer'}
                  </h2>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '250px', background: isWishlist ? '#FFFBEB' : '#FEF2F2', padding: '20px', borderRadius: '12px', border: `1px solid ${isWishlist ? '#FEF3C7' : '#FEE2E2'}` }}>
                      <p style={{ margin: '0 0 5px 0', color: isWishlist ? '#92400E' : '#991B1B', fontSize: '1.1rem' }}>{isWishlist ? 'Total Global à Commander :' : 'Total Global à Payer :'}</p>
                      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: isWishlist ? '#D97706' : '#DC2626' }}>{formatMoney(totalPending)}</div>
                    </div>
                    
                    {isWishlist && (
                      <div style={{ flex: '2', minWidth: '300px', background: '#F9FAFB', padding: '15px', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <p style={{ margin: '0 0 10px 0', color: '#4B5563', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          Impact au 1er du mois prochain (Dépenses + Commandes) :
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {['Entreprise', 'Perso', 'Conjoint'].map(acc => {
                            const projected = getProjectedEndBalanceForMonth(currentMonth, currentYear, acc);
                            return (
                              <div key={acc} style={{ flex: '1', minWidth: '90px', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '2px', fontWeight: 'bold' }}>{acc}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: projected >= 0 ? '#10B981' : '#EF4444' }}>
                                  {formatMoney(projected)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {isWishlist && (
                    <form onSubmit={handleQuickAddWishlist} style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '2px solid #D97706', marginBottom: '30px', display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ flex: '2', minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#4B5563', marginBottom: '5px' }}>Quoi commander ? (Fournisseur / Article)</label>
                        <input 
                          type="text" 
                          value={quickAddDesc}
                          onChange={(e) => setQuickAddDesc(e.target.value)}
                          placeholder="Ex: Tasses, Lait d'avoine, Fournisseur X..."
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                          required
                        />
                      </div>
                      <div style={{ flex: '1', minWidth: '120px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#4B5563', marginBottom: '5px' }}>Montant estimé ($)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          value={quickAddAmount}
                          onChange={(e) => setQuickAddAmount(e.target.value)}
                          placeholder="0.00"
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '1.1rem' }}
                          required
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isQuickAdding}
                        style={{ padding: '10px 20px', background: '#D97706', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', height: '42px', whiteSpace: 'nowrap' }}
                      >
                        {isQuickAdding ? 'Ajout...' : '+ Ajouter'}
                      </button>
                    </form>
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                    {Object.keys(grouped).sort().map(entity => {
                      const entityItems = grouped[entity].sort((a,b) => parseDateLocal(a.date) - parseDateLocal(b.date));
                      const entityTotal = entityItems.reduce((sum, t) => sum + parseFloat(t.amount), 0);
                      return (
                        <div key={entity} style={{ background: '#F9FAFB', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #E5E7EB', paddingBottom: '10px' }}>
                            <h3 style={{ margin: 0, color: '#374151' }}>{entity}</h3>
                            <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#DC2626' }}>{formatMoney(entityTotal)}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {entityItems.map(t => (
                              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'white', borderRadius: '8px', border: '1px solid #F3F4F6' }}>
                                <div>
                                  <div style={{ fontWeight: 'bold', color: '#111827' }}>
                                    {t.is_ghost && <span title="Projeté automatiquement" style={{marginRight: '5px'}}>👻</span>}
                                    {t.description || getCategory(t.category_id)?.name || 'Inconnue'}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                                    {getCategory(t.category_id)?.name || 'Inconnue'} • {t.is_fixed ? 'Fixe' : 'Sporadique'}
                                    <span style={{ marginLeft: '5px', background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>
                                      📅 {String(parseDateLocal(t.date).getDate()).padStart(2, '0')} {parseDateLocal(t.date).toLocaleString('fr-FR', { month: 'short' })}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontWeight: 'bold', color: '#EF4444' }}>{formatMoney(t.amount)}</span>
                                  {isWishlist ? (
                                    <button 
                                      onClick={() => {
                                        if(confirm("C'est commandé ! Transférer cette commande dans le budget 'À Payer' pour la projection financière ?")) {
                                          handleMoveToBudget(t.id);
                                        }
                                      }}
                                      style={{ padding: '6px 12px', background: '#F59E0B', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                      ✅ Commandé !
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => handleUpdateTransactionStatus(t.id, 'paid')}
                                      style={{ padding: '6px 12px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                      Payer
                                    </button>
                                  )}
                                  <button onClick={() => { setTransactionToEdit(t); setIsModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '1.1rem' }} title="Modifier">✎</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(grouped).length === 0 && (
                       <div style={{ color: '#6B7280', padding: '20px', fontStyle: 'italic' }}>
                         {isWishlist ? 'Aucune commande prévue.' : 'Aucune facture à payer pour ce mois.'}
                       </div>
                    )}
                  </div>
                </div>
              );
            })() : (
              <>
            {/* RÉCONCILIATION ET PROJECTION */}
            <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                
                {/* Solde Actuel */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #E5E7EB' }}>
                  <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isCombinedView ? '💰 Soldes Actuels' : '💰 Point sur le compte'}
                  </h3>
                  {isCombinedView ? (() => {
                    // Calcul du solde combiné en direct pour AUJOURD'HUI
                    const liveCombinedBalance = getLiveBalanceForAccount(currentMonth, currentYear, 'Entreprise') +
                                                getLiveBalanceForAccount(currentMonth, currentYear, 'Perso') +
                                                getLiveBalanceForAccount(currentMonth, currentYear, 'Conjoint');

                    return (
                      <>
                        <div style={{ background: '#F3F4F6', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
                          <p style={{ margin: '0 0 5px 0', color: '#6B7280', fontSize: '0.9rem' }}>Somme des soldes estimés aujourd'hui (Ent. + Perso + Conj.)</p>
                          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{formatMoney(liveCombinedBalance)}</div>
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

                    // Calcul du solde en direct pour AUJOURD'HUI
                    const liveBalance = getLiveBalanceForAccount(currentMonth, currentYear, activeTab);

                    return (
                      <>
                        <p style={{ color: '#6B7280', margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                          {isRollover ? <span style={{color: '#3B82F6', fontWeight: 'bold'}}>🪄 Solde (Reporté du mois précédent) :</span> : `🏦 Votre solde estimé aujourd'hui :`}
                        </p>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#111827', marginBottom: '5px' }}>
                          {formatMoney(isRollover ? currentBalance : liveBalance)}
                        </div>
                        {currentBankBalanceObj && (
                          <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#059669', fontWeight: '500' }}>
                            📝 (Dernier solde réel validé le {String(parseDateLocal(currentBankBalanceObj.date).getDate()).padStart(2, '0')} : {formatMoney(currentBankBalanceObj.amount)})
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={currentBankBalance} 
                            onChange={(e) => setCurrentBankBalance(e.target.value.replace(',', '.'))}
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

                  {/* Recommandations de Transferts (Visible if surplus exists or deficit in Entreprise) */}
                  {(activeTab === 'Entreprise' || isCombinedView) && (() => {
                    const recsData = getTransferRecommendations();
                    if (!recsData || (recsData.recommendations.length === 0 && recsData.fullyCovered)) return null;
                    
                    return (
                      <div style={{ background: '#EFF6FF', padding: '15px', borderRadius: '12px', border: '1px solid #BFDBFE', marginTop: '15px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem' }}>
                          💡 Centralisation des Fonds
                        </h4>
                        <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#1E40AF' }}>
                          Il est recommandé de consolider vos surplus vers l'Entreprise pour couvrir vos opérations et fournisseurs :
                          <br/><br/>
                          <em>📅 <strong>Fréquence calculée :</strong> L'algorithme a divisé vos surplus mensuels par le nombre total de lundis et jeudis du mois pour vous donner un "rythme de croisière" régulier.</em>
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#1E3A8A', fontSize: '0.9rem', listStyle: 'none', marginLeft: '-20px' }}>
                          {recsData.recommendations.length > 0 ? recsData.recommendations.map((r, i) => (
                            <li key={i} style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #BFDBFE', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                              <div style={{ marginBottom: '10px' }}>
                                Transférer <strong>{formatMoney(r.amount)}</strong> de <strong>{r.from}</strong> vers Entreprise <em style={{color: '#6B7280'}}>{r.frequencyText}</em>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {Array.from({ length: r.totalCount }).map((_, idx) => {
                                  const isDone = idx < r.completedCount;
                                  return (
                                    <button 
                                      key={idx}
                                      onClick={() => {
                                        if (!isDone) {
                                          if(confirm(`Voulez-vous vraiment enregistrer un transfert de ${formatMoney(r.amount)} de ${r.from} vers Entreprise pour cocher cette case ?`)) {
                                            handleExecuteTransfer(r.from, r.to, r.amount);
                                          }
                                        }
                                      }}
                                      disabled={isDone}
                                      style={{ 
                                        background: isDone ? '#10B981' : '#F3F4F6', 
                                        color: isDone ? 'white' : '#9CA3AF', 
                                        border: isDone ? 'none' : '1px solid #D1D5DB', 
                                        borderRadius: '50%', 
                                        width: '28px', 
                                        height: '28px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        cursor: isDone ? 'default' : 'pointer', 
                                        padding: 0,
                                        transition: 'all 0.2s',
                                        boxShadow: isDone ? 'none' : 'inset 0 2px 4px rgba(0,0,0,0.05)'
                                      }}
                                      title={isDone ? "Déjà fait" : "Cocher pour effectuer ce transfert"}
                                    >
                                      ✓
                                    </button>
                                  );
                                })}
                              </div>
                            </li>
                          )) : (
                            <li style={{ marginBottom: '5px', color: '#991B1B' }}>Aucun surplus disponible dans vos comptes Perso/Conjoint.</li>
                          )}
                        </ul>
                        {!recsData.fullyCovered && (
                          <p style={{ margin: '10px 0 0 0', fontSize: '0.8rem', color: '#991B1B' }}>
                            ⚠️ Même avec ces transferts (si disponibles), l'Entreprise sera en déficit de {formatMoney(recsData.remainingDeficit)}.
                          </p>
                        )}
                        {recsData.fullyCovered && recsData.recommendations.length > 0 && (
                          <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', color: '#065F46' }}>
                            ✅ L'entreprise aura assez de liquidités pour toutes ses dépenses. Le solde restant pourra être utilisé pour l'épargne.
                          </p>
                        )}
                      </div>
                    );
                  })()}

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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                              {formatMoney(s.amount)}
                            </div>
                            <button 
                              onClick={() => handleExecuteTransfer(s.from, s.to, s.amount)}
                              style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: 0 }}
                              title="Marquer comme fait (Transférer l'argent maintenant)"
                            >
                              ✓
                            </button>
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
                    🧐 L'Assistant Financier (Le Cerveau)
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    
                    {/* Algorithme CFO Entreprise */}
                    <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#0F172A' }}>🏢 Trésorerie Entreprise</h4>
                      <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#475569' }}>
                        Basé sur vos ventes réelles et virtuelles ({formatMoney(entrepriseIncomes)}) et toutes vos dépenses futures.
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#1E293B', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <li>
                          <strong>Taxes à provisionner (15%) :</strong> <span style={{ color: '#DC2626' }}>{formatMoney(entrepriseTaxProvision)}</span>
                        </li>
                        <li>
                          <strong>Liquidité Extra (Surplus garanti) :</strong> 
                          <span style={{ color: entrepriseExtra > 0 ? '#059669' : '#DC2626', fontWeight: 'bold', marginLeft: '5px' }}>
                            {formatMoney(entrepriseExtra)}
                          </span>
                        </li>
                      </ul>
                      
                      <div style={{ marginTop: '15px', padding: '12px', background: 'white', borderRadius: '8px', border: `1px solid ${marginColor}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <h5 style={{ margin: 0, color: marginColor }}>{marginIcon} Marge de Profit Nette</h5>
                          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: marginColor }}>{profitMargin.toFixed(1)}%</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
                          {marginMessage}
                        </p>
                      </div>
                      
                      <div style={{ marginTop: '15px', padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                        <h5 style={{ margin: '0 0 8px 0', color: '#334155' }}>🤖 Recommandation :</h5>
                        {entrepriseExtra > 0 ? (
                          entrepriseExtra >= entrepriseTaxProvision ? (
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#059669' }}>
                              ✅ Transférez <strong>{formatMoney(entrepriseTaxProvision)}</strong> vers "Impôts et taxes". Il vous restera ensuite <strong>{formatMoney(entrepriseExtra - entrepriseTaxProvision)}</strong> de profit pur que vous pouvez virer vers "Perso" !
                            </p>
                          ) : (
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#D97706' }}>
                              ⚠️ Vous avez un léger surplus ({formatMoney(entrepriseExtra)}), mais il ne couvre pas complètement vos obligations de taxes ({formatMoney(entrepriseTaxProvision)}). Transférez le maximum possible ({formatMoney(entrepriseExtra)}) vers "Impôts et taxes". Ne virez rien dans Perso !
                            </p>
                          )
                        ) : (
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#DC2626' }}>
                            🚨 DANGER ! La trésorerie de l'entreprise va tomber en déficit de <strong>{formatMoney(Math.abs(entrepriseExtra))}</strong>. NE FAITES AUCUN TRANSFERT. Laissez l'argent dans l'entreprise pour couvrir les factures !
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Provisions Automatiques Perso */}
                    <div style={{ background: '#FFFBEB', padding: '20px', borderRadius: '12px', border: '1px solid #FEF3C7' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#92400E' }}>🏦 Épargne & Budget Perso</h4>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#B45309' }}>
                        Basé sur les revenus transférés dans Perso ({formatMoney(persoIncomes)}) :
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400E', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li><strong>Impôts pers. (25%) :</strong> {formatMoney(taxProvision)}</li>
                        <li><strong>Urgence/Imprévus (15%) :</strong> {formatMoney(emergencyProvision)}</li>
                        <li><strong>Voyage/Jacob (12%) :</strong> {formatMoney(voyageProvision)}</li>
                        <li><strong>CELI (8%) :</strong> {formatMoney(celiProvision)}</li>
                      </ul>
                      <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', color: '#D97706', fontStyle: 'italic' }}>
                        📅 <strong>Astuce :</strong> Virez ces montants vers leurs comptes respectifs 2x par semaine (le lundi et le jeudi) pour suivre votre plan d'épargne !
                      </p>
                    </div>

                    {/* NEW SECTION: Bilan du Mois (Conjoint & Perso) */}
                    {(() => {
                      const bilanAccounts = [
                        { name: 'Conjoint', budget: 1935 },
                        { name: 'Perso', budget: 1455 }
                      ];

                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', gridColumn: '1 / -1', marginTop: '10px' }}>
                          {bilanAccounts.map(acc => {
                            const realIncomes = transactions
                              .filter(t => t.entity === acc.name && t.type === 'income' && !t.is_ghost && !t.is_simulation && parseDateLocal(t.date).getMonth() === currentMonth && parseDateLocal(t.date).getFullYear() === currentYear)
                              .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
                            const diff = realIncomes - acc.budget;

                            // Prévision du 1er du mois prochain
                            const endOfMonthBal = getProjectedEndBalanceForMonth(currentMonth, currentYear, acc.name);
                            
                            const uniqueFixed = new Map();
                            transactions.filter(t => t.entity === acc.name && t.type === 'expense' && t.is_fixed && !t.is_ghost && !t.is_simulation)
                              .forEach(t => {
                                 if (!uniqueFixed.has(t.description) || parseDateLocal(t.date) > parseDateLocal(uniqueFixed.get(t.description).date)) {
                                     uniqueFixed.set(t.description, t);
                                 }
                              });
                              
                            const firstDayExpenses = Array.from(uniqueFixed.values())
                              .filter(t => parseDateLocal(t.date).getDate() === 1 || Number(t.priority) === 1)
                              .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
                            
                            const deficit1er = endOfMonthBal - firstDayExpenses;

                            return (
                              <div key={acc.name} style={{ background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  📊 Bilan & Prévisions ({acc.name})
                                </h4>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                  {/* Bilan */}
                                  <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                    <h5 style={{ margin: '0 0 10px 0', color: '#334155' }}>💰 Respect du Budget</h5>
                                    <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#475569' }}>
                                      Dépôts réels : <strong>{formatMoney(realIncomes)}</strong>
                                    </p>
                                    <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#475569' }}>
                                      Objectif théorique : <strong>{formatMoney(acc.budget)}</strong>
                                    </p>
                                    <div style={{ padding: '10px', background: diff >= 0 ? '#ECFDF5' : '#FEF2F2', borderRadius: '8px', border: `1px solid ${diff >= 0 ? '#10B981' : '#EF4444'}`, marginTop: '10px' }}>
                                      <p style={{ margin: 0, fontSize: '0.85rem', color: diff >= 0 ? '#065F46' : '#991B1B' }}>
                                        {diff >= 0 
                                          ? `✅ Vous avez déposé ${formatMoney(diff)} de plus que votre budget !` 
                                          : `⚠️ Vous êtes sous le budget de ${formatMoney(Math.abs(diff))}. (Payé de votre poche/surplus)`}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Prévisions 1er du mois */}
                                  <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                    <h5 style={{ margin: '0 0 10px 0', color: '#334155' }}>🔮 Le 1er du mois prochain</h5>
                                    <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#475569' }}>
                                      Solde projeté (le 31) : <strong>{formatMoney(endOfMonthBal)}</strong>
                                    </p>
                                    <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#475569' }}>
                                      Factures du 1er : <strong>{formatMoney(firstDayExpenses)}</strong>
                                    </p>
                                    <div style={{ padding: '10px', background: deficit1er >= 0 ? '#ECFDF5' : '#FFFBEB', borderRadius: '8px', border: `1px solid ${deficit1er >= 0 ? '#10B981' : '#F59E0B'}`, marginTop: '10px' }}>
                                      <p style={{ margin: 0, fontSize: '0.85rem', color: deficit1er >= 0 ? '#065F46' : '#92400E' }}>
                                        {deficit1er >= 0 
                                          ? `✅ Factures du 1er sécurisées.` 
                                          : `🚨 Il vous manquera ${formatMoney(Math.abs(deficit1er))} le 1er. Faites un virement avant le 31 !`}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

            </div>

            {/* FRISE CHRONOLOGIQUE */}
            <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #E5E7EB', marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#374151' }}>
                  ⏳ Évolution du solde (Jour par Jour)
                </h3>
                <button 
                  onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
                  style={{ background: virtualIncomes.length > 0 ? '#059669' : '#F3F4F6', color: virtualIncomes.length > 0 ? 'white' : '#4B5563', border: '1px solid #D1D5DB', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  🧪 {virtualIncomes.length > 0 ? 'Simulateur actif' : 'Simuler des revenus'}
                </button>
              </div>

              {isSimulatorOpen && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '25px', borderRadius: '12px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#065F46' }}>🧪 Patrons de Revenus (Simulateur Persistant)</h4>
                  <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#047857' }}>
                    Ces patrons généreront automatiquement des revenus virtuels pour les jours futurs. Idéal pour voir vos "vrais" surplus sans rien oublier !
                  </p>

                  {/* Liste des patrons existants */}
                  {incomePatterns.length > 0 && (
                    <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {incomePatterns.map(p => (
                        <div key={p.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #A7F3D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#065F46' }}>
                              [{p.entity}] {getCategory(p.category_id)?.name} {p.description ? `- ${p.description}` : ''}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#4B5563', marginTop: '5px', display: 'flex', gap: '10px' }}>
                              {p.is_monthly ? (
                                <span>📅 Le {p.monthly_day} du mois : <strong>{p.monthly_amount}$</strong></span>
                              ) : (
                                <>
                                  <span>L: {p.monday_amount}$</span>
                                  <span>M: {p.tuesday_amount}$</span>
                                  <span>M: {p.wednesday_amount}$</span>
                                  <span>J: {p.thursday_amount}$</span>
                                  <span>V: {p.friday_amount}$</span>
                                  <span>S: {p.saturday_amount}$</span>
                                  <span>D: {p.sunday_amount}$</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleEditClick(p)} style={{ background: '#E0E7FF', color: '#4F46E5', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Modifier</button>
                            <button onClick={() => handleDeletePattern(p.id)} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Supprimer</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulaire d'ajout */}
                  <form onSubmit={handleAddPattern} style={{ background: 'white', padding: '20px', borderRadius: '8px', border: editingPatternId ? '2px dashed #4F46E5' : '1px dashed #34D399' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h5 style={{ margin: 0, color: editingPatternId ? '#4F46E5' : '#059669' }}>
                        {editingPatternId ? 'Modifier le patron sélectionné' : 'Ajouter un patron de revenus'}
                      </h5>
                      
                      <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '8px', padding: '4px' }}>
                        <button type="button" onClick={() => setNewPattern({...newPattern, is_monthly: false})} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: !newPattern.is_monthly ? '#10B981' : 'transparent', color: !newPattern.is_monthly ? 'white' : '#4B5563', cursor: 'pointer', fontWeight: !newPattern.is_monthly ? 'bold' : 'normal', fontSize: '0.8rem' }}>Hebdomadaire</button>
                        <button type="button" onClick={() => setNewPattern({...newPattern, is_monthly: true})} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: newPattern.is_monthly ? '#10B981' : 'transparent', color: newPattern.is_monthly ? 'white' : '#4B5563', cursor: 'pointer', fontWeight: newPattern.is_monthly ? 'bold' : 'normal', fontSize: '0.8rem' }}>Mensuel</button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
                      <select value={newPattern.entity} onChange={e => setNewPattern({...newPattern, entity: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB', flex: 1, minWidth: '150px' }}>
                        {accounts.filter(a => a !== 'Vue Combinée').map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <select value={newPattern.category_id} onChange={e => setNewPattern({...newPattern, category_id: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB', flex: 2, minWidth: '200px' }} required>
                        <option value="">-- Catégorie --</option>
                        {categories.filter(c => c.type === 'income').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input type="text" placeholder="Description courte (ex: Pourboires)" value={newPattern.description} onChange={e => setNewPattern({...newPattern, description: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB', flex: 2, minWidth: '200px' }} />
                    </div>
                    
                    {newPattern.is_monthly ? (
                      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#065F46', marginBottom: '3px' }}>Jour du mois (ex: 15)</label>
                          <input type="number" min="1" max="31" placeholder="15" value={newPattern.monthly_day} onChange={e => setNewPattern({...newPattern, monthly_day: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #A7F3D0' }} required />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#065F46', marginBottom: '3px' }}>Montant ($)</label>
                          <input type="number" step="0.01" placeholder="300" value={newPattern.monthly_amount} onChange={e => setNewPattern({...newPattern, monthly_amount: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #A7F3D0' }} required />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                        {[
                          { k: 1, l: 'Lun' }, { k: 2, l: 'Mar' }, { k: 3, l: 'Mer' }, 
                          { k: 4, l: 'Jeu' }, { k: 5, l: 'Ven' }, { k: 6, l: 'Sam' }, { k: 0, l: 'Dim' }
                        ].map(day => (
                          <div key={day.k}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#065F46', marginBottom: '3px' }}>{day.l}</label>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0"
                              value={newPattern[day.k]}
                              onChange={e => setNewPattern({...newPattern, [day.k]: e.target.value})}
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #A7F3D0' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" style={{ background: editingPatternId ? '#4F46E5' : '#10B981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {editingPatternId ? 'Mettre à jour le patron' : 'Enregistrer le patron'}
                      </button>
                      {editingPatternId && (
                        <button type="button" onClick={() => { setEditingPatternId(null); setNewPattern({ entity: 'Entreprise', category_id: '', description: '', is_monthly: false, monthly_day: '', monthly_amount: '', 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 0: '' }); }} style={{ background: '#F3F4F6', color: '#4B5563', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                          Annuler
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB', color: '#6B7280', textAlign: 'left' }}>
                      <th style={{ padding: '12px 15px', fontWeight: 'bold' }}>Date</th>
                      <th style={{ padding: '12px 15px', fontWeight: 'bold' }}>Description</th>
                      <th style={{ padding: '12px 15px', fontWeight: 'bold', textAlign: 'right' }}>Montant</th>
                      <th style={{ padding: '12px 15px', fontWeight: 'bold', textAlign: 'right' }}>Solde après</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F3F4F6', color: '#9CA3AF' }}>
                      <td style={{ padding: '12px 15px' }}>--</td>
                      <td style={{ padding: '12px 15px', fontStyle: 'italic' }}>Solde initial du mois</td>
                      <td style={{ padding: '12px 15px', textAlign: 'right' }}>--</td>
                      <td style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 'bold', color: timelineStartBalance >= 0 ? '#10B981' : '#EF4444' }}>
                        {formatMoney(timelineStartBalance)}
                      </td>
                    </tr>
                    {timelineEvents.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF' }}>Aucune transaction ce mois-ci.</td>
                      </tr>
                    ) : timelineEvents.map((t, idx) => {
                      const isNegative = t.runningBalance < 0;
                      const d = parseDateLocal(t.date);
                      let dateStr = String(d.getDate()).padStart(2, '0');
                      
                      return (
                        <tr key={idx} style={{ 
                          borderBottom: '1px solid #F3F4F6', 
                          background: isNegative ? '#FEF2F2' : 'transparent'
                        }}>
                          <td style={{ padding: '12px 15px', color: '#4B5563', whiteSpace: 'nowrap' }}>
                            {dateStr}
                          </td>
                          <td style={{ padding: '12px 15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {t.is_ghost && !t.is_simulation && <span title="Projeté automatiquement">👻</span>}
                              {t.is_simulation && <span title="Revenu virtuel simulé">🧪</span>}
                              <span style={{ fontWeight: '500', color: '#111827', textDecoration: t.status === 'paid' ? 'line-through' : 'none' }}>
                                {t.description || getCategory(t.category_id)?.name || 'N/A'}
                              </span>
                              {isCombinedView && <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>[{t.entity}]</span>}
                              
                              {(t.is_ghost || t.is_simulation) && (
                                <button 
                                  onClick={() => {
                                    setTransactionToEdit({
                                      ...t,
                                      id: null,
                                      is_ghost: false,
                                      is_simulation: false,
                                      status: 'paid'
                                    });
                                    setIsModalOpen(true);
                                  }} 
                                  style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '1.1rem', marginLeft: 'auto' }} 
                                  title="Transformer en vraie transaction"
                                >
                                  ✎
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: t.type === 'income' ? '#059669' : '#DC2626', fontWeight: 'bold' }}>
                            {t.type === 'income' ? '+' : '-'}{formatMoney(parseFloat(t.amount))}
                          </td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 'bold', color: isNegative ? '#DC2626' : '#10B981' }}>
                            {formatMoney(t.runningBalance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {timelineEvents.some(t => t.runningBalance < 0) && (
                <div style={{ marginTop: '15px', padding: '12px', background: '#FEF2F2', border: '1px solid #F87171', borderRadius: '8px', color: '#B91C1C', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚠️</span>
                  <strong>Attention :</strong> Le compte tombera dans le négatif à certaines dates de ce mois. Assurez-vous d'avoir les fonds suffisants avant ces dates !
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
                            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                          />
                          <button onClick={() => { setTransactionToEdit(t); setIsModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '1.1rem' }} title="Modifier">✎</button>
                          {(!t.is_ghost && !t.is_simulation) && (
                            <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem' }} title="Supprimer">×</button>
                          )}
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
                          {(!t.is_ghost && !t.is_simulation) && (
                            <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem' }} title="Supprimer">×</button>
                          )}
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
                          {(!t.is_ghost && !t.is_simulation) && (
                            <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem' }} title="Supprimer">×</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
            </>
            )}
          </div>
        )}
      </div>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setTransactionToEdit(null); }} 
        onAdd={handleAddTransaction}
        onUpdate={handleEditTransaction}
        categories={categories}
        fournisseurs={fournisseurs}
        setFournisseurs={setFournisseurs}
        currentPin={pin}
        selectedMonth={currentMonth}
        selectedYear={currentYear}
        initialData={transactionToEdit}
        currentMonthTransactions={currentMonthTransactions}
      />
    </FinanceLock>
  );
}
