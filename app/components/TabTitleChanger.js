'use client';
import { useEffect } from 'react';

export default function TabTitleChanger() {
  useEffect(() => {
    let originalTitle = document.title;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Enregistrer le titre actuel au cas où on aurait navigué
        if (document.title !== "Une pause s'impose ? 🍵" && document.title !== "Revenez vite ! 🌸") {
          originalTitle = document.title;
        }
        document.title = Math.random() > 0.5 ? "Une pause s'impose ? 🍵" : "Revenez vite ! 🌸";
      } else {
        document.title = originalTitle;
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return null;
}
