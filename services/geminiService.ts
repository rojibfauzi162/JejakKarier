
import { GoogleGenAI, Type } from "@google/genai";
import { AppData } from "../types";

export async function analyzeSkillGap(data: AppData) {
  // Create a new GoogleGenAI instance right before making an API call to ensure it uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Use gemini-3-pro-preview for complex reasoning and career analysis tasks
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    Analyze the career gap for the following user:
    Profile: ${JSON.stringify(data.profile)}
    Current Skills: ${JSON.stringify(data.skills)}
    Career Paths: ${JSON.stringify(data.careerPaths)}
    
    Provide recommendations for:
    1. 3 relevant trainings to bridge the skill gap.
    2. 2 certifications that would boost this career path.
    3. A short summary of the development plan.
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
            trainings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of recommended trainings"
            },
            certifications: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of recommended certifications"
            },
            summary: {
              type: Type.STRING,
              description: "A summary analysis"
            }
          },
          // propertyOrdering is recommended for structured JSON output as per SDK guidelines
          propertyOrdering: ["trainings", "certifications", "summary"]
        }
      }
    });

    // Use .text property to access the response body directly
    const jsonStr = response.text?.trim() || '{}';
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return null;
  }
}

export async function summarizeMonthlyReview(reviewText: string) {
  // Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Use gemini-3-flash-preview for basic summarization tasks
  const model = 'gemini-3-flash-preview';
  const prompt = `Summarize this monthly career review and suggest 3 action items: ${reviewText}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    // Use .text property to access the response body directly
    return response.text || "Failed to generate summary.";
  } catch (error) {
    console.error("AI Summarization failed:", error);
    return "Failed to generate summary.";
  }
}
