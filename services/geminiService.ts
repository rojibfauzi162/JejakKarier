
import { GoogleGenAI, Type } from "@google/genai";
import { AppData, AiConfig, WorkReflection } from "../types";
import { getAiConfig, auth, recordAiTokens } from "./firebase";

let cachedAiConfig: AiConfig | null = null;
let lastConfigFetch = 0;

async function callAI(prompt: string, schema?: any) {
  let config: AiConfig | null = cachedAiConfig;
  const now = Date.now();

  // Refresh config setiap 1 menit (Mencegah hang jika Firestore permission denied berulang kali)
  if (!config || (now - lastConfigFetch > 60000)) {
    try {
      const fetchedConfig = await getAiConfig();
      if (fetchedConfig && fetchedConfig.openRouterKey) {
        config = fetchedConfig;
        cachedAiConfig = fetchedConfig;
        lastConfigFetch = now;
      }
    } catch (e: any) {
      console.warn("[AI SERVICE] Gagal memuat config dinamis, menggunakan cache/fallback.");
      config = cachedAiConfig;
    }
  }
  
  if (config && config.openRouterKey && config.openRouterKey.trim() !== '' && config.openRouterKey !== 'undefined') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); 

    const targetModel = config.modelName || "google/gemini-2.0-flash-exp:free";
    
    // SAFETY CAP: Jangan biarkan maxTokens melebihi 8192 untuk menghindari error overflow 400 di OpenRouter.
    const safeMaxTokens = Math.min(Number(config.maxTokens) || 4096, 8192);

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
          model: targetModel,
          messages: [
            { role: "system", content: schema ? "You are a professional career qualification analyst. Return ONLY raw JSON. No markdown blocks." : "You are a helpful career assistant." },
            { role: "user", content: prompt }
          ],
          max_tokens: safeMaxTokens,
          response_format: schema ? { type: "json_object" } : undefined
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        const tokenCount = json.usage?.total_tokens || 0;
        if (tokenCount > 0 && auth.currentUser) {
          recordAiTokens(auth.currentUser.uid, tokenCount);
        }

        let text = json.choices[0].message?.content || "";
        if (schema) {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
        }
        return text;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("[AI SERVICE] OpenRouter error:", errorData);
        throw new Error(`AI Gagal Merespon: ${errorData.error?.message || 'Gangguan Provider AI'}`);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("[AI SERVICE] Fetch error:", error.message);
      throw error;
    }
  }

  // FALLBACK KE NATIVE SDK (Jika Firestore Key tidak ditemukan/akses ditolak)
  let envKey = '';
  try { envKey = process.env.API_KEY || ''; } catch(e) {}
  
  if (!envKey && (!config || !config.openRouterKey)) {
    throw new Error("Layanan AI Belum Dikonfigurasi. Silakan hubungi Superadmin untuk setting API Key.");
  }

  const ai = new GoogleGenAI({ apiKey: envKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: schema ? { responseMimeType: "application/json", responseSchema: schema } : undefined
    });
    if (response.usageMetadata && auth.currentUser) {
      recordAiTokens(auth.currentUser.uid, response.usageMetadata.totalTokenCount || 0);
    }
    let text = response.text?.trim() || '';
    if (schema) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    }
    return text;
  } catch (error: any) {
    console.error("[AI SERVICE] Native SDK error:", error.message);
    throw new Error(`Kesalahan Layanan AI: ${error.message}`);
  }
}

export async function generateProfileBio(data: AppData) {
  const prompt = `
    GENERATE A PROFESSIONAL CAREER BIO
    NAME: ${data.profile.name}
    POSITION: ${data.profile.currentPosition}
    SUMMARY: ${data.workExperiences.map(w => w.position).join(', ')}
    Make it 2-3 high-impact sentences in Bahasa Indonesia. Focus on professional value.
  `;
  return await callAI(prompt);
}

export async function analyzeSkillGap(data: AppData, lang: 'id' | 'en' = 'id') {
  const prompt = `ANALYZE CAREER GAP FOR ${data.profile.name}. TARGET: ${data.profile.shortTermTarget}. DATA: ${JSON.stringify(data.skills)}. LANG: ${lang}`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      targetGoal: { type: Type.STRING },
      readinessScore: { type: Type.NUMBER },
      scoreExplanation: { type: Type.STRING },
      criticalGaps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { skill: { type: Type.STRING }, priority: { type: Type.STRING }, why: { type: Type.STRING } } } },
      immediateActions: { type: Type.OBJECT, properties: { weekly: { type: Type.STRING }, monthly: { type: Type.STRING }, nextMonth: { type: Type.STRING } } },
      roadmapSteps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, detail: { type: Type.STRING } } } },
      recommendations: { type: Type.OBJECT, properties: { trainings: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, provider: { type: Type.STRING }, detail: { type: Type.STRING }, schedule: { type: Type.STRING }, priceRange: { type: Type.STRING } } } }, certifications: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, provider: { type: Type.STRING }, detail: { type: Type.STRING }, schedule: { type: Type.STRING }, priceRange: { type: Type.STRING } } } } } },
      motivation: { type: Type.STRING },
      executiveSummary: { type: Type.STRING }
    },
    required: ["targetGoal", "readinessScore", "scoreExplanation", "criticalGaps", "immediateActions", "roadmapSteps", "recommendations", "motivation", "executiveSummary"]
  };
  return await callAI(prompt, schema);
}

export async function summarizeMonthlyReview(reviewText: string) {
  return await callAI(`Summarize this review: ${reviewText}`);
}

export async function generateCareerInsight(data: AppData, audience: 'self' | 'supervisor', period: 'weekly' | 'monthly', contexts: string[]) {
  const prompt = `GENERATE PERFORMANCE INSIGHT for ${audience} period ${period}. DATA: ${JSON.stringify(data.dailyReports.slice(-20))}`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      summary: { type: Type.STRING },
      startDate: { type: Type.STRING },
      endDate: { type: Type.STRING },
      sections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, content: { type: Type.STRING } } } },
      metrics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } } } },
      detectedAchievements: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, impact: { type: Type.STRING }, category: { type: Type.STRING }, scope: { type: Type.STRING } } } },
      aiReflection: { type: Type.STRING }
    },
    required: ["title", "summary", "startDate", "endDate", "sections", "metrics", "aiReflection"]
  };
  return await callAI(prompt, schema);
}

export async function analyzeReflections(data: AppData, reflections: WorkReflection[], filterRange: string) {
  const prompt = `ANALYZE WORK REFLECTIONS: ${JSON.stringify(reflections.map(r => r.mainContribution))}`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      executiveSummary: { type: Type.STRING },
      productivityPattern: { type: Type.STRING },
      skillAnalysis: { type: Type.STRING },
      moodCorrelation: { type: Type.STRING },
      goldenContributions: { type: Type.ARRAY, items: { type: Type.STRING } },
      careerReadiness: { type: Type.STRING },
      suggestedConnections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, label: { type: Type.STRING }, detail: { type: Type.STRING } } } }
    },
    required: ["executiveSummary", "productivityPattern", "moodCorrelation", "goldenContributions", "careerReadiness", "suggestedConnections"]
  };
  return await callAI(prompt, schema);
}
