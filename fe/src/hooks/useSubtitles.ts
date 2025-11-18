/**
 * Custom hook for managing subtitle state and operations
 */

import { useEffect, useRef, useState } from "react";
import { subtitleApi, type BilingualCue, type SubtitleFormat } from "../api/subtitleApi";
import { parseSubtitle } from "../utils/subtitleParser";
import { generateBilingualCues } from "../services/subtitleGenerator";

export type SubtitleMode = "both" | "en" | "vi";

interface UseSubtitlesOptions {
  lessonId: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  isEnrolled: boolean;
}

interface UseSubtitlesReturn {
  // State
  cues: BilingualCue[];
  mode: SubtitleMode;
  visible: boolean;
  loading: boolean;
  
  // Actions
  setMode: (mode: SubtitleMode) => void;
  setVisible: (visible: boolean) => void;
  toggleVisible: () => void;
  uploadEnglish: (file: File) => Promise<void>;
  uploadVietnamese: (file: File) => Promise<void>;
  autoGenerate: () => Promise<void>;
  
  // Refs for file inputs
  englishInputRef: React.RefObject<HTMLInputElement>;
  vietnameseInputRef: React.RefObject<HTMLInputElement>;
}

export function useSubtitles({
  lessonId,
  videoRef,
  isEnrolled,
}: UseSubtitlesOptions): UseSubtitlesReturn {
  
  const [cues, setCues] = useState<BilingualCue[]>([]);
  const [mode, setMode] = useState<SubtitleMode>("vi");
  const [visible, setVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const englishInputRef = useRef<HTMLInputElement>(null);
  const vietnameseInputRef = useRef<HTMLInputElement>(null);

  // Load saved subtitles when lesson changes
  useEffect(() => {
    if (!lessonId) {
      setCues([]);
      setVisible(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const record = await subtitleApi.get(lessonId);
        
        if (!cancelled && record?.cues && record.cues.length > 0) {
          setCues(record.cues);
          setVisible(false); // Loaded but hidden by default
        } else {
          setCues([]);
          setVisible(false);
        }
      } catch {
        if (!cancelled) {
          setCues([]);
          setVisible(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  // Hide subtitles when video source changes
  useEffect(() => {
    setVisible(false);
  }, [videoRef.current?.src]);

  // Upload English subtitle (with translation)
  const uploadEnglish = async (file: File): Promise<void> => {
    if (!lessonId) return;

    try {
      setLoading(true);
      
      const text = await file.text();
      const lower = file.name.toLowerCase();
      const isSrt = lower.endsWith(".srt");
      const isVtt = lower.endsWith(".vtt") || text.trim().toUpperCase().startsWith("WEBVTT");
      const format: SubtitleFormat = isSrt ? "srt" : isVtt ? "vtt" : "vtt";

      const response = await subtitleApi.translate(text, format, "en", "vi");
      const translatedCues = response.cues || [];

      setCues(translatedCues);
      setVisible(true);

      // Persist to backend
      await subtitleApi.save(lessonId, {
        enVtt: text,
        viVtt: response.targetVtt,
        cues: translatedCues,
      });
    } catch (error) {
      console.error("English subtitle upload error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Upload Vietnamese subtitle (no translation)
  const uploadVietnamese = async (file: File): Promise<void> => {
    if (!lessonId) return;

    try {
      setLoading(true);
      
      const text = await file.text();
      const parsedCues = parseSubtitle(text, file.name);

      // Convert to bilingual format (source empty)
      const bilingualCues: BilingualCue[] = parsedCues.map(cue => ({
        start: cue.start,
        end: cue.end,
        source: "",
        target: cue.text,
      }));

      setCues(bilingualCues);
      setVisible(true);

      // Persist to backend
      await subtitleApi.save(lessonId, {
        viVtt: text,
        cues: bilingualCues,
      });
    } catch (error) {
      console.error("Vietnamese subtitle upload error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate bilingual subtitles
  const autoGenerate = async (): Promise<void> => {
    if (!lessonId) {
      throw new Error("No lesson selected");
    }

    try {
      setLoading(true);

      const video = videoRef.current;
      const duration = video && isFinite(video.duration) ? video.duration : 0;

      // Call backend to generate transcription
      const response = await subtitleApi.autoGenerate(lessonId);

      // Get source and target texts
      const sourceLang = response.sourceLang || 'en';
      const targetLang = response.targetLang || 'vi';
      const sourceText = response.sourceText || 
                         (sourceLang === 'en' ? response.enText : response.viText) || "";
      const targetText = response.targetText || 
                         (targetLang === 'vi' ? response.viText : response.enText) || "";

      if (!sourceText || !targetText) {
        throw new Error("Failed to generate subtitle text");
      }

      // Generate timed cues
      const generatedCues = generateBilingualCues(sourceText, targetText, duration);

      setCues(generatedCues);
      setMode("vi"); // Show Vietnamese by default
      setVisible(true);

      // Persist to backend
      await subtitleApi.save(lessonId, { cues: generatedCues });
    } catch (error) {
      console.error("Auto-generate subtitles failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const toggleVisible = () => {
    setVisible(prev => !prev);
  };

  return {
    // State
    cues,
    mode,
    visible,
    loading,
    
    // Actions
    setMode,
    setVisible,
    toggleVisible,
    uploadEnglish,
    uploadVietnamese,
    autoGenerate,
    
    // Refs
    englishInputRef,
    vietnameseInputRef,
  };
}