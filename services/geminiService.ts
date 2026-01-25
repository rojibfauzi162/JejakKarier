
import { GoogleGenAI, Type } from "@google/genai";
import { AppData, AiConfig } from "../types";
import { getAiConfig } from "./firebase";

async function callAI(prompt: string, schema?: any) {
  // Check for OpenRouter configuration first
  let config: AiConfig | null = null;
  try {
    config = await getAiConfig();
  } catch (e) {
    console.warn("AI Config inaccessible, using default SDK.");
  }
  
  if (config && config.openRouterKey && config.openRouterKey.trim() !== '') {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.openRouterKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "JejakKarir",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: config.modelName || "google/gemini-2.0-pro-exp-02-05:free",
          messages: [
            { role: "system", content: schema ? "You are a specialized career qualification strategist. Return ONLY a valid JSON object matching the requested schema." : "You are a helpful career assistant." },
            { role: "user", content: prompt }
          ],
          max_tokens: config.maxTokens || 2000,
          response_format: schema ? { type: "json_object" } : undefined
        })
      });

      const json = await response.json();
      const text = json.choices?.[0]?.message?.content || "";
      
      if (schema) {
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error("Failed to parse OpenRouter JSON:", text);
          return null;
        }
      }
      return text;
    } catch (error) {
      console.error("OpenRouter call failed, falling back to Gemini SDK:", error);
    }
  }

  // Default to Gemini SDK via GenAI
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: schema ? {
        responseMimeType: "application/json",
        responseSchema: schema
      } : undefined
    });
    
    const text = response.text?.trim() || (schema ? '{}' : '');
    return schema ? JSON.parse(text) : text;
  } catch (error) {
    console.error("Gemini SDK call failed:", error);
    return null;
  }
}

export async function analyzeSkillGap(data: AppData, lang: 'id' | 'en' = 'id') {
  const currentTarget = data.profile.shortTermTarget || "Next Level Position";
  const prompt = `
    Analyze the career gap and provide a Detailed Qualification Strategy.
    LANGUAGE: Use ${lang === 'id' ? 'Indonesian' : 'English'}.
    
    USER PROFILE:
    Name: ${data.profile.name}
    Current Role: ${data.profile.currentPosition} at ${data.profile.currentCompany}
    Target Goal: ${currentTarget}
    Ultimate Goal: ${data.profile.longTermTarget}
    Current Skills: ${JSON.stringify(data.skills.map(s => ({ name: s.name, level: s.currentLevel })))}
    Trainings Done: ${JSON.stringify(data.trainings.map(t => t.name))}
    Certifications Held: ${JSON.stringify(data.certifications.map(c => c.name))}
    
    OBJECTIVE: 
    1. Calculate a "Readiness Score" (0-100) to reach the Target Goal based on skills, certs, and experience.
    2. Explain the score (What is strong, what is missing).
    3. Identify Crucial Skill Gaps.
    4. Provide specific "Next Small Actions" for: This Week, This Month, Next Month.
    5. List Recommended Training Names and Certification Names specifically relevant to the Target Goal.
    6. Create a Motivation Quote for this version of the roadmap.
    
    Output strictly as JSON:
    {
      "targetGoal": "${currentTarget}",
      "readinessScore": number,
      "scoreExplanation": "string",
      "criticalGaps": [{"skill": "string", "priority": "CRITICAL/HIGH", "why": "string"}],
      "immediateActions": { "weekly": "string", "monthly": "string", "nextMonth": "string" },
      "roadmapSteps": [{"title": "string", "detail": "string"}],
      "recommendations": { "trainings": ["string"], "certifications": ["string"] },
      "motivation": "string",
      "executiveSummary": "string"
    }
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      targetGoal: { type: Type.STRING },
      readinessScore: { type: Type.NUMBER },
      scoreExplanation: { type: Type.STRING },
      criticalGaps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            skill: { type: Type.STRING },
            priority: { type: Type.STRING },
            why: { type: Type.STRING }
          }
        }
      },
      immediateActions: {
        type: Type.OBJECT,
        properties: {
          weekly: { type: Type.STRING },
          monthly: { type: Type.STRING },
          nextMonth: { type: Type.STRING }
        }
      },
      roadmapSteps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            detail: { type: Type.STRING }
          }
        }
      },
      recommendations: {
        type: Type.OBJECT,
        properties: {
          trainings: { type: Type.ARRAY, items: { type: Type.STRING } },
          certifications: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      },
      motivation: { type: Type.STRING },
      executiveSummary: { type: Type.STRING }
    },
    propertyOrdering: ["targetGoal", "readinessScore", "scoreExplanation", "criticalGaps", "immediateActions", "roadmapSteps", "recommendations", "motivation", "executiveSummary"]
  };

  return await callAI(prompt, schema);
}

export async function summarizeMonthlyReview(reviewText: string) {
  const prompt = `Summarize this monthly career review and suggest 3 action items: ${reviewText}`;
  return await callAI(prompt);
}
