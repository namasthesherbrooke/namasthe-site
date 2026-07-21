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
      Tu dois extraire les informations suivantes et les ramener **obligatoirement pour 100g ou 100ml**, même si la portion sur l'étiquette est différente. Fais les mathématiques nécessaires.
      
      Renvoie UNIQUEMENT un objet JSON valide avec les clés exactes suivantes, et aucune autre explication ou texte autour :
      {
        "calories_per_100": nombre,
        "protein_per_100": nombre,
        "carbs_per_100": nombre,
        "fat_per_100": nombre,
        "sugar_per_100": nombre
      }
      S'il manque une information, mets 0.
    `;

    // Nettoyer le base64 (enlever le préfixe data:image/...;base64, si présent)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
