/**
 * Custom hook for managing course reviews
 */

import { useEffect, useState } from "react";
import reviewClient, { type ReviewDto } from "../api/reviewClient";

interface ReviewSummary {
  count: number;
  average: number;
  breakdown: Record<string, number>;
}

interface UseReviewsOptions {
  courseId: string | null;
  isEnrolled: boolean;
}

interface UseReviewsReturn {
  // State
  reviews: ReviewDto[];
  loading: boolean;
  summary: ReviewSummary | null;
  ratingInput: number;
  commentInput: string;
  submitting: boolean;
  message: string;
  
  // Actions
  setRatingInput: (rating: number) => void;
  setCommentInput: (comment: string) => void;
  submitReview: () => Promise<void>;
}

export function useReviews({
  courseId,
  isEnrolled,
}: UseReviewsOptions): UseReviewsReturn {
  
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");

  // Load reviews and summary when course changes
  useEffect(() => {
    if (!courseId) {
      setReviews([]);
      setSummary(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);

      try {
        const [listRes, sumRes] = await Promise.allSettled([
          reviewClient.listForCourse(courseId),
          reviewClient.getCourseSummary(courseId),
        ]);

        if (!cancelled) {
          if (listRes.status === "fulfilled" && Array.isArray(listRes.value)) {
            setReviews(listRes.value);
          } else {
            setReviews([]);
          }

          if (sumRes.status === "fulfilled" && sumRes.value) {
            setSummary(sumRes.value);
          } else {
            setSummary(null);
          }
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
  }, [courseId]);

  // Submit a new review
  const submitReview = async () => {
    if (!courseId || !isEnrolled) {
      setMessage("Bạn cần đăng ký khóa học để đánh giá.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      await reviewClient.createCourseReview(
        courseId,
        ratingInput,
        commentInput.trim() || undefined
      );

      setCommentInput("");
      setRatingInput(5);
      setMessage("Đã gửi đánh giá, chờ duyệt.");

      // Optionally reload reviews
      // Could also optimistically update the list
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err: any) {
      setMessage(
        err?.message || "Không thể gửi đánh giá. Vui lòng đăng nhập và thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    // State
    reviews,
    loading,
    summary,
    ratingInput,
    commentInput,
    submitting,
    message,
    
    // Actions
    setRatingInput,
    setCommentInput,
    submitReview,
  };
}