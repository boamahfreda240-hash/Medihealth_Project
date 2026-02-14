
import { GoogleGenAI, Type } from "@google/genai";
import { MedicalRecord, AIAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeMedicalHistory = async (records: MedicalRecord[]): Promise<AIAnalysis> => {
  const model = 'gemini-3-flash-preview';
  
  const recordsText = records.map(r => 
    `Date: ${r.date}, Doctor: ${r.doctor}, Diagnosis: ${r.diagnosis}, Notes: ${r.notes}, Meds: ${r.medications.join(', ')}`
  ).join('\n---\n');

  const prompt = `
    As a senior medical analyst, review the following patient medical history and provide a concise clinical summary, potential risk factors based on these records, and a suggested follow-up plan.
    
    PATIENT HISTORY:
    ${recordsText}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            riskFactors: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedFollowUp: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["summary", "riskFactors", "suggestedFollowUp", "confidence"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as AIAnalysis;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw error;
  }
};
