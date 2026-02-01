
import { GoogleGenAI, Type } from "@google/genai";
import { BiologicalFact } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getEvolutionaryContext = async (length: number, score: number): Promise<BiologicalFact> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The snake has reached a length of ${length} units and a score of ${score}. 
      Generate a realistic biological profile for this evolving organism. 
      Return a JSON object containing speciesName (creative biological name), 
      fact (a short interesting fact), and traits (array of 3 traits).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            speciesName: { type: Type.STRING },
            fact: { type: Type.STRING },
            traits: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["speciesName", "fact", "traits"]
        }
      }
    });

    return JSON.parse(response.text.trim()) as BiologicalFact;
  } catch (error) {
    console.error("Gemini evolution error:", error);
    return {
      speciesName: "Hyper-Adaptive Serpent",
      fact: "This organism adapts its cellular structure in real-time to survive increasing complexity.",
      traits: ["Increased Reflexes", "Luminescent Scales", "Thermo-Vision"]
    };
  }
};

export const getAIGameOverMessage = async (score: number, length: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `A snake simulation just ended. Score: ${score}, Max Length: ${length}. 
      Write a single, very short, slightly poetic or philosophical obituary for this creature.`,
    });
    return response.text.trim();
  } catch {
    return "The cycle of nature continues. Your journey has reached its natural conclusion.";
  }
};
