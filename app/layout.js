/**
 * layout.js — Layout racine du site Café Namasthé
 * 
 * Ce fichier définit la structure HTML globale partagée par toutes les pages :
 * - Import du CSS global (design system complet)
 * - Google Fonts (Playfair Display pour les titres, Inter pour le corps)
 * - Composants partagés : Header, Footer, ChatBubble, SignupPopup
 * - Métadonnées SEO du site
 * 
 * Chaque page sera rendue à l'intérieur du {children} de ce layout.
 */

import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatBubble from './components/ChatBubble';
import SignupPopup from './components/SignupPopup';
import Cart from './components/Cart';
import IosInstallPrompt from './components/IosInstallPrompt';
import TabTitleChanger from './components/TabTitleChanger';
import { CartProvider } from './context/CartContext';

/* Métadonnées SEO globales du site */
export const metadata = {
  metadataBase: new URL('https://cafenamasthesherbrooke.ca'),
  title: {
    template: '%s | Café NamasThé Sherbrooke',
    default: 'Café santé à Sherbrooke | Café NamasThé',
  },
  description: "Café Namasthé est une oasis urbaine proposant des boissons vibrantes, des créations tropicales et une ambiance zen. Découvrez nos jus pressés, thés signatures et événements bien-être à Sherbrooke.",
  keywords: "café, namasthé, sherbrooke, jus pressé, thé, bien-être, tropical, zen, boissons naturelles, bubble tea",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Namasthé",
  },
  openGraph: {
    title: "Café Namasthé | Oasis Urbaine à Sherbrooke",
    description: "Découvrez nos boissons vibrantes, nos Bubble Teas et nos événements bien-être dans une ambiance zen.",
    url: 'https://cafenamasthesherbrooke.ca',
    siteName: 'Café Namasthé',
    images: [
      {
        url: '/images/esprit_namasthe_v2.jpg',
        width: 1200,
        height: 630,
        alt: 'Intérieur du Café Namasthé',
      },
    ],
    locale: 'fr_CA',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#2C1810',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <CartProvider>
          {/* Composants globaux présents sur toutes les pages */}
          <Header />

          {/* Tiroir du panier d'achat */}
          <Cart />

          {/* Contenu principal de la page courante */}
          <main>{children}</main>

          {/* Pied de page global */}
          <Footer />

          {/* Bulle de chat IA (bas droite, toujours visible) */}
          <ChatBubble />

          {/* Pop-up d'inscription (première visite uniquement) */}
          <SignupPopup />

          {/* Guide d'installation pour iOS */}
          <IosInstallPrompt />

          {/* Easter egg de l'onglet du navigateur */}
          <TabTitleChanger />

          {/* Bouton Commander Flottant (Mobile uniquement) */}
          <a href="/commande" className="floating-order-btn">
            🛍️ Commander
          </a>
        </CartProvider>
      </body>
    </html>
  );
}
