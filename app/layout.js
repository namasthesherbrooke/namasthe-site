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

import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatBubble from './components/ChatBubble';
import SignupPopup from './components/SignupPopup';
import Cart from './components/Cart';
import IosInstallPrompt from './components/IosInstallPrompt';
import TabTitleChanger from './components/TabTitleChanger';
import FloatingOrderButton from './components/FloatingOrderButton';
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
  twitter: {
    card: 'summary_large_image',
    title: 'Café Namasthé | Oasis Urbaine à Sherbrooke',
    description: 'Découvrez nos boissons vibrantes, nos Bubble Teas et nos événements bien-être dans une ambiance zen.',
    images: ['/images/esprit_namasthe_v2.jpg'],
  },
};

export const viewport = {
  themeColor: '#2C1810',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: 'Café Namasthé',
    image: 'https://cafenamasthesherbrooke.ca/images/esprit_namasthe_v2.jpg',
    '@id': 'https://cafenamasthesherbrooke.ca',
    url: 'https://cafenamasthesherbrooke.ca',
    telephone: '819-123-4567',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '1086 rue King Ouest',
      addressLocality: 'Sherbrooke',
      addressRegion: 'QC',
      postalCode: 'J1H 1S2',
      addressCountry: 'CA'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 45.3982,
      longitude: -71.9056
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday', 'Sunday'],
        opens: '10:00',
        closes: '16:00'
      }
    ],
    priceRange: '$'
  };

  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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

          {/* Bouton Commander Flottant (Mobile uniquement, masqué sur certaines pages) */}
          <FloatingOrderButton />
          
          <Analytics />
        </CartProvider>
      </body>
    </html>
  );
}
