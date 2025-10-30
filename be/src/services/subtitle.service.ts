import { GoogleGenAI } from "@google/genai";
import { config } from "../config/config";

export class SubtitleService {
  private ai: GoogleGenAI;
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: config.gemini.api_key });
  }

  async translateSegments(
    segments: string[],
    sourceLang: string,
    targetLang: string
  ): Promise<string[]> {
    try {
      if (!Array.isArray(segments) || segments.length === 0) return [];

      const instruction = [
        "You are a translation engine.",
        `Translate each subtitle segment from ${sourceLang} to ${targetLang}.`,
        "Return ONLY a valid JSON array of translated strings,",
        "same length and order as input. No extra keys, no commentary.",
        "Preserve formatting, timestamps, tags, and numbers if present.",
      ].join(" ");

      const fullPrompt = `${instruction}\n\nSEGMENTS:\n${JSON.stringify(segments)}`;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: fullPrompt,
      } as any);

      const text: string = (response as any)?.text || (response as any)?.response?.text || "";
      const match = text.match(/\[[\s\S]*\]/);
      const jsonStr = match ? match[0] : text;
      try {
        const arr = JSON.parse(jsonStr);
        if (Array.isArray(arr)) return arr.map((s) => String(s ?? ""));
      } catch {}

      const fallback = text
        .split(/\r?\n/)
        .filter((l: string) => l.trim().length > 0);
      if (fallback.length === segments.length) return fallback;
      const out: string[] = [];
      for (let i = 0; i < segments.length; i++) out.push(fallback[i] || "");
      return out;
    } catch (error) {
      console.error("SubtitleService.translateSegments error:", error);
      return segments.map(() => "");
    }
  }
}
