/**
 * Custom hook for managing course data, enrollment, and lessons
 */

import { useEffect, useState } from "react";
import courseApi from "../api/courseApi";
import enrollmentApi from "../api/enrollmentApi";
import lessonApi from "../api/lessonApi";
import quizApi from "../api/quizApi";
import type { Course } from "../types/course";
import type { Lesson } from "../types/lesson";

interface UseCourseDataOptions {
  slug: string | undefined;
  initialCourse: Course | null;
  userId: string | null | undefined;
}

interface UseCourseDataReturn {
  // Course state
  course: Course | null;
  isEnrolled: boolean;
  
  // Lessons state
  lessons: Lesson[];
  loadingLessons: boolean;
  selectedLessonId: string | null;
  setSelectedLessonId: (id: string | null) => void;
  selectedLesson: Lesson | null;
  completedLessons: Set<string>;
  
  // Playback state
  playbackUrl: string;
  loadingPlayback: boolean;
  
  // Quiz state
  hasQuiz: boolean;
  checkingQuiz: boolean;
  lessonsWithQuiz: Set<string>;
  lessonQuizMap: Record<string, { quizId: string; title: string }>;
  
  // Helper
  toId: (val: any) => string;
  markLessonComplete: (lessonId: string) => Promise<void>;
}

// Normalize various Mongo-like ID shapes to a string id
function toId(val: any): string {
  if (val == null) return "";
  if (typeof val === "object") {
    if ((val as any).$oid) return String((val as any).$oid);
    if ((val as any)._id) return String((val as any)._id);
  }
  return String(val);
}

export function useCourseData({
  slug,
  initialCourse,
  userId,
}: UseCourseDataOptions): UseCourseDataReturn {
  
  const [course, setCourse] = useState<Course | null>(initialCourse);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [playbackUrl, setPlaybackUrl] = useState<string>("");
  const [loadingPlayback, setLoadingPlayback] = useState(false);
  
  // Quiz state
  const [hasQuiz, setHasQuiz] = useState<boolean>(false);
  const [checkingQuiz, setCheckingQuiz] = useState<boolean>(false);
  const [lessonsWithQuiz, setLessonsWithQuiz] = useState<Set<string>>(new Set());
  const [lessonQuizMap, setLessonQuizMap] = useState<Record<string, { quizId: string; title: string }>>({});

  // Load course by slug when direct access
  useEffect(() => {
    if (course || !slug) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await courseApi.getBySlug(slug);
        if (!cancelled) {
          setCourse(data);
        }
      } catch (err) {
        console.error("Failed to load course:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, course]);

  // Resolve enrolled status and load completed lessons
  useEffect(() => {
    if (!course) {
      setIsEnrolled(false);
      setCompletedLessons(new Set());
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const ids = await enrollmentApi.getMyEnrolledCourseIds();
        const enrolled = ids.has(toId((course as any)._id));

        if (!cancelled) {
          setIsEnrolled(enrolled);

          // Load completed lessons if enrolled and user is logged in
          if (enrolled && userId) {
            try {
              const enrollment = await enrollmentApi.getEnrollmentByCourse(
                toId((course as any)._id)
              );

              const completedSet = new Set<string>();
              if (enrollment.completed_lessons && Array.isArray(enrollment.completed_lessons)) {
                enrollment.completed_lessons.forEach((id: any) => {
                  completedSet.add(toId(id));
                });
              }

              if (!cancelled) {
                setCompletedLessons(completedSet);
              }
            } catch (err) {
              console.warn("Could not load completed lessons:", err);
              if (!cancelled) {
                setCompletedLessons(new Set());
              }
            }
          } else {
            setCompletedLessons(new Set());
          }
        }
      } catch {
        if (!cancelled) {
          setIsEnrolled(false);
          setCompletedLessons(new Set());
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [course, userId]);

  // Load lessons when course is ready
  useEffect(() => {
    if (!course?._id) {
      setLessons([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingLessons(true);

      try {
        const list = await lessonApi.listByCourse(toId((course as any)._id));
        const arr = Array.isArray(list) ? list : [];

        if (!cancelled) {
          setLessons(arr);
          if (arr.length > 0) {
            setSelectedLessonId(arr[0]._id);
          }
          
          // Check which lessons have quizzes and store quiz info
          const quizSet = new Set<string>();
          const quizMap: Record<string, { quizId: string; title: string }> = {};
          
          await Promise.allSettled(
            arr.map(async (lesson) => {
              try {
                const quiz = await quizApi.getByLesson(lesson._id);
                quizSet.add(lesson._id);
                quizMap[lesson._id] = {
                  quizId: quiz._id,
                  title: quiz.title || "Quiz",
                };
              } catch {
                // Quiz doesn't exist for this lesson
              }
            })
          );
          
          if (!cancelled) {
            setLessonsWithQuiz(quizSet);
            setLessonQuizMap(quizMap);
          }
        }
      } catch (e) {
        console.warn("Could not load lessons list", e);
      } finally {
        if (!cancelled) {
          setLoadingLessons(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [course?._id]);

  // Fetch playback URL when selected lesson changes
  useEffect(() => {
    setPlaybackUrl("");

    if (!selectedLessonId || !isEnrolled) return;

    let cancelled = false;

    (async () => {
      setLoadingPlayback(true);

      try {
        const data = await lessonApi.playback(selectedLessonId);
        const url = (data as any)?.playbackUrl || (data as any)?.url;

        if (!cancelled && typeof url === "string") {
          setPlaybackUrl(url);
        }
      } catch {
        if (!cancelled) {
          setPlaybackUrl("");
        }
      } finally {
        if (!cancelled) {
          setLoadingPlayback(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedLessonId, isEnrolled]);

  // Check if lesson has quiz
  useEffect(() => {
    if (!selectedLessonId) {
      setHasQuiz(false);
      return;
    }
    
    // Use cached quiz info if available
    if (lessonQuizMap[selectedLessonId]) {
      setHasQuiz(true);
      return;
    }
    
    let cancelled = false;
    
    (async () => {
      setCheckingQuiz(true);
      
      try {
        const quiz = await quizApi.getByLesson(selectedLessonId);
        
        if (!cancelled) {
          setHasQuiz(true);
          // Update quiz map
          setLessonQuizMap((prev) => ({
            ...prev,
            [selectedLessonId]: {
              quizId: quiz._id,
              title: quiz.title || "Quiz",
            },
          }));
        }
      } catch {
        if (!cancelled) {
          setHasQuiz(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingQuiz(false);
        }
      }
    })();
    
    return () => {
      cancelled = true;
    };
  }, [selectedLessonId, lessonQuizMap]);

  // Mark lesson as complete
  const markLessonComplete = async (lessonId: string) => {
    if (!isEnrolled || !userId || completedLessons.has(lessonId)) return;

    try {
      await enrollmentApi.completeLesson(lessonId);
      setCompletedLessons((prev) => new Set([...prev, lessonId]));
    } catch (err) {
      console.error("Failed to mark lesson as completed:", err);
    }
  };

  // Get selected lesson object
  const selectedLesson = lessons.find((ls) => ls._id === selectedLessonId) || null;

  return {
    // Course state
    course,
    isEnrolled,
    
    // Lessons state
    lessons,
    loadingLessons,
    selectedLessonId,
    setSelectedLessonId,
    selectedLesson,
    completedLessons,
    
    // Playback state
    playbackUrl,
    loadingPlayback,
    
    // Quiz state
    hasQuiz,
    checkingQuiz,
    lessonsWithQuiz,
    lessonQuizMap,
    
    // Helper
    toId,
    markLessonComplete,
  };
}