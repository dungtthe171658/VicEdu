import { useEffect, useState, useMemo } from "react";
import bookApi from "../../api/bookApi";
import categoryApi from "../../api/categoryApi";
import type { BookDto } from "../../types/book.d";
import type { Category } from "../../types/category.d";
import BookCard from "../../components/books/BookCard";

const BookListPage = () => {
  const [books, setBooks] = useState<BookDto[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [searchText, setSearchText] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [purchasedBookIds, setPurchasedBookIds] = useState<Set<string>>(
    new Set()
  );

  // --- Lấy danh sách thể loại ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryApi.getAll();
        const data: Category[] = Array.isArray(res.data) ? res.data : res;
        setCategories(data);
      } catch (err) {
        console.error("Không thể tải thể loại:", err);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // --- Fetch sách khi category thay đổi ---
  useEffect(() => {
    const fetchBooks = async () => {
      setLoadingBooks(true);
      try {
        const params: Record<string, any> = {};
        if (selectedCategory) params.categoryId = selectedCategory;
        const res = await bookApi.getAll(params);
        const data: BookDto[] = Array.isArray(res.data) ? res.data : res;
        setBooks(data);
      } catch (err) {
        console.error("Lỗi khi tải sách:", err);
        setBooks([]);
      } finally {
        setLoadingBooks(false);
      }
    };
    fetchBooks();
  }, [selectedCategory]);

  // --- Fetch sách đã mua 1 lần ---
  useEffect(() => {
    const fetchPurchasedBooks = async () => {
      try {
        const res = await bookApi.getBookOrderAndOrderitem();
        const books = res.data?.data || [];
        setPurchasedBookIds(new Set(books.map((b: any) => b._id)));
      } catch (err) {
        console.error("Không thể lấy sách đã mua:", err);
        setPurchasedBookIds(new Set());
      }
    };
    fetchPurchasedBooks();
  }, []);

  // --- Lọc trực tiếp trên frontend ---
  const filteredBooks = useMemo(() => {
    return books
      .filter(
        (b) =>
          b.price_cents! >= priceRange[0] && b.price_cents! <= priceRange[1]
      )
      .filter(
        (b) =>
          b.title.toLowerCase().includes(searchText.toLowerCase()) ||
          (b.author?.toLowerCase().includes(searchText.toLowerCase()) ?? false)
      );
  }, [books, priceRange, searchText]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* ---------- Sidebar lọc ---------- */}
      <aside className="lg:col-span-1 border border-gray-200 rounded-xl p-5 bg-white h-fit space-y-6">
        <h2 className="text-lg font-semibold">Bộ lọc</h2>

        {/* Search */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Tìm kiếm
          </label>
          <input
            type="text"
            placeholder="Tên sách hoặc tác giả..."
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring focus:ring-blue-100"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Thể loại */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Thể loại
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring focus:ring-blue-100"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Tất cả</option>
            {loadingCategories ? (
              <option disabled>Đang tải...</option>
            ) : categories.length === 0 ? (
              <option disabled>Không có thể loại</option>
            ) : (
              categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Giá */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Giá tối đa:{" "}
            <span className="text-blue-600 font-semibold">
              {priceRange[1].toLocaleString()}₫
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={1000000}
            step={10000}
            value={priceRange[1]}
            onChange={(e) =>
              setPriceRange([priceRange[0], Number(e.target.value)])
            }
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0₫</span>
            <span>1.000.000₫</span>
          </div>
        </div>
      </aside>

      {/* ---------- Danh sách sách ---------- */}
      <main className="lg:col-span-3">
        {loadingBooks ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse h-48 bg-gray-200 rounded-lg"
              ></div>
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <p className="text-gray-500 mt-4">Không có sách nào để hiển thị 📚</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredBooks.map((book) => (
              <BookCard
                key={book._id}
                book={book}
                purchasedBookIds={purchasedBookIds}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BookListPage;
