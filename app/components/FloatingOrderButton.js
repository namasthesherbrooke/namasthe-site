'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FloatingOrderButton() {
  const pathname = usePathname();
  
  // Le bouton s'affiche UNIQUEMENT sur la page d'accueil pour ne pas encombrer les autres pages
  if (pathname !== '/') {
    return null;
  }

  return (
    <Link href="/commande" className="floating-order-btn">
      🛍️ Commander
    </Link>
  );
}
