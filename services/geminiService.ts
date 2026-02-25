import { GoogleGenAI, Type } from "@google/genai";
import { AppData, AiConfig, WorkReflection, CareerSwitchAnalysis, CareerMoveDiagnosis } from "../types";
import { getAiConfig, auth, recordAiTokens } from "./firebase";

let cachedAiConfig: AiConfig | null = null;
let lastConfigFetch = 0;

async function callAI(prompt: string, schema?: any) {
  let config: AiConfig | null = cachedAiConfig;
  const now = Date.now();

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

    const targetModel = config.modelName || "google/gemini-2.0-flash-001";
    const safeMaxTokens = Math.min(Number(config.maxTokens) || 4096, 8192);

    const enrichedPrompt = schema 
      ? `${prompt}\n\nSTRICT REQUIREMENT: Respond ONLY with a valid JSON object. DO NOT include any conversational text before or after the JSON. Use exactly these keys: ${Object.keys(schema.properties || {}).join(", ")}. Structure reference: ${JSON.stringify(schema)}.`
      : prompt;

    const systemMessage = schema
      ? "You are a senior career path strategist. Your output MUST be a valid JSON object following the requested schema exactly. No conversational text, no markdown code blocks unless requested."
      : "You are a senior career path analyst. Provide natural language responses in Bahasa Indonesia without any JSON formatting unless explicitly requested.";

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
          const cleanJson = text.replace(/```json\n?|```/g, "").trim();
          try {
            const parsed = JSON.parse(cleanJson);
            return parsed;
          } catch (e) {
            const match = cleanJson.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
            throw new Error("AI returned invalid JSON format");
          }
        }
        return text;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`AI Gagal Merespon: ${errorData.error?.message || 'Gangguan Provider AI'}`);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key Gemini tidak terdeteksi.");

    const ai = new GoogleGenAI({ apiKey });
    
    // Tambahkan timeout manual agar tidak stuck selamanya (40 detik)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout: Layanan AI terlalu lama merespon.")), 40000)
    );

    const responsePromise = ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        maxOutputTokens: 2000,
        responseMimeType: schema ? "application/json" : undefined,
        responseSchema: schema || undefined
      }
    });

    const response = await Promise.race([responsePromise, timeoutPromise]) as any;
    
    if (response.usageMetadata && auth.currentUser) {
      recordAiTokens(auth.currentUser.uid, response.usageMetadata.totalTokenCount || 0);
    }
    
    let text = response.text?.trim() || '';
    if (schema) {
      try {
        return JSON.parse(text);
      } catch (e) {
        const match = text.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : JSON.parse(text);
      }
    }
    return text;
  } catch (error: any) {
    throw new Error(`Kesalahan Layanan AI: ${error.message}`);
  }
}

export async function getCareerSwitchRecommendations(userData: any, stats: any) {
  const currentPos = userData.profile.currentPosition || "Karyawan";
  const prompt = `ANALYZE CAREER SWITCH OPPORTUNITIES for user.
  
  CURRENT DATA:
  - User Current Position: ${currentPos}
  - Top Skills: ${JSON.stringify(stats.dominantSkills)}
  - Activity Mix (90 Days): ${JSON.stringify(stats.mix)}
  
  TASK: Generate exactly 5 realistic and DISTINCT career options for a pivot.
  
  STRICT RULES FOR SENIORITY & SALARY:
  1. SENIORITY MATCHING: If the user is a "Manager", "Senior", "Lead", or "Head", DO NOT recommend "Entry Level" or "Junior" roles. Recommend equivalent levels (e.g., Manager in new field) or label it as "Naik Jabatan" if relevant. 
  2. REALISTIC IDR SALARY: Use current Indonesian market averages (Jakarta/BUMN/Startup standard). 
     - "Entry": Usually 6jt - 10jt IDR.
     - "Mid": Usually 12jt - 25jt IDR. 
     - Do not provide inflated or generic numbers. Adjust specifically for the job title.
  3. CATEGORIZED SKILLS: For each role, distinguish between "Hard Skills", "Soft Skills", and "Required Certifications".
  4. UNIQUE CONTENT: Ensure each of the 5 roles has a UNIQUE "learningProcess", UNIQUE "benefits", and UNIQUE "drawbacks" specifically tailored to that job title. NO GENERIC REPEATS.
  
  DISTRIBUTION (TOTAL 5 ITEMS):
  - 1: Adjacent (Low Risk).
  - 2-3: Intermediate (Medium Risk).
  - 4-5: Pivot (High Risk).
  
  Everything MUST be in Bahasa Indonesia.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      recommendations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            categoryLabel: { type: Type.STRING, description: "Rekomendasi Utama / Alternatif Menengah / Peluang Baru" },
            careerLevel: { type: Type.STRING, description: "Naik Jabatan / Setara / Level Entry" },
            position: { type: Type.STRING },
            industry: { type: Type.STRING },
            skillMatchPercent: { type: Type.NUMBER },
            requiredSkills: { 
              type: Type.OBJECT,
              properties: {
                hard: { type: Type.ARRAY, items: { type: Type.STRING } },
                soft: { type: Type.ARRAY, items: { type: Type.STRING } },
                certs: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            riskLevel: { type: Type.STRING },
            adaptationTime: { type: Type.STRING },
            learningProcess: { type: Type.STRING },
            mainChallenge: { type: Type.STRING },
            salaryRange: { 
              type: Type.OBJECT,
              properties: {
                entry: { type: Type.STRING, description: "e.g. 7.000.000" },
                mid: { type: Type.STRING, description: "e.g. 15.000.000" }
              }
            },
            benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
            drawbacks: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    },
    required: ["recommendations"]
  };

  const result = await callAI(prompt, schema);
  return result?.recommendations || [];
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

  const prompt = `ANALYZE CAREER QUALIFICATION FOR ${data.profile.name}. TARGET POSITION: ${data.profile.shortTermTarget || data.profile.currentPosition}. USER DATA: ${JSON.stringify(slimData)}. REQUIRED OUTPUT LANGUAGE: ${languageName}.`;
  
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

export async function analyzeCareerSwitch(userData: any, switchInputs: any): Promise<CareerSwitchAnalysis> {
  const prompt = `ANALISIS STRATEGIS PINDAH KARIR (CAREER SWITCH).
  
  DATA PENGGUNA SAAT INI:
  - Profil: ${JSON.stringify(userData.profile)}
  - Skill Dominan: ${JSON.stringify(switchInputs.dominantSkills)}
  - Mix Aktivitas (90 Hari): ${JSON.stringify(switchInputs.activityMix)}
  
  TARGET KARIR BARU:
  - Posisi: ${switchInputs.targetPosition}
  - Industri: ${switchInputs.targetIndustry}
  - Target Gaji: Rp ${Number(switchInputs.salaryTarget).toLocaleString()}
  - Gaji Entry Level Perkiraan: Rp ${Number(switchInputs.entrySalary).toLocaleString()}
  
  KESIAPAN & RISIKO:
  - Dana Darurat: ${switchInputs.emergencyFund}
  - Tanggung Jawab Finansial: ${switchInputs.responsibility}
  - Motivasi: ${switchInputs.motivation}
  
  TUGAS ANDA:
  Bandingkan data riil pengguna di atas dengan standard industri untuk role target. 
  Berikan Match Score (0-100), analisis risiko finansial dan psikologis.
  
  PENTING: Roadmap harus berisi 4 tahap persiapan 90 hari.
  Tanggapi dalam Bahasa Indonesia.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      matchScore: { type: Type.NUMBER },
      riskLevel: { type: Type.STRING },
      summary: { type: Type.STRING },
      skillComparison: {
        type: Type.OBJECT,
        properties: {
          userTopSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          targetRequiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          matchingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      },
      financialReadiness: { type: Type.STRING },
      psychologicalInsight: { type: Type.STRING },
      estimatedTransitionMonths: { type: Type.NUMBER },
      roadmap: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            step: { type: Type.STRING },
            detail: { type: Type.STRING }
          }
        }
      }
    },
    required: ["matchScore", "riskLevel", "summary", "skillComparison", "financialReadiness", "psychologicalInsight", "estimatedTransitionMonths", "roadmap"]
  };

  return await callAI(prompt, schema);
}

export async function analyzeJobMove(userData: any, moveInputs: any) {
  const prompt = `ANALISIS STRATEGIS PINDAH KERJA (JOB MOVE - ROLE SAMA).
  
  DATA PENGGUNA SAAT INI:
  - Profil & Skill: ${JSON.stringify(userData.profile)}
  - Skill Dominan: ${JSON.stringify(moveInputs.dominantSkills)}
  - Mood & Load (Historis): ${moveInputs.avgMood}/5
  
  TARGET PINDAH:
  - Target Gaji: Rp ${Number(moveInputs.salaryTarget).toLocaleString()}
  - Tipe Perusahaan: ${moveInputs.companyType}
  - Prioritas: ${moveInputs.priority}
  - Timeline Resign: ${moveInputs.timeline}
  
  ANALISIS:
  1. Apakah masalah utama user hanya lingkungan?
  2. Apakah skill saat ini masih align dengan target market?
  3. Estimasi waktu mendapatkan pekerjaan baru?
  4. Analisis risiko finansial resign berdasarkan Dana Darurat: ${moveInputs.emergencyFund}
  
  Tanggapi dalam Bahasa Indonesia.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      successProbability: { type: Type.NUMBER },
      riskIndex: { type: Type.NUMBER },
      summary: { type: Type.STRING },
      alignmentAnalysis: { type: Type.STRING },
      financialRiskAnalysis: { type: Type.STRING },
      estimatedMonthsToNewJob: { type: Type.NUMBER },
      strategy: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            step: { type: Type.STRING },
            detail: { type: Type.STRING }
          }
        }
      }
    },
    required: ["successProbability", "riskIndex", "summary", "alignmentAnalysis", "financialRiskAnalysis", "estimatedMonthsToNewJob", "strategy"]
  };

  return await callAI(prompt, schema);
}

export async function generateMoveNarrative(stats: any): Promise<string> {
  const prompt = `SISTEM ANALISIS KARIR STRATEGIS.
  Rangkai data statistik berikut menjadi narasi ringkas (maksimal 3 paragraf) dalam Bahasa Indonesia.
  DATA INPUT: ${JSON.stringify(stats)}
  
  INSTRUKSI KHUSUS:
  - Jangan mengembalikan format JSON. 
  - Jangan memberikan awalan seperti "Tentu," atau "Ini adalah analisanya".
  - Kembalikan HANYA teks narasi analisis yang padat, rasional, dan strategis.
  - Fokus pada alasan di balik probabilitas Arah Karir.`;
  return await callAI(prompt);
}

export async function summarizeMonthlyReview(reviewText: string) {
  return await callAI(`Summarize this review: ${reviewText}`);
}

export async function generateCareerInsight(data: AppData, audience: 'self' | 'supervisor', period: 'weekly' | 'monthly', contexts: string[]) {
  const prompt = `GENERATE A COMPREHENSIVE PERFORMANCE INSIGHT REPORT for user: ${data.profile.name}. ACTIVITY LOG DATA: ${JSON.stringify(data.dailyReports)}. LANGUAGE: BAHASA INDONESIA.`;
  
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

export async function generateInterviewScript(data: AppData, targetRole: string, targetIndustry: string, language: 'ID' | 'EN', tone: 'Formal' | 'Casual' | 'Corporate') {
  const slimData = {
    profile: {
      name: data.profile.name,
      pos: data.profile.currentPosition,
      exp: data.workExperiences.slice(0, 2).map(w => `${w.position} @ ${w.company}`)
    },
    skills: data.skills.sort((a, b) => b.currentLevel - a.currentLevel).slice(0, 3).map(s => s.name),
    achievements: data.achievements.slice(0, 2).map(a => a.title)
  };

  const prompt = `GENERATE INTERVIEW SCRIPT.
  
  CONTEXT:
  - User: ${JSON.stringify(slimData)}
  - Target: ${targetRole} in ${targetIndustry}
  - Lang: ${language === 'ID' ? 'ID' : 'EN'}
  - Tone: ${tone}
  
  INSTRUCTIONS:
  1. First, identify the most relevant interview questions for this role.
  2. Then, provide answers based on user's real data.
  3. Format as JSON. Use user's data ONLY. No fake info.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      elevatorPitch: { type: Type.STRING },
      commonQuestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING }
          }
        }
      },
      behavioralQuestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            starAnswer: {
              type: Type.OBJECT,
              properties: {
                situation: { type: Type.STRING },
                task: { type: Type.STRING },
                action: { type: Type.STRING },
                result: { type: Type.STRING }
              }
            }
          }
        }
      },
      questionsForInterviewer: { type: Type.ARRAY, items: { type: Type.STRING } },
      topHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
      weaknessFraming: {
        type: Type.OBJECT,
        properties: {
          weakness: { type: Type.STRING },
          framing: { type: Type.STRING },
          improvementPlan: { type: Type.STRING }
        }
      }
    },
    required: ["elevatorPitch", "commonQuestions", "behavioralQuestions", "questionsForInterviewer", "topHighlights", "weaknessFraming"]
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