
import { GoogleGenAI, Type } from "@google/genai";
import { AppData, AiConfig, WorkReflection } from "../types";
import { getAiConfig, auth, recordAiTokens } from "./firebase";

// Cache lokal untuk konfigurasi AI agar tidak redundant ke Firestore
let cachedAiConfig: AiConfig | null = null;
let lastConfigFetch = 0;

async function callAI(prompt: string, schema?: any) {
  // Check for OpenRouter configuration first with 10-second timeout on DB fetch
  let config: AiConfig | null = cachedAiConfig;
  const now = Date.now();

  // Refresh config if older than 5 minutes or not cached
  if (!config || (now - lastConfigFetch > 300000)) {
    try {
      console.log("[AI SERVICE] Attempting to fetch config from Firestore...");
      const configPromise = getAiConfig();
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error("DB Timeout")), 8000));
      
      const fetchedConfig = await Promise.race([configPromise, timeoutPromise]) as AiConfig | null;
      
      if (fetchedConfig && fetchedConfig.openRouterKey) {
        console.log("[AI SERVICE] Config successfully fetched from DB.");
        config = fetchedConfig;
        cachedAiConfig = fetchedConfig;
        lastConfigFetch = now;
      } else {
        console.warn("[AI SERVICE] Fetched config is empty or missing OpenRouter Key.");
        config = cachedAiConfig;
      }
    } catch (e: any) {
      // Deteksi kegagalan permission khusus Firestore
      if (e.message?.includes('permission-denied') || e.code === 'permission-denied') {
        console.error("[AI SERVICE] SECURITY ALERT: Role 'User' is blocked from reading system_metadata collection by Firestore Rules.");
      } else {
        console.error("[AI SERVICE] DB Connection Error:", e.message);
      }
      config = cachedAiConfig;
    }
  }
  
  // LOGIKA UTAMA: Jika OpenRouter Key tersedia di Database, gunakan OpenRouter API (Hanya fetch)
  if (config && config.openRouterKey && config.openRouterKey.trim() !== '' && config.openRouterKey !== 'undefined') {
    console.log("[AI SERVICE] Processing via OpenRouter Gateway...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); 

    const targetModel = config.modelName || "google/gemini-2.0-flash-exp:free";

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
          max_tokens: config.maxTokens || 2000,
          response_format: schema ? { type: "json_object" } : undefined
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        
        // Log Token Usage if available
        const tokenCount = json.usage?.total_tokens || 0;
        if (tokenCount > 0 && auth.currentUser) {
          recordAiTokens(auth.currentUser.uid, tokenCount);
        }

        let text = json.choices[0].message?.content || "";
        
        if (schema) {
          try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            return JSON.parse(text);
          } catch (e) {
            console.error("[AI SERVICE] OpenRouter JSON Parse error.");
          }
        } else {
          return text;
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("[AI SERVICE] OpenRouter error response:", errorData);
        throw new Error(`AI Gagal Merespon: ${errorData.error?.message || 'Gangguan pada Provider AI'}`);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') throw new Error("Waktu generate AI habis. Silakan coba lagi.");
      throw error;
    }
    return null;
  }

  // PENANGANAN FALLBACK AMAN: Mencegah Library Crash
  console.log("[AI SERVICE] OpenRouter config missing, checking native environment...");
  
  let envKey = '';
  try { 
    // Ambil API Key dari environment jika ada
    envKey = process.env.API_KEY || ''; 
  } catch(e) {}
  
  // VALIDASI KRITIS: Jika tidak ada kunci sama sekali, STOP di sini. Jangan panggil GoogleGenAI().
  if ((!envKey || envKey === 'undefined' || envKey.trim() === '') && (!config || !config.openRouterKey)) {
    throw new Error("⚠️ ERROR KONFIGURASI: Aplikasi tidak menemukan API Key. \n\nHal ini biasanya terjadi karena Firestore Security Rules membatasi akses role 'User' ke koleksi 'system_metadata' sehingga kunci OpenRouter dari Admin tidak terbaca. \n\nMohon pastikan Firestore Rules untuk 'system_metadata' sudah di-Publish ke Public/Authenticated Users.");
  }

  // Jika sampai sini berarti ada envKey yang valid
  console.log("[AI SERVICE] Using Native Gemini SDK Fallback");
  const ai = new GoogleGenAI({ apiKey: envKey });
  const model = 'gemini-3-flash-preview';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: schema ? { responseMimeType: "application/json", responseSchema: schema } : undefined
    });
    
    // Record Native SDK Tokens - Perbaikan: Menambahkan fallback || 0 untuk menghindari error TS2345
    if (response.usageMetadata && auth.currentUser) {
      recordAiTokens(auth.currentUser.uid, response.usageMetadata.totalTokenCount || 0);
    }
    
    let text = response.text?.trim() || (schema ? '{}' : '');
    if (schema) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    }
    return text;
  } catch (error: any) {
    console.error("[AI SERVICE] Native SDK failure:", error);
    throw new Error(`Kesalahan Layanan AI: ${error.message}`);
  }
}

export async function generateProfileBio(data: AppData) {
  const prompt = `
    GENERATE A PROFESSIONAL CAREER BIO
    NAME: ${data.profile.name}
    POSITION: ${data.profile.currentPosition}
    TARGET GOAL: ${data.profile.shortTermTarget}
    SUMMARY OF WORK: ${data.workExperiences.map(w => w.position + ' at ' + w.company).join(', ')}
    
    INSTRUCTIONS:
    1. Write in professional Bahasa Indonesia.
    2. Make it high-impact for recruiters.
    3. Keep it between 2-3 sentences.
    4. Focus on value proposition and future goals.
    5. No formatting, just raw text.
  `;
  return await callAI(prompt);
}

export async function analyzeSkillGap(data: AppData, lang: 'id' | 'en' = 'id') {
  const currentTarget = data.profile.shortTermTarget || "Next Level Position";
  const completedHistory = data.completedAiMilestones ? data.completedAiMilestones.join(", ") : "None";
  
  const prompt = `
    PERFORM CAREER ANALYSIS FOR: ${data.profile.name}
    CURRENT ROLE: ${data.profile.currentPosition}
    TARGET GOAL: ${currentTarget}
    SKILLS DATA: ${JSON.stringify(data.skills.map(s => ({ name: s.name, level: s.currentLevel })))}
    WORK HISTORY: ${JSON.stringify(data.workExperiences.map(w => ({ pos: w.position, duration: w.duration })))}
    ACHIEVEMENT CONTEXT: ${completedHistory}
    
    INSTRUCTIONS:
    1. STRICT: Write normally. No spaced-out text. 
    2. Use Sentence Case for all paragraphs.
    3. LANGUAGE: ${lang === 'id' ? 'Bahasa Indonesia' : 'English'}.
    
    REQUIRED JSON STRUCTURE:
    {
      "targetGoal": "string",
      "readinessScore": number,
      "scoreExplanation": "string",
      "experienceRoadmap": [{"position": "string", "duration": "string", "focus": "string"}],
      "criticalGaps": [{"skill": "string", "priority": "string", "why": "string"}],
      "immediateActions": { "weekly": "string", "monthly": "string", "nextMonth": "string" },
      "roadmapSteps": [{"title": "string", "detail": "string"}],
      "recommendations": { 
         "trainings": [{"name": "string", "provider": "string", "detail": "string", "schedule": "string", "priceRange": "string", "url": ""}], 
         "certifications": [{"name": "string", "provider": "string", "detail": "string", "schedule": "string", "priceRange": "string", "url": ""}] 
      },
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
      experienceRoadmap: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { position: { type: Type.STRING }, duration: { type: Type.STRING }, focus: { type: Type.STRING } },
          required: ["position", "duration", "focus"]
        }
      },
      criticalGaps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { skill: { type: Type.STRING }, priority: { type: Type.STRING }, why: { type: Type.STRING } },
          required: ["skill", "priority", "why"]
        }
      },
      immediateActions: {
        type: Type.OBJECT,
        properties: { weekly: { type: Type.STRING }, monthly: { type: Type.STRING }, nextMonth: { type: Type.STRING } },
        required: ["weekly", "monthly", "nextMonth"]
      },
      roadmapSteps: {
        type: Type.ARRAY,
        items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, detail: { type: Type.STRING } }, required: ["title", "detail"] }
      },
      recommendations: {
        type: Type.OBJECT,
        properties: {
          trainings: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, provider: { type: Type.STRING }, detail: { type: Type.STRING }, schedule: { type: Type.STRING }, priceRange: { type: Type.STRING }, url: { type: Type.STRING } } } },
          certifications: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, provider: { type: Type.STRING }, detail: { type: Type.STRING }, schedule: { type: Type.STRING }, priceRange: { type: Type.STRING }, url: { type: Type.STRING } } } }
        },
        required: ["trainings", "certifications"]
      },
      motivation: { type: Type.STRING },
      executiveSummary: { type: Type.STRING }
    },
    required: ["targetGoal", "readinessScore", "scoreExplanation", "criticalGaps", "immediateActions", "roadmapSteps", "recommendations", "motivation", "executiveSummary"]
  };

  return await callAI(prompt, schema);
}

export async function summarizeMonthlyReview(reviewText: string) {
  const prompt = `Summarize this monthly career review and suggest 3 action items: ${reviewText}`;
  return await callAI(prompt);
}

export async function generateCareerInsight(data: AppData, audience: 'self' | 'supervisor', period: 'weekly' | 'monthly', contexts: string[]) {
  const isSupervisor = audience === 'supervisor';
  const targetContexts = isSupervisor ? ['Perusahaan'] : contexts;
  
  const minimalLogs = data.dailyReports
    .filter(l => targetContexts.includes(l.context))
    .slice(-40)
    .map(l => ({
      d: l.date,
      a: l.activity,
      o: l.output,
      m: `${l.metricValue} ${l.metricLabel}`
    }));

  const prompt = `
    GENERATE PROFESSIONAL CAREER INSIGHT REPORT
    FOR: ${data.profile.name}
    AUDIENCE: ${isSupervisor ? 'SUPERVISOR (Focus ONLY on corporate tasks)' : 'SELF REFLECTION.'}
    PERIOD: ${period === 'weekly' ? 'Weekly' : 'Monthly'}
    
    DATA PROVIDED:
    - Activity Logs: ${JSON.stringify(minimalLogs)}
    - Current Performance: ${JSON.stringify(data.skills.map(s => ({n: s.name, l: s.currentLevel})))}
    
    INSTRUCTIONS (STRICT FORMATTING):
    1. Write in normal professional Bahasa Indonesia. 
    2. DILARANG KERAS menggunakan spasi tambahan di antara setiap huruf.
    3. DILARANG menggunakan huruf KAPITAL SEMUA untuk isi paragraf.
    
    SCHEMA:
    {
      "title": "string",
      "summary": "string",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "sections": [{"label": "string", "content": "string"}],
      "metrics": [{"label": "string", "value": "string"}],
      "detectedAchievements": [
         {
           "title": "string",
           "impact": "string",
           "category": "Profesional",
           "scope": "Perusahaan"
         }
      ],
      "aiReflection": "string"
    }
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      summary: { type: Type.STRING },
      startDate: { type: Type.STRING },
      endDate: { type: Type.STRING },
      sections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, content: { type: Type.STRING } } } },
      metrics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } } } },
      detectedAchievements: { 
        type: Type.ARRAY, 
        items: { 
          type: Type.OBJECT, 
          properties: { 
            title: { type: Type.STRING }, 
            impact: { type: Type.STRING }, 
            category: { type: Type.STRING }, 
            scope: { type: Type.STRING } 
          } 
        } 
      },
      aiReflection: { type: Type.STRING }
    },
    required: ["title", "summary", "startDate", "endDate", "sections", "metrics", "aiReflection"]
  };

  return await callAI(prompt, schema);
}

export async function analyzeReflections(data: AppData, reflections: WorkReflection[], filterRange: string) {
  const prompt = `
    ANALYZE DAILY WORK REFLECTIONS
    USER: ${data.profile.name} (${data.profile.currentPosition})
    RANGE: ${filterRange}
    DATA: ${JSON.stringify(reflections.map(r => ({
      date: r.date,
      mood: r.mood,
      energy: r.energy,
      load: r.workload,
      contribution: r.mainContribution,
      skills: r.skillsUsed
    })))}

    OUTPUT JSON SCHEMA:
    {
      "executiveSummary": "string",
      "productivityPattern": "string",
      "skillAnalysis": "string",
      "moodCorrelation": "string",
      "goldenContributions": ["string"],
      "careerReadiness": "string",
      "suggestedConnections": [
        {
          "type": "skill" | "task" | "achievement",
          "label": "string",
          "detail": "string"
        }
      ]
    }
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      executiveSummary: { type: Type.STRING },
      productivityPattern: { type: Type.STRING },
      skillAnalysis: { type: Type.STRING },
      moodCorrelation: { type: Type.STRING },
      goldenContributions: { type: Type.ARRAY, items: { type: Type.STRING } },
      careerReadiness: { type: Type.STRING },
      suggestedConnections: {
        type: Type.ARRAY,
        items: {
          type: { type: Type.STRING },
          label: { type: Type.STRING },
          detail: { type: Type.STRING }
        },
        required: ["type", "label", "detail"]
      }
    },
    required: ["executiveSummary", "productivityPattern", "skillAnalysis", "moodCorrelation", "goldenContributions", "careerReadiness", "suggestedConnections"]
  };

  return await callAI(prompt, schema);
}
