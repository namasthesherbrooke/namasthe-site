import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Politique de Confidentialité | Café Namasthé',
  description: 'Politique de confidentialité et protection des données personnelles du Café Namasthé et de ses applications mobiles.',
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ background: '#fdfcfb', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      
      <main style={{ flex: 1, padding: '120px 20px 60px', fontFamily: 'var(--font-body)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', color: '#2C1810', fontSize: '2.5rem', marginBottom: '20px' }}>
            Politique de Confidentialité
          </h1>
          <p style={{ color: '#666', marginBottom: '30px', fontStyle: 'italic' }}>
            Dernière mise à jour : {new Date().toLocaleDateString('fr-CA')}
          </p>

          <div style={{ color: '#4A3B32', lineHeight: '1.6', fontSize: '1.05rem' }}>
            <h2 style={{ color: '#8B002E', fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px' }}>1. Introduction</h2>
            <p style={{ marginBottom: '15px' }}>
              Bienvenue sur la politique de confidentialité de Café Namasthé. Nous respectons votre vie privée et nous nous engageons à protéger vos données personnelles. Cette politique décrit comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez notre site web (cafnamasthesherbrooke.com) et nos applications mobiles (Client et Barista).
            </p>

            <h2 style={{ color: '#8B002E', fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px' }}>2. Les données que nous collectons</h2>
            <p style={{ marginBottom: '15px' }}>
              Nous pouvons collecter et traiter les types de données personnelles suivants :
            </p>
            <ul style={{ marginBottom: '15px', paddingLeft: '20px' }}>
              <li><strong>Données d'identité :</strong> Prénom et nom.</li>
              <li><strong>Données de contact :</strong> Adresse courriel, code postal, numéro de téléphone (optionnel).</li>
              <li><strong>Données de transaction :</strong> Détails concernant les paiements (traités de manière sécurisée par Square) et l'historique de vos commandes.</li>
              <li><strong>Données techniques :</strong> Informations sur l'appareil mobile, adresse IP, et données d'utilisation de l'application.</li>
              <li><strong>Autorisations de l'appareil (App Barista) :</strong> L'accès à la caméra est requis exclusivement pour scanner les codes QR des clients dans le cadre du programme de fidélité.</li>
            </ul>

            <h2 style={{ color: '#8B002E', fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px' }}>3. Comment nous utilisons vos données</h2>
            <p style={{ marginBottom: '15px' }}>
              Nous utilisons vos données personnelles pour :
            </p>
            <ul style={{ marginBottom: '15px', paddingLeft: '20px' }}>
              <li>Créer et gérer votre compte utilisateur.</li>
              <li>Traiter et livrer vos commandes (breuvages, produits).</li>
              <li>Gérer notre programme de fidélité (points et récompenses).</li>
              <li>Vous envoyer des communications marketing (infolettre), uniquement si vous y avez consenti.</li>
              <li>Améliorer notre site web, nos applications et nos services.</li>
            </ul>

            <h2 style={{ color: '#8B002E', fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px' }}>4. Partage de vos données</h2>
            <p style={{ marginBottom: '15px' }}>
              Nous ne vendons ni ne louons vos données personnelles à des tiers. Vos données peuvent être partagées uniquement avec nos prestataires de services de confiance qui nous aident à exploiter notre entreprise (par exemple : <strong>Square</strong> pour le traitement des paiements, et <strong>Brevo</strong> pour l'envoi d'infolettres).
            </p>

            <h2 style={{ color: '#8B002E', fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px' }}>5. Sécurité des données</h2>
            <p style={{ marginBottom: '15px' }}>
              Nous avons mis en place des mesures de sécurité appropriées pour éviter que vos données personnelles ne soient accidentellement perdues, utilisées, modifiées, divulguées ou consultées de manière non autorisée.
            </p>

            <h2 style={{ color: '#8B002E', fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px' }}>6. Vos droits</h2>
            <p style={{ marginBottom: '15px' }}>
              En vertu des lois applicables sur la protection des données, vous avez le droit de demander l'accès, la correction ou la suppression de vos données personnelles. Vous pouvez également retirer votre consentement marketing à tout moment directement depuis la section "Mon Compte".
            </p>

            <h2 style={{ color: '#8B002E', fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px' }}>7. Nous contacter</h2>
            <p style={{ marginBottom: '15px' }}>
              Pour toute question concernant cette politique de confidentialité ou nos pratiques de protection des données, veuillez nous contacter à l'adresse suivante :<br/>
              <strong>Courriel :</strong> namasthesherbrooke@gmail.com
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
