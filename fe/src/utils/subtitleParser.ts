/**
 * Subtitle Parser Utilities
 * Handles VTT and SRT format parsing
 */

export interface ParsedCue {
  start: number;
  end: number;
  text: string;
}

/**
 * Parse timecode string to seconds
 * Supports formats: HH:MM:SS.mmm, MM:SS.mmm, SS.mmm
 */
export function parseTime(timeString: string): number {
  const normalized = timeString.trim().replace(",", ".");
  const parts = normalized.split(":");
  
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 3) {
    hours = Number(parts[0]) || 0;
    minutes = Number(parts[1]) || 0;
    seconds = Number(parts[2]) || 0;
  } else if (parts.length === 2) {
    minutes = Number(parts[0]) || 0;
    seconds = Number(parts[1]) || 0;
  } else {
    seconds = Number(parts[0]) || 0;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Parse WebVTT format subtitle file
 */
export function parseVtt(content: string): ParsedCue[] {
  const lines = content.replace(/\r/g, "").split("\n");
  const cues: ParsedCue[] = [];
  
  let i = 0;
  
  // Skip WEBVTT header
  if (lines[0]?.toUpperCase().startsWith("WEBVTT")) {
    i = 1;
  }

  while (i < lines.length) {
    // Skip empty lines
    while (i < lines.length && lines[i].trim() === "") {
      i++;
    }
    
    if (i >= lines.length) break;

    // Skip optional cue identifier
    if (lines[i] && !lines[i].includes("-->") && lines[i + 1]?.includes("-->")) {
      i++;
    }

    const timingLine = lines[i] || "";
    const timingMatch = timingLine.match(
      /(\d{1,2}:[\d:]{1,7}[.,]\d{1,3}|\d{1,2}:[\d:]{1,7})\s*-->\s*(\d{1,2}:[\d:]{1,7}[.,]\d{1,3}|\d{1,2}:[\d:]{1,7})/
    );

    if (!timingMatch) {
      i++;
      continue;
    }

    const start = parseTime(timingMatch[1]);
    const end = parseTime(timingMatch[2]);
    i++;

    // Collect text lines
    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      textLines.push(lines[i]);
      i++;
    }

    cues.push({
      start,
      end,
      text: textLines.join("\n")
    });
  }

  return cues;
}

/**
 * Parse SRT format subtitle file
 */
export function parseSrt(content: string): ParsedCue[] {
  const lines = content.replace(/\r/g, "").split("\n");
  const cues: ParsedCue[] = [];
  
  let i = 0;

  while (i < lines.length) {
    // Skip empty lines
    while (i < lines.length && lines[i].trim() === "") {
      i++;
    }
    
    if (i >= lines.length) break;

    // Skip sequence number
    if (/^\d+$/.test(lines[i].trim())) {
      i++;
    }

    const timingLine = lines[i] || "";
    const timingMatch = timingLine.match(
      /(\d{1,2}:[\d:]{1,7}[.,]\d{1,3}|\d{1,2}:[\d:]{1,7})\s*-->\s*(\d{1,2}:[\d:]{1,7}[.,]\d{1,3}|\d{1,2}:[\d:]{1,7})/
    );

    if (!timingMatch) {
      i++;
      continue;
    }

    const start = parseTime(timingMatch[1]);
    const end = parseTime(timingMatch[2]);
    i++;

    // Collect text lines
    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      textLines.push(lines[i]);
      i++;
    }

    cues.push({
      start,
      end,
      text: textLines.join("\n")
    });
  }

  return cues;
}

/**
 * Auto-detect format and parse
 */
export function parseSubtitle(content: string, filename?: string): ParsedCue[] {
  const lower = filename?.toLowerCase() || "";
  const isSrt = lower.endsWith(".srt");
  const isVtt = lower.endsWith(".vtt") || content.trim().toUpperCase().startsWith("WEBVTT");

  if (isSrt) {
    return parseSrt(content);
  }
  
  return parseVtt(content);
}