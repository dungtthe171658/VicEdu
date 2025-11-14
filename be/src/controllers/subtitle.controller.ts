import { Request, Response } from "express";
import { SubtitleService } from "../services/subtitle.service";

const subtitleService = new SubtitleService();

type SubtitleFormat = "vtt" | "srt";

interface Cue {
  start: number; // seconds
  end: number; // seconds
  text: string;
}

function parseTimeToSeconds(s: string): number {
  const val = s.trim().replace(",", ".");
  const parts = val.split(":");
  let h = 0, m = 0, rest = "0";
  if (parts.length === 3) {
    h = Number(parts[0]) || 0;
    m = Number(parts[1]) || 0;
    rest = parts[2];
  } else if (parts.length === 2) {
    m = Number(parts[0]) || 0;
    rest = parts[1];
  } else {
    rest = parts[0];
  }
  const sec = Number(rest) || 0;
  return h * 3600 + m * 60 + sec;
}

function parseVTT(content: string): Cue[] {
  const lines = content.replace(/\r/g, "").split("\n");
  const cues: Cue[] = [];
  let i = 0;
  if (lines[0] && lines[0].toUpperCase().startsWith("WEBVTT")) {
    i = 1;
  }
  while (i < lines.length) {
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) break;
    if (lines[i] && !lines[i].includes("-->") && lines[i + 1] && lines[i + 1].includes("-->")) {
      i++;
    }
    const timeLine = lines[i] || "";
    const m = timeLine.match(/(\d{1,2}:[\d:]{1,7}[\.,]\d{1,3}|\d{1,2}:[\d:]{1,7})\s*-->\s*(\d{1,2}:[\d:]{1,7}[\.,]\d{1,3}|\d{1,2}:[\d:]{1,7})/);
    if (!m) { i++; continue; }
    const start = parseTimeToSeconds(m[1]);
    const end = parseTimeToSeconds(m[2]);
    i++;
    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") { textLines.push(lines[i]); i++; }
    cues.push({ start, end, text: textLines.join("\n") });
  }
  return cues;
}

function parseSRT(content: string): Cue[] {
  const lines = content.replace(/\r/g, "").split("\n");
  const cues: Cue[] = [];
  let i = 0;
  while (i < lines.length) {
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) break;
    if (/^\d+$/.test(lines[i].trim())) i++;
    const timeLine = lines[i] || "";
    const m = timeLine.match(/(\d{1,2}:[\d:]{1,7}[\.,]\d{1,3}|\d{1,2}:[\d:]{1,7})\s*-->\s*(\d{1,2}:[\d:]{1,7}[\.,]\d{1,3}|\d{1,2}:[\d:]{1,7})/);
    if (!m) { i++; continue; }
    const start = parseTimeToSeconds(m[1]);
    const end = parseTimeToSeconds(m[2]);
    i++;
    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") { textLines.push(lines[i]); i++; }
    cues.push({ start, end, text: textLines.join("\n") });
  }
  return cues;
}

function toWebVTT(cues: { start: number; end: number; text: string }[]): string {
  const fmt = (t: number) => {
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t - Math.floor(t)) * 1000);
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    const mss = String(ms).padStart(3, "0");
    return `${hh}:${mm}:${ss}.${mss}`;
  };
  const parts = ["WEBVTT", ""];
  cues.forEach((c) => {
    parts.push(`${fmt(c.start)} --> ${fmt(c.end)}`);
    parts.push(c.text);
    parts.push("");
  });
  return parts.join("\n");
}

export async function translateSubtitles(req: Request, res: Response) {
  try {
    const { format, content, sourceLang, targetLang } = (req.body || {}) as {
      format: SubtitleFormat;
      content: string;
      sourceLang: string;
      targetLang: string;
    };

    if (!content || !format) {
      return res.status(400).json({ message: "Missing content or format" });
    }

    const fmt = String(format || "vtt").toLowerCase() as SubtitleFormat;
    const cues = fmt === "vtt" ? parseVTT(content) : parseSRT(content);
    if (!cues.length) {
      return res.status(400).json({ message: "No cues parsed from content" });
    }

    const segments = cues.map((c) => c.text);
    const translated = await subtitleService.translateSegments(
      segments,
      sourceLang || "en",
      targetLang || "vi"
    );

    if (!translated || translated.length !== segments.length) {
      return res.status(500).json({ message: "Translation failed or mismatched segments" });
    }

    const merged = cues.map((c, idx) => ({
      start: c.start,
      end: c.end,
      source: c.text,
      target: translated[idx] || "",
    }));

    const targetVtt = toWebVTT(merged.map((m) => ({ start: m.start, end: m.end, text: m.target })));

    return res.json({ cues: merged, targetVtt });
  } catch (err: any) {
    console.error("translateSubtitles error:", err);
    return res.status(500).json({ message: err?.message || "Server error" });
  }
}

import mongoose from "mongoose";
import SubtitleModel from "../models/subtitle.model";

export async function getLessonSubtitles(req: Request, res: Response) {
  try {
    const { lessonId } = req.params as { lessonId: string };
    if (!lessonId || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "Invalid lessonId" });
    }
    const found = await SubtitleModel.findOne({ lesson_id: new mongoose.Types.ObjectId(lessonId) }).lean();
    if (!found) return res.status(404).json({ message: "Not found" });
    return res.json(found);
  } catch (err: any) {
    console.error("getLessonSubtitles error:", err);
    return res.status(500).json({ message: err?.message || "Server error" });
  }
}

export async function saveLessonSubtitles(req: Request, res: Response) {
  try {
    const { lessonId } = req.params as { lessonId: string };
    const { enVtt, viVtt, cues } = req.body || {};
    if (!lessonId || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "Invalid lessonId" });
    }
    const filter = { lesson_id: new mongoose.Types.ObjectId(lessonId) } as any;
    const update: any = {};
    if (typeof enVtt === 'string') update.en_vtt = enVtt;
    if (typeof viVtt === 'string') update.vi_vtt = viVtt;
    if (Array.isArray(cues)) update.cues = cues;

    const saved = await SubtitleModel.findOneAndUpdate(filter, { $set: update }, { upsert: true, new: true });
    return res.json(saved);
  } catch (err: any) {
    console.error("saveLessonSubtitles error:", err);
    return res.status(500).json({ message: err?.message || "Server error" });
  }
}
import LessonModel from "../models/lesson.model";
import { supabaseAdmin } from "../lib/supabase";
import { GeminiService } from "../services/gemini.service";

const geminiForAudio = new GeminiService();

export async function autoGenerateFromAudio(req: Request, res: Response) {
  try {
    const { lessonId } = req.params as { lessonId: string };
    if (!lessonId || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "Invalid lessonId" });
    }
    const lesson = await LessonModel.findById(lessonId).lean();
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    // Resolve a signed URL to fetch media bytes
    let mediaUrl: string | undefined = (lesson as any).playback_url || (lesson as any).video_url;
    if (!mediaUrl && (lesson as any).storage_provider === 'supabase' && (lesson as any).storage_path) {
      try {
        const bucket = (lesson as any).storage_bucket || 'videos';
        if (supabaseAdmin) {
          const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl((lesson as any).storage_path, 60 * 10);
          if (!error && data?.signedUrl) mediaUrl = data.signedUrl;
        }
      } catch {}
    }
    if (!mediaUrl) return res.status(404).json({ message: "No media URL to transcribe" });

    // Fetch a portion or full media (best effort). Prefer partial to limit size.
    let anyFetch: any = (global as any).fetch;   if (!anyFetch) { try { anyFetch = (await import('node-fetch')).default as any; } catch {} }   if (!anyFetch) return res.status(500).json({ message: 'No fetch available on server' });    const headers: any = { };    let resp = await anyFetch(mediaUrl, { headers });
    if (!resp.ok) return res.status(502).json({ message: `Fetch failed: ${resp.status}` });
    const buf = Buffer.from(await resp.arrayBuffer());

    // Try a common video mime type; Gemini should accept video for ASR.
    const mimeType = 'video/mp4';

    // Try transcribing in English first (most common for educational videos)
    let sourceText = await geminiForAudio.transcribeAudioToText(buf, mimeType, 'en');
    let sourceLang = 'en';
    let targetLang = 'vi';
    
    // If English transcription is empty or too short, try Vietnamese
    if (!sourceText || sourceText.trim().length < 10) {
      sourceText = await geminiForAudio.transcribeAudioToText(buf, mimeType, 'vi');
      if (sourceText && sourceText.trim().length >= 10) {
        sourceLang = 'vi';
        targetLang = 'en';
      } else {
        // If both fail, default to English
        sourceText = sourceText || "";
        sourceLang = 'en';
        targetLang = 'vi';
      }
    }

    if (!sourceText || sourceText.trim().length === 0) {
      return res.status(502).json({ message: "Transcription failed" });
    }

    // Translate to the target language
    const targetText = await geminiForAudio.translateText(sourceText, sourceLang, targetLang);

    // Return both texts with language indicators
    // For backward compatibility, also return as viText and enText
    if (sourceLang === 'en') {
      return res.json({ 
        sourceText, 
        targetText, 
        sourceLang: 'en', 
        targetLang: 'vi',
        enText: sourceText, 
        viText: targetText 
      });
    } else {
      return res.json({ 
        sourceText, 
        targetText, 
        sourceLang: 'vi', 
        targetLang: 'en',
        viText: sourceText, 
        enText: targetText 
      });
    }
  } catch (err: any) {
    console.error('autoGenerateFromAudio error:', err);
    return res.status(500).json({ message: err?.message || 'Server error' });
  }
}

