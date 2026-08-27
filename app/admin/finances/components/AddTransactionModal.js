'use client';

import { useState, useEffect } from 'react';

export default function AddTransactionModal({ isOpen, onClose, onAdd, onUpdate, categories, currentPin, selectedMonth, selectedYear, initialData }) {
  const [date, setDate] = useState('');
  const [isVariableAmount, setIsVariableAmount] = useState(false);
  const [isVariableDate, setIsVariableDate] = useState(false);
  const [type, setType] = useState('expense');
  const [entity, setEntity] = useState('Entreprise');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [status, setStatus] = useState('paid');
  const [priority, setPriority] = useState(2); // 1: Urgent, 2: Normal, 3: Bas
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Filtrer les catégories selon l'entité et le type choisis
  const availableCategories = categories.filter(c => 
    c.type === type && (c.entity === entity || c.entity === 'Mixte')
  );


  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(initialData.date);
        setIsVariableAmount(initialData.is_fixed && (initialData.priority === 1 || initialData.priority === 4));
        setIsVariableDate(initialData.is_fixed && (initialData.priority === 3 || initialData.priority === 4));
        setType(initialData.type);
        setEntity(initialData.entity);
        setAmount(initialData.amount ? initialData.amount.toString() : '');
        setCategoryId(initialData.category_id);
        setDescription(initialData.description || '');
        setIsFixed(initialData.is_fixed);
        setStatus(initialData.status);
        setPriority(initialData.priority || 2);
      } else {
        const today = new Date();
        const sMonth = selectedMonth !== undefined ? selectedMonth : today.getMonth();
        const sYear = selectedYear !== undefined ? selectedYear : today.getFullYear();
        const isCurrentMonth = sMonth === today.getMonth() && sYear === today.getFullYear();
        
        const yyyy = sYear;
        const mm = String(sMonth + 1).padStart(2, '0');
        const dd = isCurrentMonth ? String(today.getDate()).padStart(2, '0') : '01';
        
        setDate(`${yyyy}-${mm}-${dd}`);
        setIsVariableAmount(false);
        setIsVariableDate(false);
        setType('expense');
        setAmount('');
        setDescription('');
        setCategoryId('');
      }
    }
  }, [isOpen, selectedMonth, selectedYear, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !categoryId) {
      setError('Veuillez remplir le montant et la catégorie.');
      return;
    }

    let finalPriority = 2;
    if (isFixed) {
      if (isVariableAmount && isVariableDate) finalPriority = 4;
      else if (isVariableAmount) finalPriority = 1;
      else if (isVariableDate) finalPriority = 3;
    } else {
      finalPriority = parseInt(priority);
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/finances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-finance-pin': currentPin
        },
        body: JSON.stringify(initialData && !String(initialData.id).startsWith('ghost-') ? {
          action: 'update_transaction',
          data: {
            id: initialData.id,
            updates: {
              date,
              type,
              entity,
              amount: parseFloat(amount),
              category_id: categoryId,
              description,
              is_fixed: isFixed,
              status,
              priority: finalPriority
            }
          }
        } : {
          action: 'add_transaction',
          data: {
            date,
            type,
            entity,
            amount: parseFloat(amount),
            category_id: categoryId,
            description,
            is_fixed: isFixed,
            status,
            priority: finalPriority
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'enregistrement');

      if (initialData && onUpdate) {
        onUpdate(data.transaction);
      } else if (onAdd) {
        onAdd(data.transaction);
      }
      
      setAmount('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#2C1810', fontSize: '1.5rem' }}>
            {initialData ? (type === 'expense' ? 'Modifier la dépense' : 'Modifier la rentrée') : (type === 'expense' ? 'Nouvelle Dépense' : 'Nouvelle Entrée')}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>&times;</button>
        </div>

        {error && <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Type</label>
              <select 
                value={type} 
                onChange={(e) => { setType(e.target.value); setCategoryId(''); }}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              >
                <option value="expense">Dépense (-)</option>
                <option value="income">Entrée (+)</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Compte</label>
              <select 
                value={entity} 
                onChange={(e) => { setEntity(e.target.value); setCategoryId(''); }}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              >
                <option value="Entreprise">Entreprise</option>
                <option value="Perso">Perso</option>
                <option value="Conjoint">Conjoint</option>
                <option value="Impôts et taxes">Impôts et taxes</option>
                <option value="Urgence">Urgence</option>
                <option value="Voyage et mon garçon">Voyage et mon garçon</option>
                <option value="CELI">CELI (Épargne)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
             <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '5px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Date</label>
              </div>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Statut</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              >
                <option value="paid">{type === 'expense' ? 'Déjà payé' : 'Déjà reçu'}</option>
                <option value="pending">{type === 'expense' ? 'À payer (Prévu)' : 'À recevoir (Prévu)'}</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Montant ($)</label>
            <input 
              type="number" 
              step="0.01"
              min="0.01"
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex: 45.50"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1.2rem' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Catégorie</label>
            <select 
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              required
            >
              <option value="">-- Choisir une catégorie --</option>
              {availableCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {type === 'expense' && (
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#F9FAFB', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={isFixed}
                  onChange={(e) => setIsFixed(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                Dépense Fixe (Récurrente)
              </label>
              
              {isFixed && (
                <div style={{ display: 'flex', gap: '15px', marginLeft: 'auto' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.85rem', color: '#4B5563' }}>
                    <input 
                      type="checkbox" 
                      checked={isVariableDate}
                      onChange={(e) => setIsVariableDate(e.target.checked)}
                    />
                    Date variable
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.85rem', color: '#4B5563' }}>
                    <input 
                      type="checkbox" 
                      checked={isVariableAmount}
                      onChange={(e) => setIsVariableAmount(e.target.checked)}
                    />
                    Montant variable
                  </label>
                </div>
              )}
              
              {!isFixed && status === 'pending' && (
                <div style={{ flex: 1 }}>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={{ 
                      width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem',
                      background: priority == 1 ? '#FEE2E2' : priority == 3 ? '#DCFCE7' : 'white'
                    }}
                  >
                    <option value={1}>Urgent 🔴</option>
                    <option value={2}>Normal ⚪</option>
                    <option value={3}>Bas 🟢</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Description / Note (Optionnel)</label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Épicerie Maxi, Fournisseur X..."
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ flex: 1, padding: '12px', background: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button 
              type="submit"
              style={{ flex: 2, padding: '12px', background: type === 'expense' ? '#EF4444' : '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement...' : (initialData ? 'Mettre à jour' : `Ajouter la ${type === 'expense' ? 'dépense' : 'rentrée'}`)}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
