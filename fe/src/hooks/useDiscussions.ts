/**
 * Custom hook for managing lesson discussions/Q&A
 */

import { useEffect, useState } from "react";
import commentApi from "../api/commentApi";
import type { LessonComment } from "../types/comment";

interface UseDiscussionsOptions {
  lessonId: string | null;
  canParticipate: boolean;
  canModerate: boolean;
}

interface UseDiscussionsReturn {
  // State
  threads: LessonComment[];
  loading: boolean;
  error: string;
  questionInput: string;
  postingQuestion: boolean;
  replyDrafts: Record<string, string>;
  replying: Record<string, boolean>;
  replyBoxOpen: Record<string, boolean>;
  threadFilter: "all" | "open" | "resolved";
  
  // Actions
  setQuestionInput: (value: string) => void;
  setReplyDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setReplyBoxOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setThreadFilter: (filter: "all" | "open" | "resolved") => void;
  handleAskQuestion: () => Promise<void>;
  handleReplySubmit: (thread: LessonComment) => Promise<void>;
  handleToggleThreadStatus: (thread: LessonComment) => Promise<void>;
}

export function useDiscussions({
  lessonId,
  canParticipate,
  canModerate,
}: UseDiscussionsOptions): UseDiscussionsReturn {
  
  const [threads, setThreads] = useState<LessonComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [questionInput, setQuestionInput] = useState("");
  const [postingQuestion, setPostingQuestion] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<Record<string, boolean>>({});
  const [replyBoxOpen, setReplyBoxOpen] = useState<Record<string, boolean>>({});
  const [threadFilter, setThreadFilter] = useState<"all" | "open" | "resolved">("all");

  // Load threads when lesson or filter changes
  useEffect(() => {
    setReplyDrafts({});
    
    if (!lessonId) {
      setThreads([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      
      try {
        const params = threadFilter === "all" ? undefined : { status: threadFilter };
        const res = await commentApi.listByLesson(lessonId, params);
        
        if (!cancelled) {
          setThreads(Array.isArray(res?.data) ? res.data : []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setThreads([]);
          setError(err?.message || "Không thể tải hỏi đáp cho bài học này.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lessonId, threadFilter]);

  // Ask a new question
  const handleAskQuestion = async () => {
    if (!lessonId || !canParticipate) return;
    
    const message = questionInput.trim();
    if (!message) return;

    setPostingQuestion(true);
    setError("");

    try {
      const created = await commentApi.create({
        lesson_id: lessonId,
        content: message,
      });

      setThreads((prev) => [
        { ...created, replies: created.replies || [] },
        ...prev,
      ]);
      
      setQuestionInput("");
    } catch (err: any) {
      setError(err?.message || "Không thể gửi câu hỏi. Vui lòng thử lại.");
    } finally {
      setPostingQuestion(false);
    }
  };

  // Reply to a thread
  const handleReplySubmit = async (thread: LessonComment) => {
    if (!canParticipate) return;
    
    const text = replyDrafts[thread._id]?.trim();
    if (!text) return;

    const targetLessonId = thread.lesson?._id || lessonId;
    if (!targetLessonId) return;

    setReplying((prev) => ({ ...prev, [thread._id]: true }));
    setError("");

    try {
      const created = await commentApi.create({
        lesson_id: targetLessonId,
        parent_id: thread._id,
        content: text,
      });

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
      setReplyBoxOpen((prev) => ({ ...prev, [thread._id]: false }));
    } catch (err: any) {
      setError(err?.message || "Không thể gửi phản hồi.");
    } finally {
      setReplying((prev) => ({ ...prev, [thread._id]: false }));
    }
  };

  // Toggle thread status (open/resolved)
  const handleToggleThreadStatus = async (thread: LessonComment) => {
    if (!canModerate) return;

    const nextStatus = thread.status === "resolved" ? "open" : "resolved";

    try {
      const updated = await commentApi.updateStatus(thread._id, nextStatus);
      
      setThreads((prev) =>
        prev.map((item) =>
          item._id === thread._id
            ? {
                ...item,
                status: updated.status,
                resolved_at: updated.resolved_at,
              }
            : item
        )
      );
    } catch (err: any) {
      setError(err?.message || "Không thể cập nhật trạng thái câu hỏi.");
    }
  };

  return {
    // State
    threads,
    loading,
    error,
    questionInput,
    postingQuestion,
    replyDrafts,
    replying,
    replyBoxOpen,
    threadFilter,
    
    // Actions
    setQuestionInput,
    setReplyDrafts,
    setReplyBoxOpen,
    setThreadFilter,
    handleAskQuestion,
    handleReplySubmit,
    handleToggleThreadStatus,
  };
}