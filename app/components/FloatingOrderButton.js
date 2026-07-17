'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FloatingOrderButton() {
  const pathname = usePathname();
  
  // Liste des pages où le bouton de commande flottant est inutile ou encombrant
  const hiddenPages = [
    '/connexion', 
    '/inscription', 
    '/commande', 
    '/mon-compte', 
    '/mot-de-passe-oublie',
    '/admin' // et toutes les pages enfants de admin, mais on va faire une vérification plus large
  ];
  
  // Cacher si c'est une des pages exactes, ou si ça commence par /admin
  if (hiddenPages.includes(pathname) || pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <Link href="/commande" className="floating-order-btn">
      🛍️ Commander
    </Link>
  );
}
