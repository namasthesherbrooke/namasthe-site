'use client';
import { useEffect } from 'react';

export default function TabTitleChanger() {
  useEffect(() => {
    let originalTitle = document.title;
    
    const handleBlur = () => {
      if (document.title !== "Une pause s'impose ? 🍵" && document.title !== "Revenez vite ! 🌸") {
        originalTitle = document.title;
      }
      document.title = Math.random() > 0.5 ? "Une pause s'impose ? 🍵" : "Revenez vite ! 🌸";
    };
    
    const handleFocus = () => {
      document.title = originalTitle || "Café Namasthé";
    };
    
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return null;
}
