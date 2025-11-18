import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Course } from "../types/course";
import cartApi, {
  type CartDto,
  type CartItemDto,
} from "../api/cartApi";

// ====== Type definitions ======
export interface BookCartItem {
  _id: string;
  title: string;
  price?: number;
  quantity: number;
  images?: string[];
}

type CartContextType = {
  courses: Course[];
  books: BookCartItem[];
  // Sync helpers
  syncLocalCartToServer: () => Promise<void>;
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

const hasAuthToken = () => {
  try {
    return Boolean(localStorage.getItem("accessToken"));
  } catch {
    return false;
  }
};

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
      }));
    }
    if (Array.isArray(value) && value.every((x) => typeof x === "object")) {
      return (value as any[]).map((b) => ({
        _id: String(b._id),
        title: b.title ?? "",
        price:
          typeof b.price === "number" ? b.price : undefined,
        images: Array.isArray(b.images) ? b.images : [],
        quantity: Math.max(1, Number(b.quantity) || 1),
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

  // Helper: map CartDto from BE -> local state
  const applyServerCart = (cart: CartDto | any) => {
    if (!cart || !Array.isArray(cart.items)) return;

    const nextCourses: Course[] = [];
    const nextBooks: BookCartItem[] = [];

    (cart.items as CartItemDto[]).forEach((item: any) => {
      const productType = item.product_type;
      const raw = item.product_id;
      const snapshot = (item as any).product_snapshot;

      const productId =
        typeof raw === "string"
          ? raw
          : raw && typeof raw === "object"
          ? String(raw._id || raw.id || raw.$oid || "")
          : "";

      if (!productId) return;

      const product: any =
        (snapshot && typeof snapshot === "object" ? snapshot : null) ||
        (raw && typeof raw === "object" ? raw : ({} as any));

      const quantity = Math.max(1, Number(item.quantity || 1));
      const price =
        typeof item.price_at_added === "number"
          ? item.price_at_added
          : typeof product.price === "number"
          ? product.price
          : 0;

      if (productType === "Course") {
        const existed = courses.find((c) => c._id === productId);
        const thumbnail_url =
          product.thumbnail_url ?? existed?.thumbnail_url;

        const c: Course = {
          _id: String(productId),
          title: product.title ?? existed?.title ?? "",
          slug: product.slug ?? "",
          description: product.description ?? existed?.description ?? "",
          price,
          thumbnail_url,
          // Stub the remaining fields to satisfy type, they are not used in cart views
          teacher_id: existed?.teacher_id || "",
          category_id: existed?.category_id || "",
          is_published: existed?.is_published ?? true,
          status: existed?.status ?? "approved",
          category: existed?.category || ({} as any),
          lessons: existed?.lessons || [],
        };
        // Avoid duplicates
        if (!nextCourses.some((x) => x._id === c._id)) {
          nextCourses.push(c);
        }
      } else if (productType === "Book") {
        const existed = books.find((b) => b._id === productId);
        const images =
          Array.isArray(product.images) && product.images.length
            ? product.images
            : existed?.images || [];

        const b: BookCartItem = {
          _id: String(productId),
          title: product.title ?? existed?.title ?? "",
          price,
          quantity,
          images,
        };
        const existing = nextBooks.find((x) => x._id === b._id);
        if (existing) {
          existing.quantity += b.quantity;
          existing.price = b.price ?? existing.price;
          existing.images = b.images.length ? b.images : existing.images;
        } else {
          nextBooks.push(b);
        }
      }
    });

    setCourses(nextCourses);
    setBooks(nextBooks);
  };

  // Persist
  useEffect(() => {
    localStorage.setItem(LS_COURSES, JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(LS_BOOKS, JSON.stringify(books));
  }, [books]);

  // Initial sync from backend when user already logged in (page refresh)
  useEffect(() => {
    if (!hasAuthToken()) return;

    (async () => {
      try {
        const cart = await cartApi.getMyCart();
        applyServerCart(cart);
      } catch (err) {
        console.error("Failed to load cart from server:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== Course logic ======
  const addCourse = (c: Course) => {
    setCourses((prev) =>
      prev.some((x) => x._id === c._id) ? prev : [...prev, c]
    );

    if (!hasAuthToken()) return;
    (async () => {
      try {
        const cart = await cartApi.addItem({
          productId: c._id,
          productType: "Course",
          quantity: 1,
        });
        applyServerCart(cart);
      } catch (err) {
        console.error("Failed to sync course to server cart:", err);
      }
    })();
  };

  const removeCourse = (courseId: string) => {
    setCourses((prev) => prev.filter((x) => x._id !== courseId));

    if (!hasAuthToken()) return;
    (async () => {
      try {
        const cart = await cartApi.removeItem({
          productId: courseId,
          productType: "Course",
        });
        applyServerCart(cart);
      } catch (err) {
        console.error("Failed to remove course from server cart:", err);
      }
    })();
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
                price: b.price ?? x.price,
                images: Array.isArray(b.images) ? b.images : x.images,
                quantity: x.quantity + qty,
              }
            : x
        );
      }

      return [
        ...prev,
        {
          _id: b._id,
          title: b.title,
          price: b.price,
          images: Array.isArray(b.images) ? b.images : [],
          quantity: qty,
        },
      ];
    });

    if (!hasAuthToken()) return;
    (async () => {
      try {
        const qty = Math.max(1, Math.floor(Number(b.quantity ?? 1)));
        const cart = await cartApi.addItem({
          productId: b._id,
          productType: "Book",
          quantity: qty,
        });
        applyServerCart(cart);
      } catch (err) {
        console.error("Failed to sync book to server cart:", err);
      }
    })();
  };

  const updateBookQty = (bookId: string, quantity: number) => {
    const q = Math.max(1, Number(quantity) || 1);
    setBooks((prev) =>
      prev.map((b) =>
        b._id === bookId ? { ...b, quantity: q } : b
      )
    );

    if (!hasAuthToken()) return;
    (async () => {
      try {
        const cart = await cartApi.updateItemQuantity({
          productId: bookId,
          productType: "Book",
          quantity: q,
        });
        applyServerCart(cart);
      } catch (err) {
        console.error("Failed to update book quantity on server cart:", err);
      }
    })();
  };

  const removeBook = (bookId: string) => {
    setBooks((prev) => prev.filter((x) => x._id !== bookId));

    if (!hasAuthToken()) return;
    (async () => {
      try {
        const cart = await cartApi.removeItem({
          productId: bookId,
          productType: "Book",
        });
        applyServerCart(cart);
      } catch (err) {
        console.error("Failed to remove book from server cart:", err);
      }
    })();
  };

  const clear = () => {
    setCourses([]);
    setBooks([]);

    if (!hasAuthToken()) return;
    (async () => {
      try {
        const cart = await cartApi.clear();
        applyServerCart(cart);
      } catch (err) {
        console.error("Failed to clear server cart:", err);
      }
    })();
  };

  // ====== Calculations ======
  const total = useMemo(() => {
    const courseTotal = courses.reduce(
      (sum, c) => sum + (c.price || 0),
      0
    );
    const bookTotal = books.reduce(
      (sum, b) => sum + Number(b.price || 0) * Number(b.quantity || 1),
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
      productPrice: Number(c.price || 0),
      quantity: 1,
    }));

    const bookItems = books.map((b) => ({
      productId: b._id,
      productType: "Book" as const,
      productName: b.title,
      productPrice:
        typeof b.price === "number" ? b.price : undefined,
      quantity: Math.max(1, Number(b.quantity) || 1),
    }));

    return [...courseItems, ...bookItems];
  };

  // Sync local (LS-based) cart to backend after user logs in
  const syncLocalCartToServer = async () => {
    if (!hasAuthToken()) return;

    try {
      const allItems = buildCheckoutItems();
      if (allItems.length === 0) {
        const cart = await cartApi.getMyCart();
        applyServerCart(cart);
        return;
      }

      for (const item of allItems) {
        await cartApi.addItem({
          productId: item.productId,
          productType: item.productType,
          quantity: item.quantity,
        });
      }

      const cart = await cartApi.getMyCart();
      applyServerCart(cart);
    } catch (err) {
      console.error("Failed to sync local cart to server:", err);
    }
  };

  // ====== Return Provider ======
  return (
    <CartContext.Provider
      value={{
        courses,
        books,
        syncLocalCartToServer,
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
