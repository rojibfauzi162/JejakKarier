
import { GoogleGenAI, Type } from "@google/genai";
import { AppData, AiConfig, WorkReflection } from "../types";
import { getAiConfig, auth, recordAiTokens } from "./firebase";

let cachedAiConfig: AiConfig | null = null;
let lastConfigFetch = 0;

async function callAI(prompt: string, schema?: any) {
  let config: AiConfig | null = cachedAiConfig;
  const now = Date.now();

  // Refresh config setiap 1 menit
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
    const safeMaxTokens = Math.min(Number(config.maxTokens) || 4096, 8192);

    // Perbaikan: Masukkan instruksi struktur JSON langsung ke prompt untuk OpenRouter
    const enrichedPrompt = schema 
      ? `${prompt}\n\nSTRICT REQUIREMENT: Respond ONLY with a valid JSON object matching this structure: ${JSON.stringify(schema)}. Ensure all fields are filled with meaningful, descriptive content. Do not return empty strings for required analysis fields. EVERYTHING MUST BE IN THE REQUESTED LANGUAGE.`
      : prompt;

    const systemMessage = schema
      ? "You are a senior career path strategist. Your output MUST be a valid, minified JSON object. No conversational text, no markdown code blocks, just the raw JSON."
      : "You are a helpful career assistant.";

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.openRouterKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "FokusKarir",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: enrichedPrompt }
          ],
          max_tokens: safeMaxTokens,
          response_format: { type: "json_object" }
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
          // Robust Cleaning: Hapus blok markdown jika AI tetap menyertakannya
          const cleanJson = text.replace(/```json\n?|```/g, "").trim();
          try {
            return JSON.parse(cleanJson);
          } catch (e) {
            // Fallback: Cari kurung kurawal pertama dan terakhir
            const match = cleanJson.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
            throw new Error("AI returned invalid JSON format");
          }
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

  // FALLBACK KE NATIVE SDK
  if (!process.env.API_KEY && (!config || !config.openRouterKey)) {
    throw new Error("Layanan AI Belum Dikonfigurasi. Silakan hubungi Superadmin untuk setting API Key.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Gunakan model stabil terbaru
      contents: prompt,
      config: schema ? { responseMimeType: "application/json", responseSchema: schema } : undefined
    });
    
    if (response.usageMetadata && auth.currentUser) {
      recordAiTokens(auth.currentUser.uid, response.usageMetadata.totalTokenCount || 0);
    }
    
    let text = response.text?.trim() || '';
    if (schema) {
      const cleanJson = text.replace(/```json\n?|```/g, "").trim();
      const match = cleanJson.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : JSON.parse(cleanJson);
    }
    return text;
  } catch (error: any) {
    console.error("[AI SERVICE] Native SDK error:", error.message);
    throw new Error(`Kesalahan Layanan AI: ${error.message}`);
  }
}

export async function generateProfileBio(data: AppData) {
  const prompt = `GENERATE A PROFESSIONAL CAREER BIO for ${data.profile.name}. POSITION: ${data.profile.currentPosition}. Make it 2 sentences in Bahasa Indonesia.`;
  return await callAI(prompt);
}

export async function analyzeSkillGap(data: AppData, lang: 'id' | 'en' = 'id') {
  const slimData = {
    profile: data.profile,
    skills: data.skills.map(s => ({ name: s.name, level: s.currentLevel, status: s.status })),
    workExperiences: data.workExperiences.map(w => ({ position: w.position, company: w.company, duration: w.duration }))
  };

  const languageName = lang === 'id' ? 'BAHASA INDONESIA' : 'ENGLISH';

  const prompt = `ANALYZE CAREER QUALIFICATION FOR ${data.profile.name}. 
  TARGET POSITION: ${data.profile.shortTermTarget || data.profile.currentPosition}. 
  USER DATA: ${JSON.stringify(slimData)}. 
  
  REQUIRED OUTPUT LANGUAGE: ${languageName}.
  MANDATORY: ALL string values in the JSON output MUST be in ${languageName}.
  
  1. Detailed readiness score (0-100).
  2. Professional explanation of the score.
  3. SPECIFIC education recommendations (e.g. "S1 Akuntansi", not just "Relevant Degree").
  4. At least 3 training and 3 certification names that are popular in the industry right now.
  5. 3 immediate micro-actions for this week, this month, and next month.
  
  MANDATORY: Provide high-quality content for every single field. Do not use placeholders. Ensure Indonesian terms are used if language is set to ID.`;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      targetGoal: { type: Type.STRING },
      readinessScore: { type: Type.NUMBER },
      scoreExplanation: { type: Type.STRING },
      criticalGaps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { skill: { type: Type.STRING }, priority: { type: Type.STRING }, why: { type: Type.STRING } } } },
      immediateActions: { type: Type.OBJECT, properties: { weekly: { type: Type.STRING }, monthly: { type: Type.STRING }, nextMonth: { type: Type.STRING } } },
      roadmapSteps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, detail: { type: Type.STRING } } } },
      experienceRoadmap: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { position: { type: Type.STRING }, field: { type: Type.STRING }, duration: { type: Type.STRING }, focus: { type: Type.STRING } } } },
      educationRecommendation: { type: Type.OBJECT, properties: { strata: { type: Type.STRING }, major: { type: Type.STRING }, detail: { type: Type.STRING } } },
      recommendations: { type: Type.OBJECT, properties: { trainings: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, provider: { type: Type.STRING }, detail: { type: Type.STRING }, schedule: { type: Type.STRING }, priceRange: { type: Type.STRING } } } }, certifications: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, provider: { type: Type.STRING }, detail: { type: Type.STRING }, schedule: { type: Type.STRING }, priceRange: { type: Type.STRING } } } } } },
      motivation: { type: Type.STRING },
      executiveSummary: { type: Type.STRING },
      experiencePrerequisites: { type: Type.STRING },
      relevantEducation: { type: Type.STRING }
    },
    required: ["targetGoal", "readinessScore", "scoreExplanation", "criticalGaps", "immediateActions", "roadmapSteps", "experienceRoadmap", "educationRecommendation", "recommendations", "motivation", "executiveSummary", "experiencePrerequisites", "relevantEducation"]
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
