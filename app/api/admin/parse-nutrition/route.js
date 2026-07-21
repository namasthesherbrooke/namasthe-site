import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60; // Autoriser jusqu'à 60s pour la réponse de l'IA

export async function POST(request) {
  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ success: false, error: "Aucune image fournie" }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ success: false, error: "Clé API Gemini manquante" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const prompt = `
      Tu es un expert en nutrition. 
      L'utilisateur te fournit une photo d'une étiquette de valeurs nutritives.
      Tu dois extraire les informations nutritionnelles pour 100g/ml ET pour 1 portion (serving size).
      Fais les mathématiques nécessaires si le tableau ne donne qu'une seule des deux colonnes.
      
      Renvoie UNIQUEMENT un objet JSON valide avec les clés exactes suivantes, et aucune autre explication ou texte autour :
      {
        "calories_per_100": nombre,
        "protein_per_100": nombre,
        "carbs_per_100": nombre,
        "fat_per_100": nombre,
        "sugar_per_100": nombre,
        "calories_per_serving": nombre,
        "protein_per_serving": nombre,
        "carbs_per_serving": nombre,
        "fat_per_serving": nombre,
        "sugar_per_serving": nombre
      }
      S'il manque une information, mets 0.
    `;

    // Nettoyer le base64 (enlever le préfixe data:image/...;base64, si présent)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType || 'image/jpeg'
              }
            }
          ]
        }
      ],
      config: {
        temperature: 0.1, // Bas pour être déterministe
      }
    });

    const text = response.text;
    
    // Essayer de parser le JSON (parfois l'IA met des backticks ```json ... ```)
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ success: true, data: parsedData });
    } else {
      throw new Error("Format JSON non reconnu dans la réponse de l'IA.");
    }

  } catch (error) {
    console.error("Erreur API parse-nutrition:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
