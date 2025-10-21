// import { createContext, useContext, useEffect, useMemo, useState } from "react";
// import type { Course } from "../types/course";

// type CartContextType = {
//     courses: Course[];
//     books: string[];
//     addCourse: (c: Course) => void;
//     addBook: (id: string) => void;
//     removeCourse: (courseId: string) => void;
//     removeBook: (bookId: string) => void;
//     clear: () => void;
//     total: number;
//     count: number;
// };

// const CartContext = createContext<CartContextType | null>(null);

// export function CartProvider({ children }: { children: React.ReactNode }) {
//     const [courses, setCourses] = useState<Course[]>(() => {
//         const saved = localStorage.getItem("cart_courses");
//         return saved ? JSON.parse(saved) : [];
//     });
//     const [books, setBooks] = useState<string[]>(() => {
//         const saved = localStorage.getItem("cart_books");
//         return saved ? JSON.parse(saved) : [];
//     });

//     useEffect(() => {
//         localStorage.setItem("cart_courses", JSON.stringify(courses));
//     }, [courses]);

//     useEffect(() => {
//         localStorage.setItem("cart_books", JSON.stringify(books));
//     }, [books]);

//     const addCourse = (c: Course) => {
//         setCourses((prev) => (prev.some((x) => x._id === c._id) ? prev : [...prev, c]));
//     };

//     const addBook = (id: string) => {
//         setBooks((prev) => (prev.includes(id) ? prev : [...prev, id]));
//     };

//     const removeCourse = (courseId: string) =>
//         setCourses((prev) => prev.filter((x) => x._id !== courseId));

//     const removeBook = (bookId: string) =>
//         setBooks((prev) => prev.filter((x) => x !== bookId));

//     const clear = () => {
//         setCourses([]);
//         setBooks([]);
//     };

//     const total = useMemo(
//         () => courses.reduce((sum, c) => sum + (c.price_cents || 0), 0),
//         [courses]
//     );

//     const count = courses.length + books.length;

//     return (
//         <CartContext.Provider
//             value={{ courses, books, addCourse, addBook, removeCourse, removeBook, clear, total, count }}
//         >
//             {children}
//         </CartContext.Provider>
//     );
// }

// export function useCart() {
//     const ctx = useContext(CartContext);
//     if (!ctx) throw new Error("useCart must be used inside CartProvider");
//     return ctx;
// }
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Course } from "../types/course";

type BookCartItem = {
  _id: string;
  title?: string;
  price_cents?: number;
  image?: string;
  quantity: number; // default 1
};

type CartContextType = {
  courses: Course[];
  books: BookCartItem[];
  // Courses
  addCourse: (c: Course) => void;
  removeCourse: (courseId: string) => void;
  // Books (2 cách thêm để bạn linh hoạt)
  addBook: (id: string) => void; // tương thích cũ
  addBookItem: (b: Omit<BookCartItem, "quantity"> & { quantity?: number }) => void; // mới, đầy đủ info
  updateBookQty: (bookId: string, quantity: number) => void;
  removeBook: (bookId: string) => void;
  // Common
  clear: () => void;
  total: number; // tổng VND (course + book)
  count: number; // tổng số items (course + sum(quantity của books))
  // Tiện ích build payload cho PayOS
  buildCheckoutItems: () => {
    productId: string;
    productType: "Course" | "Book";
    productName?: string;
    productPrice?: number;
    quantity: number;
  }[];
};

const CartContext = createContext<CartContextType | null>(null);

// Helpers
const LS_COURSES = "cart_courses";
const LS_BOOKS = "cart_books";

// Hàm migrate từ string[] -> BookCartItem[]
function migrateBooks(value: any): BookCartItem[] {
  try {
    if (!value) return [];
    // Nếu là mảng string: ["id1","id2"]
    if (Array.isArray(value) && value.every((x) => typeof x === "string")) {
      return (value as string[]).map((id) => ({ _id: id, quantity: 1 }));
    }
    // Nếu là mảng object chuẩn mới
    if (Array.isArray(value) && value.every((x) => typeof x === "object" && x !== null)) {
      return (value as any[]).map((b) => ({
        _id: String(b._id),
        title: b.title,
        price_cents: typeof b.price_cents === "number" ? b.price_cents : undefined,
        image: b.image,
        quantity: Math.max(1, Number(b.quantity) || 1),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

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

  // Courses
  const addCourse = (c: Course) => {
    setCourses((prev) => (prev.some((x) => x._id === c._id) ? prev : [...prev, c]));
  };

  const removeCourse = (courseId: string) => {
    setCourses((prev) => prev.filter((x) => x._id !== courseId));
  };

  // Books (tương thích cũ)
  const addBook = (id: string) => {
    setBooks((prev) => {
      const found = prev.find((b) => b._id === id);
      if (found) {
        // tăng số lượng nếu đã có
        return prev.map((b) => (b._id === id ? { ...b, quantity: b.quantity + 1 } : b));
      }
      // chưa có -> thêm mới quantity = 1
      return [...prev, { _id: id, quantity: 1 }];
    });
  };

  // Books (mới, đầy đủ info)
  const addBookItem = (b: Omit<BookCartItem, "quantity"> & { quantity?: number }) => {
    setBooks((prev) => {
      const qty = Math.max(1, Number(b.quantity ?? 1));
      const found = prev.find((x) => x._id === b._id);
      if (found) {
        return prev.map((x) =>
          x._id === b._id
            ? {
                ...x,
                title: b.title ?? x.title,
                price_cents: b.price_cents ?? x.price_cents,
                image: b.image ?? x.image,
                quantity: x.quantity + qty,
              }
            : x
        );
      }
      return [...prev, { _id: b._id, title: b.title, price_cents: b.price_cents, image: b.image, quantity: qty }];
    });
  };

  const updateBookQty = (bookId: string, quantity: number) => {
    const q = Math.max(1, Number(quantity) || 1);
    setBooks((prev) => prev.map((b) => (b._id === bookId ? { ...b, quantity: q } : b)));
  };

  const removeBook = (bookId: string) => {
    setBooks((prev) => prev.filter((x) => x._id !== bookId));
  };

  const clear = () => {
    setCourses([]);
    setBooks([]);
  };

  // Tổng tiền VND (chỉ cộng những thứ đã biết giá)
  const total = useMemo(() => {
    const courseTotal = courses.reduce((sum, c) => sum + (c.price_cents || 0), 0);
    const bookTotal = books.reduce((sum, b) => sum + (Number(b.price_cents || 0) * Number(b.quantity || 1)), 0);
    return courseTotal + bookTotal;
  }, [courses, books]);

  // Tổng items (mỗi course là 1, books cộng quantity)
  const count = useMemo(() => {
    const courseCount = courses.length;
    const bookCount = books.reduce((s, b) => s + (b.quantity || 1), 0);
    return courseCount + bookCount;
  }, [courses, books]);

  // Dùng để build payload cho PayOS
  const buildCheckoutItems = () => {
    const courseItems = courses.map((c) => ({
      productId: c._id,
      productType: "Course" as const,
      productName: c.title,
      productPrice: Number(c.price_cents || 0), // nếu BE tự tra giá thì có thể bỏ
      quantity: 1,
    }));

    const bookItems = books.map((b) => ({
      productId: b._id,
      productType: "Book" as const,
      productName: b.title,
      productPrice: typeof b.price_cents === "number" ? b.price_cents : undefined, // optional
      quantity: Math.max(1, Number(b.quantity) || 1),
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
        addBook,
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

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
