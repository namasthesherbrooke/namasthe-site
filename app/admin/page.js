export const metadata = {
  title: 'Admin - Café Namasthé',
  description: 'Portail de gestion des coûts et recettes',
};

export default function AdminDashboard() {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-heading)', color: '#1E293B', fontSize: '2.5rem', marginBottom: '10px' }}>
        Tableau de bord
      </h1>
      <p style={{ color: '#64748B', fontSize: '1.1rem', marginBottom: '40px' }}>
        Bienvenue dans le centre de commande de Namasthé.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#334155', marginBottom: '10px' }}>🥑 Ingrédients</h3>
          <p style={{ color: '#64748B', marginBottom: '20px' }}>Gérez vos coûts d'achat et laissez l'IA lire les étiquettes nutritionnelles pour vous.</p>
          <a href="/admin/ingredients" style={{ display: 'inline-block', background: '#38BDF8', color: 'white', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
            Gérer les ingrédients →
          </a>
        </div>

        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#334155', marginBottom: '10px' }}>🧪 Recettes & Costing</h3>
          <p style={{ color: '#64748B', marginBottom: '20px' }}>Créez vos breuvages, calculez votre coûtant exact et générez vos macros automatiquement.</p>
          <a href="/admin/recettes" style={{ display: 'inline-block', background: '#10B981', color: 'white', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
            Créer une recette →
          </a>
        </div>
      </div>
    </div>
  );
}
