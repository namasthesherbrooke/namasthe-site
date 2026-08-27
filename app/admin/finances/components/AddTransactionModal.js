'use client';

import { useState } from 'react';

export default function AddTransactionModal({ isOpen, onClose, onAdd, categories, currentPin }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('expense');
  const [entity, setEntity] = useState('Namasthé');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Filtrer les catégories selon l'entité et le type choisis
  const availableCategories = categories.filter(c => 
    c.type === type && (c.entity === entity || c.entity === 'Mixte')
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !categoryId) {
      setError('Veuillez remplir le montant et la catégorie.');
      return;
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
        body: JSON.stringify({
          action: 'add_transaction',
          data: {
            date,
            type,
            entity,
            amount: parseFloat(amount),
            category_id: categoryId,
            description
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'ajout');

      onAdd(data.transaction);
      // Réinitialiser le formulaire mais garder l'entité et le type
      setAmount('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#2C1810', fontSize: '1.5rem' }}>Nouvelle Transaction</h2>
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
                <option value="income">Revenu (+)</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Entité</label>
              <select 
                value={entity} 
                onChange={(e) => { setEntity(e.target.value); setCategoryId(''); }}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              >
                <option value="Namasthé">Namasthé (Business)</option>
                <option value="Personnel">Personnel (Maison)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              required
            />
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
              {isSubmitting ? 'Enregistrement...' : `Ajouter la ${type === 'expense' ? 'dépense' : 'rentrée'}`}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
