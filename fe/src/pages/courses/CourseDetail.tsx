import { useLocation, useParams, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Star, Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import courseApi from "../../api/courseApi";
import enrollmentApi from "../../api/enrollmentApi";
import type { Course } from "../../types/course";
import { useCart } from "../../contexts/CartContext";
import lessonApi from "../../api/lessonApi";
import type { Lesson } from "../../types/lesson";
import reviewClient, { type ReviewDto } from "../../api/reviewClient";
import BilingualSubtitles from "../../components/video/BilingualSubtitles";
import { subtitleApi, type SubtitleFormat, type BilingualCue } from "../../api/subtitleApi";
import { useAuth } from "../../hooks/useAuth";
import commentApi from "../../api/commentApi";
import type { LessonComment } from "../../types/comment";

export default function CourseDetail() {
  const { slug } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>((location.state as any)?.course || null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);

  // Lessons + playback
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string>("");
  const [loadingPlayback, setLoadingPlayback] = useState(false);

  // Subtitles
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputEnRef = useRef<HTMLInputElement>(null);
  const fileInputViRef = useRef<HTMLInputElement>(null);
  const [subCues, setSubCues] = useState<BilingualCue[]>([]);
  const [subMode, setSubMode] = useState<"both" | "en" | "vi">("vi");
  const [subVisible, setSubVisible] = useState<boolean>(false);
  const [loadingSubs, setLoadingSubs] = useState<boolean>(false);

  // Reviews
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<{ count: number; average: number; breakdown: Record<string, number> } | null>(null);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string>("");

  // Lesson discussions
  const [threads, setThreads] = useState<LessonComment[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [questionInput, setQuestionInput] = useState("");
  const [postingQuestion, setPostingQuestion] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<Record<string, boolean>>({});
  const [threadFilter, setThreadFilter] = useState<"all" | "open" | "resolved">("all");
  const [discussionMessage, setDiscussionMessage] = useState<string>("");
  const [replyBoxOpen, setReplyBoxOpen] = useState<Record<string, boolean>>({});

  // Tabs: Q&A vs Reviews
  const [activeTab, setActiveTab] = useState<"qa" | "reviews">("qa");
  const { addCourse, courses, removeCourse } = useCart();

  // Normalize various Mongo-like ID shapes to a string id
  const toId = (val: any): string => {
    if (val == null) return "";
    if (typeof val === "object") {
      if ((val as any).$oid) return String((val as any).$oid);
      if ((val as any)._id) return String((val as any)._id);
    }
    return String(val);
  };

  // Load course by slug when direct access
  useEffect(() => {
    (async () => {
      try {
        if (!course && slug) {
          const data = await courseApi.getBySlug(slug);
          setCourse(data);
        }
      } catch (err) {
        console.error("Failed to load course:", err);
      }
    })();
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve enrolled status
  useEffect(() => {
    (async () => {
      try {
        if (!course) return;
        const ids = await enrollmentApi.getMyEnrolledCourseIds();
        setIsEnrolled(ids.has(toId((course as any)._id)));
      } catch {
        setIsEnrolled(false);
      }
    })();
  }, [course]);

  // Load lessons when course is ready
  useEffect(() => {
    (async () => {
      if (!course?._id) return;
      try {
        setLoadingLessons(true);
        const list = await lessonApi.listByCourse(toId((course as any)._id));
        const arr = Array.isArray(list) ? list : [];
        setLessons(arr);
        if (arr.length > 0) setSelectedLessonId(arr[0]._id);
      } catch (e) {
        console.warn("Could not load lessons list", e);
      } finally {
        setLoadingLessons(false);
      }
    })();
  }, [course?._id]);

  // Fetch playback URL only if user enrolled and selected lesson changes
  useEffect(() => {
    (async () => {
      setPlaybackUrl("");
      if (!selectedLessonId) return;
      if (!isEnrolled) return;
      try {
        setLoadingPlayback(true);
        const data = await lessonApi.playback(selectedLessonId);
        const url = (data as any)?.playbackUrl || (data as any)?.url;
        if (typeof url === "string") setPlaybackUrl(url);
      } catch {
        setPlaybackUrl("");
      } finally {
        setLoadingPlayback(false);
      }
    })();
  }, [selectedLessonId, isEnrolled]);

  // Load reviews + summary for course
  useEffect(() => {
    (async () => {
      const id = toId((course as any)?._id);
      if (!id) return;
      try {
        setLoadingReviews(true);
        const [listRes, sumRes] = await Promise.allSettled([
          reviewClient.listForCourse(id),
          reviewClient.getCourseSummary(id),
        ]);
        if (listRes.status === "fulfilled" && Array.isArray(listRes.value)) {
          setReviews(listRes.value);
        } else {
          setReviews([]);
        }
        if (sumRes.status === "fulfilled" && sumRes.value) {
          setReviewSummary(sumRes.value as any);
        } else {
          setReviewSummary(null);
        }
      } finally {
        setLoadingReviews(false);
      }
    })();
  }, [course?._id]);

  // Auto-load saved subtitles for this lesson
  useEffect(() => {
    (async () => {
      if (!selectedLessonId) return;
      try {
        const rec = await subtitleApi.get(selectedLessonId);
        if (rec?.cues && rec.cues.length > 0) {
          setSubCues(rec.cues);
          setSubVisible(false); // loaded but hidden by default
        } else {
          setSubCues([]);
          setSubVisible(false);
        }
      } catch {
        setSubCues([]);
        setSubVisible(false);
      }
    })();
  }, [selectedLessonId]);

  // Reset subs when playback url changes
  useEffect(() => {
    setSubVisible(false);
  }, [playbackUrl]);

  // Load discussion threads when lesson changes
  useEffect(() => {
    setReplyDrafts({});
    if (!selectedLessonId) {
      setThreads([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingThreads(true);
      setDiscussionMessage("");
      try {
        const params = threadFilter === "all" ? undefined : { status: threadFilter };
        const res = await commentApi.listByLesson(selectedLessonId, params);
        if (!cancelled) {
          setThreads(Array.isArray(res?.data) ? res.data : []);
        }
      } catch (error: any) {
        if (!cancelled) {
          setThreads([]);
          setDiscussionMessage(error?.message || "Không thể tải hỏi đáp cho bài học này.");
        }
      } finally {
        if (!cancelled) setLoadingThreads(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedLessonId, threadFilter]);

  const isInCart = courses.some((c) => (c as any)._id === (course as any)?._id);

  const formatVND = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

  const categoryName = useMemo(() => {
    const cat = (course as any)?.category;
    if (Array.isArray(cat) && cat.length > 0) return cat[0]?.name || "Chưa có danh mục";
    return "Chưa có danh mục";
  }, [course]);

  const selectedLesson = useMemo(
    () => lessons.find((ls) => ls._id === selectedLessonId) || null,
    [lessons, selectedLessonId]
  );

  const canParticipate = Boolean(user && (isEnrolled || user?.role === "teacher" || user?.role === "admin"));
  const canModerate = Boolean(user && (user?.role === "teacher" || user?.role === "admin"));

  const formatTimestamp = (iso?: string) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.valueOf())) return "";
    return date.toLocaleString("vi-VN");
  };

  const handleAskQuestion = async () => {
    if (!selectedLessonId) return;
    const message = questionInput.trim();
    if (!message) return;
    setPostingQuestion(true);
    setDiscussionMessage("");
    try {
      const created = await commentApi.create({ lesson_id: selectedLessonId, content: message });
      setThreads((prev) => [{ ...created, replies: created.replies || [] }, ...prev]);
      setQuestionInput("");
    } catch (error: any) {
      setDiscussionMessage(error?.message || "Không thể gửi câu hỏi. Vui lòng thử lại.");
    } finally {
      setPostingQuestion(false);
    }
  };

  const handleReplySubmit = async (thread: LessonComment) => {
    const text = replyDrafts[thread._id]?.trim();
    if (!text) return;
    const lessonId = thread.lesson?._id || selectedLessonId;
    if (!lessonId) return;
    setReplying((prev) => ({ ...prev, [thread._id]: true }));
    setDiscussionMessage("");
    try {
      const created = await commentApi.create({ lesson_id: lessonId, parent_id: thread._id, content: text });
      setThreads((prev) =>
        prev.map((item) =>
          item._id === thread._id
            ? {
                ...item,
                replies: [...(item.replies || []), created],
                reply_count: (item.reply_count || 0) + 1,
                teacher_reply_count:
                  created.user?.role === "teacher" || created.user?.role === "admin"
                    ? (item.teacher_reply_count || 0) + 1
                    : item.teacher_reply_count,
                last_activity_at: created.created_at || item.last_activity_at,
              }
            : item
        )
      );
      setReplyDrafts((prev) => ({ ...prev, [thread._id]: "" }));
    } catch (error: any) {
      setDiscussionMessage(error?.message || "Không thể gửi phản hồi.");
    } finally {
      setReplying((prev) => ({ ...prev, [thread._id]: false }));
    }
  };

  const handleToggleThreadStatus = async (thread: LessonComment) => {
    const nextStatus = thread.status === "resolved" ? "open" : "resolved";
    try {
      const updated = await commentApi.updateStatus(thread._id, nextStatus);
      setThreads((prev) =>
        prev.map((item) =>
          item._id === thread._id ? { ...item, status: updated.status, resolved_at: updated.resolved_at } : item
        )
      );
    } catch (error: any) {
      setDiscussionMessage(error?.message || "Không thể cập nhật trạng thái câu hỏi.");
    }
  };

  // Helpers: parse VTT/SRT on FE (for native VI upload)
  const parseTime = (s: string): number => {
    const val = s.trim().replace(",", ".");
    const parts = val.split(":");
    let h = 0,
      m = 0,
      rest = "0";
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
  };

  const parseVtt = (content: string) => {
    const lines = content.replace(/\r/g, "").split("\n");
    const cues: Array<{ start: number; end: number; text: string }> = [];
    let i = 0;
    if (lines[0] && lines[0].toUpperCase().startsWith("WEBVTT")) i = 1;
    while (i < lines.length) {
      while (i < lines.length && lines[i].trim() === "") i++;
      if (i >= lines.length) break;
      if (lines[i] && !lines[i].includes("-->") && lines[i + 1] && lines[i + 1].includes("-->")) i++;
      const tl = lines[i] || "";
      const m = tl.match(
        /(\d{1,2}:[\d:]{1,7}[\.,]\d{1,3}|\d{1,2}:[\d:]{1,7})\s*-->\s*(\d{1,2}:[\d:]{1,7}[\.,]\d{1,3}|\d{1,2}:[\d:]{1,7})/
      );
      if (!m) {
        i++;
        continue;
      }
      const start = parseTime(m[1]);
      const end = parseTime(m[2]);
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i]);
        i++;
      }
      cues.push({ start, end, text: textLines.join("\n") });
    }
    return cues;
  };

  const parseSrt = (content: string) => {
    const lines = content.replace(/\r/g, "").split("\n");
    const cues: Array<{ start: number; end: number; text: string }> = [];
    let i = 0;
    while (i < lines.length) {
      while (i < lines.length && lines[i].trim() === "") i++;
      if (i >= lines.length) break;
      if (/^\d+$/.test(lines[i].trim())) i++;
      const tl = lines[i] || "";
      const m = tl.match(
        /(\d{1,2}:[\d:]{1,7}[\.,]\d{1,3}|\d{1,2}:[\d:]{1,7})\s*-->\s*(\d{1,2}:[\d:]{1,7}[\.,]\d{1,3}|\d{1,2}:[\d:]{1,7})/
      );
      if (!m) {
        i++;
        continue;
      }
      const start = parseTime(m[1]);
      const end = parseTime(m[2]);
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i]);
        i++;
      }
      cues.push({ start, end, text: textLines.join("\n") });
    }
    return cues;
  };

  const handleUploadEnglish = async (file: File) => {
    if (!selectedLessonId) return;
    try {
      setLoadingSubs(true);
      const text = await file.text();
      const lower = file.name.toLowerCase();
      const isSrt = lower.endsWith(".srt");
      const isVtt = lower.endsWith(".vtt") || text.trim().toUpperCase().startsWith("WEBVTT");
      const fmt: SubtitleFormat = isSrt ? "srt" : isVtt ? "vtt" : "vtt";
      const resp = await subtitleApi.translate(text, fmt, "en", "vi");
      const cues = resp.cues || [];
      setSubCues(cues);
      setSubVisible(true);
      // persist
      await subtitleApi.save(selectedLessonId, { enVtt: text, viVtt: resp.targetVtt, cues });
    } catch (e) {
      console.error("Subtitle translation error:", e);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleUploadVietnamese = async (file: File) => {
    if (!selectedLessonId) return;
    try {
      setLoadingSubs(true);
      const text = await file.text();
      const lower = file.name.toLowerCase();
      const isSrt = lower.endsWith(".srt");
      const isVtt = lower.endsWith(".vtt") || text.trim().toUpperCase().startsWith("WEBVTT");
      const base = isSrt ? parseSrt(text) : parseVtt(text);
      const cues: BilingualCue[] = base.map((c) => ({ start: c.start, end: c.end, source: "", target: c.text }));
      setSubCues(cues);
      setSubVisible(true);
      await subtitleApi.save(selectedLessonId, { viVtt: text, cues });
    } catch (e) {
      console.error("Subtitle parse error:", e);
    } finally {
      setLoadingSubs(false);
    }
  };

  // Tự tạo phụ đề song ngữ (EN + VI)
  const handleAutoGenerateBilingual = async () => {
    try {
      setLoadingSubs(true);
      const video = videoRef.current;
      const duration = video && isFinite((video as any).duration) ? (video as any).duration : 0;
      if (!selectedLessonId) throw new Error("No lesson");
      const r = await subtitleApi.autoGenerate(selectedLessonId);

      // Get source and target texts based on detected language
      const sourceLang = (r as any).sourceLang || 'en';
      const targetLang = (r as any).targetLang || 'vi';
      const sourceText = (r as any).sourceText || (sourceLang === 'en' ? (r as any).enText : (r as any).viText) || "";
      const targetText = (r as any).targetText || (targetLang === 'vi' ? (r as any).viText : (r as any).enText) || "";

      if (!sourceText || !targetText) {
        throw new Error("Không thể tạo phụ đề. Vui lòng thử lại.");
      }

      const normalize = (t: string) =>
        (t || "")
          .replace(/[\t\f\v]+/g, " ")
          .replace(/\s+/g, " ")
          .replace(/\s+(?=[\.,!?…])/g, "")
          .trim();

      const splitSentences = (t: string): string[] => {
        const cleaned = normalize(t).replace(/\.\.\./g, "…");
        const raw = cleaned.split(/(?<=[\.!?…])\s+/g).filter(Boolean);
        const out: string[] = [];
        for (const s of raw) {
          const trimmed = s.trim();
          if (!trimmed) continue;
          out.push(trimmed);
        }
        return out;
      };

      const mergeShortFragments = (arr: string[], minChars = 18): string[] => {
        const out: string[] = [];
        for (const s of arr) {
          const last = out[out.length - 1];
          if (last && (last.length < minChars || s.length < minChars)) {
            out[out.length - 1] = `${last} ${s}`.replace(/\s+/g, " ").trim();
          } else {
            out.push(s);
          }
        }
        return out;
      };

      const splitTooLong = (arr: string[], maxChars = 90): string[] => {
        const out: string[] = [];
        for (const s of arr) {
          if (s.length <= maxChars) {
            out.push(s);
            continue;
          }
          const mid = Math.floor(s.length / 2);
          const punct = /[,;:\u2014\u2013]/g;
          let breakPos = -1;
          let m: RegExpExecArray | null;
          while ((m = punct.exec(s))) {
            if (Math.abs(m.index - mid) < Math.abs(breakPos - mid) || breakPos === -1) {
              breakPos = m.index + 1;
            }
          }
          if (breakPos === -1) {
            const leftSpace = s.lastIndexOf(" ", mid);
            const rightSpace = s.indexOf(" ", mid + 1);
            const pick = leftSpace >= 0 ? leftSpace : rightSpace >= 0 ? rightSpace : -1;
            breakPos = pick >= 0 ? pick + 1 : -1;
          }
          if (breakPos > 0 && breakPos < s.length) {
            const a = s.slice(0, breakPos).trim();
            const b = s.slice(breakPos).trim();
            if (a) out.push(a);
            if (b) out.push(b);
          } else {
            out.push(s);
          }
        }
        return out;
      };

      // Process both source and target texts
      const sourceSentences0 = splitSentences(sourceText);
      const targetSentences0 = splitSentences(targetText);
      
      // Align sentence counts by using the longer array as reference
      const maxLen = Math.max(sourceSentences0.length, targetSentences0.length);
      const sourceSentences = splitTooLong(mergeShortFragments(sourceSentences0)).slice(0, maxLen);
      const targetSentences = splitTooLong(mergeShortFragments(targetSentences0)).slice(0, maxLen);

      // Use source text for duration estimation (usually more accurate)
      const estimateDurSec = (s: string) => {
        const cps = 14; // chars per second
        const base = 0.4; // entry pause
        const sec = base + Math.max(0, s.length) / cps;
        return Math.max(1.2, Math.min(6.5, sec));
      };

      const targetDur = duration > 0 ? duration : Math.max(sourceSentences.length * 3, 30);
      let durArr = sourceSentences.map(estimateDurSec);
      const sum = durArr.reduce((a, b) => a + b, 0);
      const scale = sum > 0 ? targetDur / sum : 1;
      durArr = durArr.map((d) => Math.max(0.9, Math.min(7.5, d * scale)));

      const gap = 0.08;
      const cues: BilingualCue[] = [];
      let cursor = 0;
      for (let i = 0; i < sourceSentences.length; i++) {
        const sourceText = sourceSentences[i] || "";
        const targetText = targetSentences[i] || "";
        const start = cursor;
        const end = start + durArr[i];
        const wrapTwoLines = (t: string): string => {
          const maxLine = 42;
          if (t.length <= maxLine) return t;
          const idx = t.lastIndexOf(" ", maxLine);
          if (idx > 0 && idx < t.length - 1) {
            return `${t.slice(0, idx).trim()}\n${t.slice(idx + 1).trim()}`;
          }
          return t;
        };
        cues.push({ 
          start: Math.max(0, start), 
          end: Math.max(start + 0.1, end), 
          source: wrapTwoLines(sourceText), 
          target: wrapTwoLines(targetText) 
        });
        cursor = end + gap;
      }

      if (duration > 0 && cues.length > 0) {
        const overshoot = cues[cues.length - 1].end - duration;
        if (overshoot > 0) {
          const shrink = overshoot / cues.length;
          let acc = 0;
          for (let i = 0; i < cues.length; i++) {
            acc += shrink;
            const newStart = Math.max(0, cues[i].start - acc);
            const newEnd = Math.max(newStart + 0.1, cues[i].end - acc);
            cues[i].start = newStart;
            cues[i].end = newEnd;
          }
          const last = cues[cues.length - 1];
          const delta = last.end - duration;
          if (delta !== 0) {
            last.end -= delta;
          }
        }
      }

      setSubCues(cues);
      setSubMode("both"); // Default to bilingual mode
      setSubVisible(true);
      await subtitleApi.save(selectedLessonId, { cues });
    } catch (e) {
      console.error("Auto-generate subtitles failed:", e);
      alert("Không thể tạo phụ đề. Vui lòng thử lại.");
    } finally {
      setLoadingSubs(false);
    }
  };

  if (!course) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </Link>

      {/* Course card */}
      <div className="bg-white shadow border border-gray-100 rounded-2xl overflow-hidden">
        <img
          src={course.thumbnail_url || "https://placehold.co/800x400"}
          alt={course.title}
          className="w-full h-64 object-cover"
        />

        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>

          <p className="text-sm md:text-base font-semibold text-blue-500 mb-2">
            Giảng viên: <span className="text-gray-700">
              {course.teacherNames && course.teacherNames.length > 0
                ? course.teacherNames.join(", ")
                : "Admin"}
            </span>
          </p>

          {Array.isArray((course as any).teacher) && (course as any).teacher.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              {(course as any).teacher.map((t: any) => (
                <div key={t.full_name} className="flex items-center gap-1">
                  <img src={t.avatar} alt={t.full_name} className="w-6 h-6 rounded-full" />
                  <span className="text-gray-700">{t.full_name}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-sm md:text-base font-semibold text-blue-500 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            {categoryName}
          </p>

          {/* <div className="flex items-center gap-1 text-amber-500 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-5 h-5 ${i < 4 ? "fill-current" : ""}`} />
            ))}
          </div> */}

          <p className="text-gray-700 mb-6 leading-relaxed">
            {course.description || "Không có mô tả chi tiết."}
          </p>

          {/* Price hidden if enrolled */}
          {!isEnrolled && (
            <p className="text-2xl font-semibold text-green-700 mb-6">
              {formatVND((course as any).price_cents || 0)}
            </p>
          )}

          {/* Cart actions hidden if enrolled */}
          {!isEnrolled && (
            <div className="flex flex-wrap items-center gap-3 mt-8">
              {isInCart ? (
                <>
                  <Link
                    to="/cart"
                    className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg font-semibold border border-gray-300 hover:bg-gray-200 transition"
                  >
                    Đã trong giỏ hàng
                  </Link>
                  <button
                    onClick={() => removeCourse((course as any)._id)}
                    className="bg-red-100 text-red-600 px-4 py-2.5 rounded-lg font-semibold border border-red-300 hover:bg-red-200 transition"
                  >
                    Xóa khỏi giỏ
                  </button>
                </>
              ) : (
                <button
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
                  onClick={() => addCourse(course)}
                >
                  Đăng ký học ngay
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lessons + Video section */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video / Preview */}
        <div className="lg:col-span-2 bg-white shadow border border-gray-100 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-3">Nội dung bài học</h3>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Nếu muốn bật upload phụ đề, bỏ comment 2 nút dưới */}
            {/* <input
              ref={fileInputEnRef}
              type="file"
              accept=".vtt,.srt"
              className="hidden"
              onChange={async (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) await handleUploadEnglish(f);
                (e.currentTarget as HTMLInputElement).value = "";
              }}
            />
            <button
              disabled={!isEnrolled || !playbackUrl || loadingSubs}
              onClick={() => fileInputEnRef.current?.click()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded border"
            >
              Tải EN VTT/SRT (dịch)
            </button>

            <input
              ref={fileInputViRef}
              type="file"
              accept=".vtt,.srt"
              className="hidden"
              onChange={async (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) await handleUploadVietnamese(f);
                (e.currentTarget as HTMLInputElement).value = "";
              }}
            />
            <button
              disabled={!isEnrolled || !playbackUrl || loadingSubs}
              onClick={() => fileInputViRef.current?.click()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded border"
            >
              Tải VI VTT/SRT (không dịch)
            </button> */}

            <button
              disabled={!isEnrolled || !playbackUrl || loadingSubs}
              onClick={handleAutoGenerateBilingual}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded border"
            >
              Tự tạo phụ đề (Song ngữ)
            </button>

            <select
              value={subMode}
              onChange={(e) => setSubMode((e.target as HTMLSelectElement).value as any)}
              className="border rounded px-2 py-1"
            >
              <option value="both">Song ngữ</option>
              <option value="en">Tiếng Anh</option>
              <option value="vi">Tiếng Việt</option>
            </select>
            <button
              disabled={subCues.length === 0}
              onClick={() => setSubVisible((v) => !v)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded border"
            >
              {subVisible ? "Ẩn phụ đề" : "Hiện phụ đề"}
            </button>
            {loadingSubs && <span className="text-sm text-gray-500">Đang xử lý phụ đề...</span>}
          </div>

          {loadingPlayback ? (
            <div className="h-64 flex items-center justify-center">Đang tải video...</div>
          ) : selectedLessonId ? (
            isEnrolled ? (
              playbackUrl ? (
                <div className="relative">
                  <video ref={videoRef} controls src={playbackUrl} className="w-full rounded-lg bg-black" />
                  <BilingualSubtitles videoRef={videoRef} cues={subCues} mode={subMode} visible={subVisible} />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">Không có URL phát cho bài học này.</div>
              )
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-2">
                <Lock className="w-6 h-6" />
                <div>Bạn cần mua khóa học để xem video.</div>
              </div>
            )
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">Chưa chọn bài học.</div>
          )}

          {selectedLessonId && (
            <div className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">
              {selectedLesson?.description || ""}
            </div>
          )}

        </div>

        {/* Lesson list */}
        <aside className="bg-white shadow border border-gray-100 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-3">Danh sách bài học</h3>
          {loadingLessons ? (
            <div>Đang tải danh sách...</div>
          ) : lessons.length === 0 ? (
            <div>Chưa có bài học nào.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {lessons.map((ls) => (
                <li key={ls._id}>
                  <button
                    onClick={() => setSelectedLessonId(ls._id)}
                    className={`w-full text-left p-3 hover:bg-gray-50 transition ${
                      selectedLessonId === ls._id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {ls.position}. {ls.title}
                      </span>
                      {!isEnrolled && <Lock className="w-4 h-4 text-gray-400" />}
                    </div>
                    {ls.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">{ls.description}</div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {/* Tabs: Hỏi đáp / Đánh giá */}
      <section className="mt-8 bg-white shadow border border-gray-100 rounded-2xl">
        {/* Tab header */}
        <div className="border-b flex items-center gap-2 px-4">
          {(["qa", "reviews"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative px-4 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                activeTab === key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              {key === "qa" ? "Hỏi đáp khóa học" : "Đánh giá khóa học"}
            </button>
          ))}
        </div>
        {/* Tab body */}
        <div className="p-6">
          {activeTab === "qa" ? (
            <>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Hỏi đáp bài học</h3>
                  <p className="text-sm text-gray-500">
                    {selectedLesson
                      ? `Đang xem: ${selectedLesson.position ? `Bài ${selectedLesson.position} - ` : ""}${selectedLesson.title}`
                      : "Chọn một bài học ở danh sách bên để xem hỏi đáp."}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 hidden">
                  <span>Trạng thái</span>
                  <select
                    value={threadFilter}
                    onChange={(e) => setThreadFilter(e.target.value as any)}
                    className="border rounded-lg px-3 py-1.5"
                  >
                    <option value="all">Tất cả</option>
                    <option value="open">Đang mở</option>
                    <option value="resolved">Đã giải quyết</option>
                  </select>
                </div>
              </div>

              {!selectedLessonId ? (
                <div className="mt-4 text-gray-500">Hãy chọn một bài học để xem hoặc đặt câu hỏi.</div>
              ) : (
                <>
                  {/* Composer moved to the bottom to mimic chat UI */}
                  {false && canParticipate ? (
                    <div className="mt-4 border rounded-2xl p-4 bg-gray-50">
                      <h4 className="font-semibold text-gray-800 mb-2">Đặt câu hỏi mới</h4>
                      <textarea
                        value={questionInput}
                        onChange={(e) => setQuestionInput(e.target.value)}
                        placeholder="Bạn cần thắc mắc gì về bài học này?"
                        className="w-full border rounded-xl p-3 text-sm min-h-[90px] focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                          onClick={handleAskQuestion}
                          disabled={postingQuestion || !questionInput.trim()}
                        >
                          {postingQuestion ? "Đang gửi..." : "Gửi câu hỏi"}
                        </button>
                     
                      </div>
                    </div>
                  ) : (
                    <div className="">
                    
                    </div>
                  )}

                  {discussionMessage && <div className="mt-3 text-sm text-red-600">{discussionMessage}</div>}

                  {loadingThreads ? (
                    <div className="mt-6 text-gray-500">Đang tải câu hỏi...</div>
                  ) : threads.length === 0 ? (
                    <div className="mt-6 text-gray-500">Chưa có câu hỏi nào cho bài học này.</div>
                  ) : (
                    <ul className="mt-6 space-y-4">
                      {threads.map((thread) => (
                        <li key={thread._id} className="border rounded-2xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{thread.user?.name || "Người học"}</div>
                              <div className="text-xs text-gray-500">{formatTimestamp(thread.created_at)}</div>
                            </div>
                            <div className="flex items-center gap-2 text-xs hidden">
                              <span
                                className={`px-2 py-0.5 rounded-full ${
                                  thread.status === "resolved"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {thread.status === "resolved" ? "Đã giải quyết" : "Đang mở"}
                              </span>
                              {canModerate && (
                                <button
                                  onClick={() => handleToggleThreadStatus(thread)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  {thread.status === "resolved" ? "Mở lại" : "Đánh dấu giải quyết"}
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">{thread.content}</p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                            <button
                              onClick={() => setReplyBoxOpen((prev) => ({ ...prev, [thread._id]: !prev[thread._id] }))}
                              className="hover:text-blue-600"
                            >
                              Phản hồi
                            </button>
                          </div>
                          {thread.replies && thread.replies.length > 0 ? (
                            <ul className="mt-4 space-y-2">
                              {thread.replies.map((reply) => (
                                <li key={reply._id} className="rounded-xl bg-gray-50 p-3">
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span className="font-medium text-gray-800">{reply.user?.name || "Người dùng"}</span>
                                    <span>{formatTimestamp(reply.created_at)}</span>
                                  </div>
                                  <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                                  
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="mt-4 text-xs text-gray-500">Chưa có phản hồi nào.</div>
                          )}
                          {canParticipate && replyBoxOpen[thread._id] && (
                            <div className="mt-4">
                              <textarea
                                value={replyDrafts[thread._id] || ""}
                                onChange={(e) =>
                                  setReplyDrafts((prev) => ({ ...prev, [thread._id]: e.target.value }))
                                }
                                placeholder="Phản hồi của bạn..."
                                className="w-full border rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                              />
                              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                                <button
                                  onClick={() => handleReplySubmit(thread)}
                                  disabled={replying[thread._id] || !replyDrafts[thread._id]?.trim()}
                                  className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {replying[thread._id] ? "Đang gửi..." : "Trả lời"}
                                </button>
                                <span>{thread.reply_count || 0} phản hồi</span>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Composer at the bottom for a single unified flow */}
                  {canParticipate ? (
                    <div className="mt-6 border rounded-2xl p-4 bg-gray-50">
                      <h4 className="font-semibold text-gray-800 mb-2">Viết bình luận</h4>
                      <textarea
                        value={questionInput}
                        onChange={(e) => setQuestionInput(e.target.value)}
                        placeholder="Chia sẻ câu hỏi hoặc cảm nghĩ của bạn..."
                        className="w-full border rounded-xl p-3 text-sm min-h-[90px] focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                          onClick={handleAskQuestion}
                          disabled={postingQuestion || !questionInput.trim()}
                        >
                          {postingQuestion ? "Đang đăng..." : "Đăng"}
                        </button>
                        {discussionMessage && (
                          <span className="text-xs text-red-600">{discussionMessage}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                      Đăng nhập và ghi danh khóa học để bình luận và phản hồi.
                    </div>
                  )}

                </>
              )}
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold mb-4">Đánh giá khóa học</h3>
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const avg = reviewSummary?.average ?? 0;
                    const count = reviewSummary?.count ?? reviews.length;
                    return (
                      <>
                        <div className="flex items-center text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-5 h-5 ${i < Math.round(avg) ? "fill-current" : ""}`} />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {Number(avg).toFixed(1)} / 5 - {count} reviews
                        </span>
                      </>
                    );
                  })()}
                </div>
                {reviewSummary && (
                  <div className="space-y-1">
                    {[5, 4, 3, 2, 1].map((r) => {
                      const total = reviewSummary.count || 1;
                      const c = reviewSummary.breakdown[String(r)] || 0;
                      const pct = Math.round((c / total) * 100);
                      return (
                        <div key={r} className="flex items-center gap-2 text-sm">
                          <span className="w-8 text-gray-600">{r}★</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded">
                            <div className="h-2 bg-amber-500 rounded" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-10 text-right text-gray-600">{c}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {isEnrolled && (
                <div className="mb-6 border rounded-xl p-4 bg-gray-50">
                  <h4 className="font-semibold mb-2">Viết đánh giá của bạn</h4>
                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-sm text-gray-700">Chấm điểm:</label>
                    <select
                      value={ratingInput}
                      onChange={(e) => setRatingInput(Number(e.target.value))}
                      className="border rounded-lg p-2"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    placeholder="Chia sẻ cảm nhận của bạn về khóa học..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="w-full border rounded-lg p-3 min-h-[100px]"
                  />
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      disabled={submittingReview}
                      onClick={async () => {
                        if (!course?._id) return;
                        setSubmittingReview(true);
                        setReviewMessage("");
                        try {
                          await reviewClient.createCourseReview(toId((course as any)._id), ratingInput, commentInput);
                          setCommentInput("");
                          setRatingInput(5);
                          setReviewMessage("Đã gửi đánh giá, chờ duyệt.");
                        } catch (e: any) {
                          setReviewMessage(e?.message || "Không thể gửi đánh giá. Vui lòng đăng nhập và thử lại.");
                        } finally {
                          setSubmittingReview(false);
                        }
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                    >
                      Gửi đánh giá
                    </button>
                    {reviewMessage && <span className="text-sm text-gray-600">{reviewMessage}</span>}
                  </div>
                </div>
              )}
              {loadingReviews ? (
                <div className="text-gray-500">Đang tải đánh giá...</div>
              ) : reviews.length === 0 ? (
                <div className="text-gray-500">Chưa có đánh giá nào.</div>
              ) : (
                <ul className="space-y-4">
                  {reviews.map((rv) => {
                    const userRaw = (rv as any).user_id || (rv as any).user;
                    const nameRaw = typeof userRaw === "object" ? userRaw?.name ?? "" : "";
                    const displayName = typeof nameRaw === "string" && nameRaw.trim().length > 0 ? nameRaw.trim() : "Người dùng";
                    return (
                      <li key={rv._id} className="border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-semibold text-gray-800 flex items-center gap-2">
                            {displayName}
                            {(rv as any).verified && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Đã xác minh</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < Number((rv as any).rating || 0) ? "fill-current" : ""}`} />
                            ))}
                          </div>
                        </div>
                        {(rv as any).comment && (
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{(rv as any).comment}</p>
                        )}
                        {(rv as any).created_at && (
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date((rv as any).created_at as any).toLocaleString("vi-VN")}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
