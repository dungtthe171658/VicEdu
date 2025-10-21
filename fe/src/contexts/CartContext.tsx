import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Course } from "../types/course";

type CartContextType = {
    courses: Course[];
    books: string[];
    addCourse: (c: Course) => void;
    addBook: (id: string) => void;
    removeCourse: (courseId: string) => void;
    removeBook: (bookId: string) => void;
    clear: () => void;
    total: number;
    count: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [courses, setCourses] = useState<Course[]>(() => {
        const saved = localStorage.getItem("cart_courses");
        return saved ? JSON.parse(saved) : [];
    });
    const [books, setBooks] = useState<string[]>(() => {
        const saved = localStorage.getItem("cart_books");
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem("cart_courses", JSON.stringify(courses));
    }, [courses]);

    useEffect(() => {
        localStorage.setItem("cart_books", JSON.stringify(books));
    }, [books]);

    const addCourse = (c: Course) => {
        setCourses((prev) => (prev.some((x) => x._id === c._id) ? prev : [...prev, c]));
    };

    const addBook = (id: string) => {
        setBooks((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    const removeCourse = (courseId: string) =>
        setCourses((prev) => prev.filter((x) => x._id !== courseId));

    const removeBook = (bookId: string) =>
        setBooks((prev) => prev.filter((x) => x !== bookId));

    const clear = () => {
        setCourses([]);
        setBooks([]);
    };

    const total = useMemo(
        () => courses.reduce((sum, c) => sum + (c.price_cents || 0), 0),
        [courses]
    );

    const count = courses.length + books.length;

    return (
        <CartContext.Provider
            value={{ courses, books, addCourse, addBook, removeCourse, removeBook, clear, total, count }}
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
