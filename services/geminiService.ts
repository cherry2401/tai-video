import { GoogleGenAI, Type } from "@google/genai";
import { DownloadResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeLinks = async (urls: string[]): Promise<DownloadResult[]> => {
  if (urls.length === 0) return [];

  // Filter out empty strings
  const validUrls = urls.filter(u => u.trim().length > 0);
  
  if (validUrls.length === 0) return [];

  const prompt = `
    Analyze the following video URLs. For each URL, identify the platform (e.g., Shopee, TikTok, Facebook, YouTube) 
    and generate a plausible, short video title based on the URL structure or a generic name if unknown.
    
    URLs:
    ${validUrls.join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              url: { type: Type.STRING },
              platform: { type: Type.STRING },
              title: { type: Type.STRING }
            },
            required: ["url", "platform", "title"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");

    return data.map((item: any, index: number) => ({
      id: `res-${Date.now()}-${index}`,
      originalUrl: item.url,
      platform: item.platform,
      title: item.title,
      status: 'success',
      thumbnail: `https://picsum.photos/300/200?random=${index}` // Placeholder thumbnail
    }));

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    // Fallback if AI fails
    return validUrls.map((url, index) => ({
      id: `err-${index}`,
      originalUrl: url,
      platform: "Unknown",
      title: "Could not analyze link",
      status: 'error'
    }));
  }
};