import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Course } from "../types/course";

// ====== Type definitions ======
export interface BookCartItem {
  _id: string;
  title: string;
  price_cents?: number;
  images?: string[];
}

type CartContextType = {
  courses: Course[];
  books: BookCartItem[];
  // Courses
  addCourse: (c: Course) => void;
  removeCourse: (courseId: string) => void;
  // Books
  addBookItem: (b: BookCartItem) => void;
  removeBook: (bookId: string) => void;
  // Common
  clear: () => void;
  total: number;
  count: number;
  buildCheckoutItems: () => {
    productId: string;
    productType: "Course" | "Book";
    productName?: string;
    productPrice?: number;
    quantity: number;
  }[];
};

const CartContext = createContext<CartContextType | null>(null);

// ====== LocalStorage keys ======
const LS_COURSES = "cart_courses";
const LS_BOOKS = "cart_books";

// ====== Helpers ======
function migrateBooks(value: any): BookCartItem[] {
  try {
    if (!value) return [];
    if (Array.isArray(value) && value.every((x) => typeof x === "string")) {
      return (value as string[]).map((id) => ({
        _id: id,
        title: "",
        images: [],
      }));
    }
    if (Array.isArray(value) && value.every((x) => typeof x === "object")) {
      return (value as any[]).map((b) => ({
        _id: String(b._id),
        title: b.title ?? "",
        price_cents:
          typeof b.price_cents === "number" ? b.price_cents : undefined,
        images: Array.isArray(b.images) ? b.images : [],
      }));
    }
    return [];
  } catch {
    return [];
  }
}

// ====== Provider ======
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem(LS_COURSES);
    return saved ? JSON.parse(saved) : [];
  });

  const [books, setBooks] = useState<BookCartItem[]>(() => {
    const saved = localStorage.getItem(LS_BOOKS);
    return migrateBooks(saved ? JSON.parse(saved) : null);
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(LS_COURSES, JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(LS_BOOKS, JSON.stringify(books));
  }, [books]);

  // ====== Course logic ======
  const addCourse = (c: Course) => {
    setCourses((prev) =>
      prev.some((x) => x._id === c._id) ? prev : [...prev, c]
    );
  };

  const removeCourse = (courseId: string) => {
    setCourses((prev) => prev.filter((x) => x._id !== courseId));
  };

  // ====== Book logic (ebook only) ======
  const addBookItem = (b: BookCartItem) => {
    setBooks((prev) => {
      if (prev.some((x) => x._id === b._id)) return prev; // chỉ thêm 1 lần
      return [...prev, b];
    });
  };

  const removeBook = (bookId: string) => {
    setBooks((prev) => prev.filter((x) => x._id !== bookId));
  };

  // ====== Clear cart ======
  const clear = () => {
    setCourses([]);
    setBooks([]);
  };

  // ====== Calculations ======
  const total = useMemo(() => {
    const courseTotal = courses.reduce(
      (sum, c) => sum + (c.price_cents || 0),
      0
    );
    const bookTotal = books.reduce(
      (sum, b) => sum + Number(b.price_cents || 0),
      0
    ); // quantity luôn 1
    return courseTotal + bookTotal;
  }, [courses, books]);

  const count = useMemo(() => courses.length + books.length, [courses, books]);

  // ====== Build checkout items ======
  const buildCheckoutItems = () => {
    const courseItems = courses.map((c) => ({
      productId: c._id,
      productType: "Course" as const,
      productName: c.title,
      productPrice: Number(c.price_cents || 0),
      quantity: 1,
    }));

    const bookItems = books.map((b) => ({
      productId: b._id,
      productType: "Book" as const,
      productName: b.title,
      productPrice: Number(b.price_cents || 0),
      quantity: 1, // luôn 1 cho ebook
    }));

    return [...courseItems, ...bookItems];
  };

  return (
    <CartContext.Provider
      value={{
        courses,
        books,
        addCourse,
        removeCourse,
        addBookItem,
        removeBook,
        clear,
        total,
        count,
        buildCheckoutItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ====== Hook ======
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
