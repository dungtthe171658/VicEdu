import axios from "./axios";

export type SubtitleFormat = "vtt" | "srt";

export interface BilingualCue {
  start: number;
  end: number;
  source: string; // original (e.g., English)
  target: string; // translated (e.g., Vietnamese)
}

export interface TranslateResponse {
  cues: BilingualCue[];
  targetVtt: string;
}

export interface SubtitleRecord {
  _id?: string;
  lesson_id: string;
  en_vtt?: string;
  vi_vtt?: string;
  cues?: BilingualCue[];
  updated_at?: string;
}

export const subtitleApi = {
  translate: (content: string, format: SubtitleFormat, sourceLang = "en", targetLang = "vi"): Promise<TranslateResponse> =>
    axios.post('/subtitles/translate', { content, format, sourceLang, targetLang }),

  get: (lessonId: string): Promise<SubtitleRecord> =>
    axios.get(`/subtitles/${lessonId}`),

  save: (lessonId: string, data: { enVtt?: string; viVtt?: string; cues?: BilingualCue[] }): Promise<SubtitleRecord> =>
    axios.post(`/subtitles/${lessonId}/save`, data),

  autoGenerate: (lessonId: string): Promise<{ 
    viText: string; 
    enText: string; 
    sourceText?: string; 
    targetText?: string; 
    sourceLang?: string; 
    targetLang?: string; 
  }> =>
    axios.post(`/subtitles/${lessonId}/auto-generate`),
};
