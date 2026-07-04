'use client';

export default function FideliteManager({ profiles, searchTerm, setSearchTerm, handleAction, statusMessage }) {
  const filteredProfiles = profiles.filter(p => 
    (p.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (p.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  return (
    <div>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ color: '#2C1810', fontSize: '2.5rem', marginBottom: '10px' }}>Gestion des Fidélités</h1>
          <p style={{ color: '#5A4A42' }}>Ajoutez ou retirez des points manuellement à n'importe quel client.</p>
        </div>
        <input 
          type="text" 
          placeholder="Rechercher un client..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ padding: '12px 20px', borderRadius: '30px', border: '1px solid #ccc', minWidth: '300px', fontSize: '1rem' }}
        />
      </header>

      {statusMessage && (
        <div style={{ padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', background: statusMessage.type === 'success' ? '#E8F5E9' : '#FDECEA', color: statusMessage.type === 'success' ? '#2E7D32' : '#C62828' }}>
          {statusMessage.text}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', color: '#333' }}>
              <th style={{ padding: '15px 20px', borderBottom: '2px solid #eee' }}>Client</th>
              <th style={{ padding: '15px 20px', borderBottom: '2px solid #eee' }}>Contact</th>
              <th style={{ padding: '15px 20px', borderBottom: '2px solid #eee' }}>Dernière Visite</th>
              <th style={{ padding: '15px 20px', borderBottom: '2px solid #eee' }}>Progression</th>
              <th style={{ padding: '15px 20px', borderBottom: '2px solid #eee' }}>Tickets 🎟️</th>
              <th style={{ padding: '15px 20px', borderBottom: '2px solid #eee' }}>Tickets Utilisés</th>
              <th style={{ padding: '15px 20px', borderBottom: '2px solid #eee', textAlign: 'right' }}>Actions rapides</th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map(profile => {
              const pts = profile.fidelite_points || 0;
              const coupons = profile.tickets || 0;
              const progression = pts;
              
              return (
                <tr key={profile.id} style={{ borderBottom: '1px solid #eee', transition: 'background 0.2s' }}>
                  <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#2C1810' }}>{profile.prenom} {profile.nom}</td>
                  <td style={{ padding: '15px 20px', color: '#666', fontSize: '0.85rem' }}>
                    <div style={{ marginBottom: '4px' }}>✉️ {profile.email}</div>
                    {profile.telephone && <div>📞 {profile.telephone}</div>}
                    {profile.preference_contact === 'texto' && <div style={{ fontSize: '0.75rem', color: '#1565C0', marginTop: '4px', fontWeight: 'bold' }}>Préfère SMS</div>}
                  </td>
                  <td style={{ padding: '15px 20px', color: '#888', fontSize: '0.85rem' }}>
                    {profile.derniere_visite ? new Date(profile.derniere_visite).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Jamais'}
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <div style={{ background: '#E8F5E9', color: 'var(--green-tropical)', padding: '5px 10px', borderRadius: '20px', display: 'inline-block', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      {progression}/10
                    </div>
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    {coupons > 0 ? (
                      <div style={{ background: '#FCE4EC', color: '#E91E63', padding: '5px 10px', borderRadius: '20px', display: 'inline-block', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {coupons}
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '15px 20px', color: '#666', fontWeight: 'bold' }}>
                    {profile.tickets_utilises || 0}
                  </td>
                  <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleAction(profile.id, 'add')}
                        style={{ background: '#4CAF50', color: 'white', border: 'none', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Ajouter 1 point"
                      >+</button>
                      <button 
                        onClick={() => { if(window.confirm(`Retirer 1 point à ${profile.prenom} ?`)) handleAction(profile.id, 'remove'); }}
                        disabled={pts === 0}
                        style={{ background: pts > 0 ? '#F44336' : '#eee', color: pts > 0 ? 'white' : '#aaa', border: 'none', width: '35px', height: '35px', borderRadius: '50%', cursor: pts > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Retirer 1 point"
                      >-</button>
                      <button 
                        onClick={() => { if(window.confirm(`Retirer 1 ticket à ${profile.prenom} ?`)) handleAction(profile.id, 'claim'); }}
                        disabled={coupons === 0}
                        style={{ background: coupons > 0 ? '#FFC107' : '#eee', color: coupons > 0 ? '#2C1810' : '#aaa', border: 'none', padding: '0 15px', borderRadius: '20px', cursor: coupons > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.9rem' }}
                        title="Utiliser 1 ticket de breuvage gratuit"
                      >🎁 Utiliser Ticket</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredProfiles.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#666' }}>Aucun client trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
