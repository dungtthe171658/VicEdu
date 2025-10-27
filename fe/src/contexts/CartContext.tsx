import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Course } from "../types/course";

// ====== Type definitions ======
export interface BookCartItem {
  _id: string;
  title: string;
  price_cents?: number;
  quantity: number;
  images?: string[];
  stock: number;
}

type CartContextType = {
  courses: Course[];
  books: BookCartItem[];
  // Courses
  addCourse: (c: Course) => void;
  removeCourse: (courseId: string) => void;
  // Books
  addBookItem: (
    b: Omit<BookCartItem, "quantity"> & { quantity?: number }
  ) => void;
  updateBookQty: (bookId: string, quantity: number) => void;
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

// ====== Helpers ======
const LS_COURSES = "cart_courses";
const LS_BOOKS = "cart_books";

// Migrate string[] -> BookCartItem[]
function migrateBooks(value: any): BookCartItem[] {
  try {
    if (!value) return [];
    if (Array.isArray(value) && value.every((x) => typeof x === "string")) {
      return (value as string[]).map((id) => ({
        _id: id,
        title: "",
        quantity: 1,
        images: [],
        stock: 0,
      }));
    }
    if (Array.isArray(value) && value.every((x) => typeof x === "object")) {
      return (value as any[]).map((b) => ({
        _id: String(b._id),
        title: b.title ?? "",
        price_cents:
          typeof b.price_cents === "number" ? b.price_cents : undefined,
        images: Array.isArray(b.images) ? b.images : [],
        quantity: Math.max(1, Number(b.quantity) || 1),
        stock: b.stock ?? 0,
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

  // Persist
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

  // ====== Book logic ======
  const addBookItem = (
    b: Omit<BookCartItem, "quantity"> & { quantity?: number }
  ) => {
    setBooks((prev) => {
      const qty = Math.max(1, Math.floor(Number(b.quantity ?? 1)));
      const found = prev.find((x) => x._id === b._id);

      if (found) {
        return prev.map((x) =>
          x._id === b._id
            ? {
                ...x,
                title: b.title ?? x.title,
                price_cents: b.price_cents ?? x.price_cents,
                images: Array.isArray(b.images) ? b.images : x.images,
                stock: b.stock ?? x.stock ?? 0,
                quantity: Math.min(
                  x.quantity + qty,
                  b.stock ?? x.stock ?? Infinity
                ), // ✅ giới hạn theo stock
              }
            : x
        );
      }

      return [
        ...prev,
        {
          _id: b._id,
          title: b.title,
          price_cents: b.price_cents,
          images: Array.isArray(b.images) ? b.images : [],
          stock: b.stock ?? 0,
          quantity: qty,
        },
      ];
    });
  };

  const updateBookQty = (bookId: string, quantity: number) => {
    const q = Math.max(1, Number(quantity) || 1);
    setBooks((prev) =>
      prev.map((b) => ({
        ...b,
        quantity:
          b._id === bookId
            ? Math.min(q, b.stock || Infinity) // ✅ không vượt quá stock
            : b.quantity,
      }))
    );
  };

  const removeBook = (bookId: string) => {
    setBooks((prev) => prev.filter((x) => x._id !== bookId));
  };

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
      (sum, b) => sum + Number(b.price_cents || 0) * Number(b.quantity || 1),
      0
    );
    return courseTotal + bookTotal;
  }, [courses, books]);

  const count = useMemo(() => {
    const courseCount = courses.length;
    const bookCount = books.reduce((s, b) => s + (b.quantity || 1), 0);
    return courseCount + bookCount;
  }, [courses, books]);

  // ====== Build payload for PayOS ======
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
      productPrice:
        typeof b.price_cents === "number" ? b.price_cents : undefined,
      quantity: Math.max(1, Number(b.quantity) || 1),
    }));

    return [...courseItems, ...bookItems];
  };

  // ====== Return Provider ======
  return (
    <CartContext.Provider
      value={{
        courses,
        books,
        addCourse,
        removeCourse,
        addBookItem,
        updateBookQty,
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
