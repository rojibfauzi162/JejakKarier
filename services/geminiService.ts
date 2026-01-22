
import { GoogleGenAI, Type } from "@google/genai";
import { AppData, Skill, CareerPath } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function analyzeSkillGap(data: AppData) {
  const model = 'gemini-3-flash-preview';
  
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
          required: ["trainings", "certifications", "summary"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return null;
  }
}

export async function summarizeMonthlyReview(reviewText: string) {
  const model = 'gemini-3-flash-preview';
  const prompt = `Summarize this monthly career review and suggest 3 action items: ${reviewText}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Summarization failed:", error);
    return "Failed to generate summary.";
  }
}
