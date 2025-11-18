/**
 * Subtitle Generator Service
 * Handles auto-generation of bilingual subtitles with timing
 */

import type { BilingualCue } from "../api/subtitleApi";

interface TextProcessingConfig {
  minCharsPerFragment: number;
  maxCharsPerLine: number;
  charsPerSecond: number;
  baseEntryPause: number;
  minDuration: number;
  maxDuration: number;
  cueGap: number;
}

const DEFAULT_CONFIG: TextProcessingConfig = {
  minCharsPerFragment: 18,
  maxCharsPerLine: 90,
  charsPerSecond: 14,
  baseEntryPause: 0.4,
  minDuration: 1.2,
  maxDuration: 6.5,
  cueGap: 0.08,
};

/**
 * Normalize text: remove extra whitespace, fix punctuation spacing
 */
function normalizeText(text: string): string {
  return text
    .replace(/[\t\f\v]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+(?=[.,!?…])/g, "")
    .trim();
}

/**
 * Split text into sentences
 */
function splitSentences(text: string): string[] {
  const cleaned = normalizeText(text).replace(/\.\.\./g, "…");
  const rawSentences = cleaned.split(/(?<=[.!?…])\s+/g).filter(Boolean);
  
  return rawSentences
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Merge short fragments to maintain minimum length
 */
function mergeShortFragments(sentences: string[], minChars: number): string[] {
  const result: string[] = [];
  
  for (const sentence of sentences) {
    const lastSentence = result[result.length - 1];
    
    if (lastSentence && (lastSentence.length < minChars || sentence.length < minChars)) {
      result[result.length - 1] = `${lastSentence} ${sentence}`.replace(/\s+/g, " ").trim();
    } else {
      result.push(sentence);
    }
  }
  
  return result;
}

/**
 * Split sentences that are too long
 */
function splitTooLong(sentences: string[], maxChars: number): string[] {
  const result: string[] = [];
  
  for (const sentence of sentences) {
    if (sentence.length <= maxChars) {
      result.push(sentence);
      continue;
    }

    const mid = Math.floor(sentence.length / 2);
    const punctuationRegex = /[,;:\u2014\u2013]/g;
    let breakPosition = -1;
    let match: RegExpExecArray | null;

    // Find best punctuation break near middle
    while ((match = punctuationRegex.exec(sentence))) {
      if (Math.abs(match.index - mid) < Math.abs(breakPosition - mid) || breakPosition === -1) {
        breakPosition = match.index + 1;
      }
    }

    // Fallback to space if no punctuation found
    if (breakPosition === -1) {
      const leftSpace = sentence.lastIndexOf(" ", mid);
      const rightSpace = sentence.indexOf(" ", mid + 1);
      const pick = leftSpace >= 0 ? leftSpace : rightSpace >= 0 ? rightSpace : -1;
      breakPosition = pick >= 0 ? pick + 1 : -1;
    }

    if (breakPosition > 0 && breakPosition < sentence.length) {
      const firstPart = sentence.slice(0, breakPosition).trim();
      const secondPart = sentence.slice(breakPosition).trim();
      
      if (firstPart) result.push(firstPart);
      if (secondPart) result.push(secondPart);
    } else {
      result.push(sentence);
    }
  }
  
  return result;
}

/**
 * Estimate duration for a sentence based on character count
 */
function estimateDuration(text: string, config: TextProcessingConfig): number {
  const baseDuration = config.baseEntryPause + text.length / config.charsPerSecond;
  return Math.max(config.minDuration, Math.min(config.maxDuration, baseDuration));
}

/**
 * Wrap text into two lines if needed
 */
function wrapToTwoLines(text: string, maxLineLength: number = 42): string {
  if (text.length <= maxLineLength) {
    return text;
  }

  const spaceIndex = text.lastIndexOf(" ", maxLineLength);
  
  if (spaceIndex > 0 && spaceIndex < text.length - 1) {
    return `${text.slice(0, spaceIndex).trim()}\n${text.slice(spaceIndex + 1).trim()}`;
  }

  return text;
}

/**
 * Generate bilingual cues with timing from source and target texts
 */
export function generateBilingualCues(
  sourceText: string,
  targetText: string,
  videoDuration: number = 0,
  config: Partial<TextProcessingConfig> = {}
): BilingualCue[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Process both texts
  const sourceSentences0 = splitSentences(sourceText);
  const targetSentences0 = splitSentences(targetText);

  // Align to same length
  const maxLength = Math.max(sourceSentences0.length, targetSentences0.length);
  
  const sourceSentences = splitTooLong(
    mergeShortFragments(sourceSentences0, finalConfig.minCharsPerFragment),
    finalConfig.maxCharsPerLine
  ).slice(0, maxLength);

  const targetSentences = splitTooLong(
    mergeShortFragments(targetSentences0, finalConfig.minCharsPerFragment),
    finalConfig.maxCharsPerLine
  ).slice(0, maxLength);

  // Calculate durations
  const durations = sourceSentences.map(s => estimateDuration(s, finalConfig));
  const totalEstimated = durations.reduce((sum, d) => sum + d, 0);
  
  // Scale to fit video duration
  const targetDuration = videoDuration > 0 ? videoDuration : Math.max(sourceSentences.length * 3, 30);
  const scaleFactor = totalEstimated > 0 ? targetDuration / totalEstimated : 1;
  
  const scaledDurations = durations.map(d => 
    Math.max(0.9, Math.min(7.5, d * scaleFactor))
  );

  // Generate cues
  const cues: BilingualCue[] = [];
  let currentTime = 0;

  for (let i = 0; i < sourceSentences.length; i++) {
    const source = sourceSentences[i] || "";
    const target = targetSentences[i] || "";
    const start = currentTime;
    const end = start + scaledDurations[i];

    cues.push({
      start: Math.max(0, start),
      end: Math.max(start + 0.1, end),
      source: wrapToTwoLines(source),
      target: wrapToTwoLines(target),
    });

    currentTime = end + finalConfig.cueGap;
  }

  // Adjust if overshoot video duration
  if (videoDuration > 0 && cues.length > 0) {
    const lastCue = cues[cues.length - 1];
    const overshoot = lastCue.end - videoDuration;

    if (overshoot > 0) {
      const shrinkPerCue = overshoot / cues.length;
      let accumulated = 0;

      for (let i = 0; i < cues.length; i++) {
        accumulated += shrinkPerCue;
        const newStart = Math.max(0, cues[i].start - accumulated);
        const newEnd = Math.max(newStart + 0.1, cues[i].end - accumulated);
        
        cues[i].start = newStart;
        cues[i].end = newEnd;
      }

      // Final adjustment for last cue
      const finalCue = cues[cues.length - 1];
      const remainingDelta = finalCue.end - videoDuration;
      if (remainingDelta !== 0) {
        finalCue.end -= remainingDelta;
      }
    }
  }

  return cues;
}