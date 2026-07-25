export const metadata = {
  title: 'Politique de Confidentialité',
  description: 'Découvrez comment le Café Namasthé protège et gère vos données personnelles conformément aux normes en vigueur.',
};

export default function PolitiqueConfidentialite() {
  return (
    <div style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-sans)', lineHeight: '1.6', color: '#2C1810' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--crimson)', marginBottom: '40px', textAlign: 'center' }}>
        Politique de Confidentialité
      </h1>
      
      <p>Dernière mise à jour : {new Date().toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}</p>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5rem', borderBottom: '2px solid var(--green-tropical)', paddingBottom: '10px', marginBottom: '15px' }}>1. Introduction</h2>
        <p>
          Au Café Namasthé, nous accordons une grande importance à la protection de vos renseignements personnels. 
          Cette politique explique comment nous recueillons, utilisons et protégeons vos données lorsque vous visitez notre site web, 
          utilisez notre programme de fidélité ou passez une commande.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5rem', borderBottom: '2px solid var(--green-tropical)', paddingBottom: '10px', marginBottom: '15px' }}>2. Renseignements recueillis</h2>
        <p>Nous pouvons recueillir les renseignements suivants :</p>
        <ul>
          <li><strong>Informations d'identification :</strong> Prénom, nom, adresse courriel et numéro de téléphone (lors de l'inscription au club VIP).</li>
          <li><strong>Informations de naissance :</strong> Date de naissance (pour vous offrir un cadeau lors de votre anniversaire).</li>
          <li><strong>Données de navigation et statistiques :</strong> Nous utilisons des outils d'analyse (comme Vercel Analytics) pour comprendre de manière anonyme comment notre site est utilisé afin d'améliorer votre expérience.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5rem', borderBottom: '2px solid var(--green-tropical)', paddingBottom: '10px', marginBottom: '15px' }}>3. Utilisation de vos renseignements</h2>
        <p>Vos données sont utilisées exclusivement pour les fins suivantes :</p>
        <ul>
          <li>Gérer votre compte fidélité et accumuler vos points.</li>
          <li>Vous envoyer des communications transactionnelles (ex: reçu de commande).</li>
          <li>Vous envoyer des offres promotionnelles ou votre cadeau d'anniversaire, <strong>uniquement si vous avez consenti à recevoir nos infolettres/textos</strong>.</li>
          <li>Améliorer nos produits et notre service client.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5rem', borderBottom: '2px solid var(--green-tropical)', paddingBottom: '10px', marginBottom: '15px' }}>4. Protection et Partage des données</h2>
        <p>
          Vos renseignements personnels sont stockés de manière sécurisée dans nos bases de données infonuagiques chiffrées (Supabase). 
          <strong>Nous ne vendons, ne louons ni ne partageons jamais vos informations personnelles à des tiers pour des fins de marketing externe.</strong>
        </p>
        <p>
          Nous utilisons des fournisseurs de services de confiance (comme Brevo pour l'envoi de courriels et Square pour les paiements sécurisés) 
          qui sont strictement tenus de protéger vos données conformément aux normes de sécurité de l'industrie.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5rem', borderBottom: '2px solid var(--green-tropical)', paddingBottom: '10px', marginBottom: '15px' }}>5. Vos droits (Loi 25)</h2>
        <p>
          Conformément aux lois applicables au Québec (Loi 25), vous avez le droit de :
        </p>
        <ul>
          <li>Demander l'accès à vos renseignements personnels.</li>
          <li>Demander la rectification de vos informations si elles sont inexactes.</li>
          <li>Retirer votre consentement à l'utilisation de vos données en tout temps (ex: vous désabonner de notre liste d'envoi).</li>
          <li>Demander la suppression de votre compte fidélité et de vos données associées.</li>
        </ul>
        <p>Pour exercer ces droits, veuillez nous contacter aux coordonnées ci-dessous.</p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5rem', borderBottom: '2px solid var(--green-tropical)', paddingBottom: '10px', marginBottom: '15px' }}>6. Responsable de la protection des renseignements personnels (PRP)</h2>
        <p>Conformément à la Loi 25, la personne responsable de veiller à la protection de vos données est :</p>
        <p>
          <strong>Corine</strong> (Propriétaire)<br/>
          Café Namasthé<br/>
          1086 rue King Ouest<br/>
          Sherbrooke, QC J1H 1S2<br/>
          Courriel : <a href="mailto:namasthesherbrooke@gmail.com" style={{ color: 'var(--crimson)', textDecoration: 'underline' }}>namasthesherbrooke@gmail.com</a>
        </p>
      </section>
      
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <a href="/" style={{ background: 'var(--crimson)', color: 'white', padding: '12px 25px', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold' }}>
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}
