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
import { CartProvider } from './context/CartContext';

/* Métadonnées SEO globales du site */
export const metadata = {
  title: "Café Namasthé — Éveillez vos sens. Nourrissez votre âme.",
  description: "Café Namasthé est une oasis urbaine proposant des boissons vibrantes, des créations tropicales et une ambiance zen. Découvrez nos jus pressés, thés signatures et événements bien-être.",
  keywords: "café, namasthé, jus pressé, thé, bien-être, tropical, zen, boissons naturelles",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Namasthé",
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
        </CartProvider>
      </body>
    </html>
  );
}
