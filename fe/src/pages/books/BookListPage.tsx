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
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(false);

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

  // --- Lọc trực tiếp trên frontend ---
  const filteredBooks = useMemo(() => {
    return books
      .filter((b) => b.price_cents! >= priceRange[0] && b.price_cents! <= priceRange[1])
      .filter((b) => (inStockOnly ? (b.stock ?? 0) > 0 : true))
      .filter(
        (b) =>
          b.title.toLowerCase().includes(searchText.toLowerCase()) ||
          (b.author?.toLowerCase().includes(searchText.toLowerCase()) ?? false)
      );
  }, [books, priceRange, inStockOnly, searchText]);

  return (
    <div className="flex mt-6 gap-6">
      {/* ---------- Sidebar lọc ---------- */}
      <div className="w-64 p-4 bg-white rounded-lg shadow space-y-6">
        <h2 className="text-lg font-semibold">Bộ lọc</h2>

        {/* Search */}
        <div>
          <label className="block mb-1 font-medium">Tìm kiếm</label>
          <input
            type="text"
            placeholder="Tên sách hoặc tác giả..."
            className="w-full border rounded px-3 py-2"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Thể loại */}
        <div>
          <label className="block mb-1 font-medium">Thể loại</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Tất cả</option>
            {loadingCategories
              ? <option disabled>Đang tải...</option>
              : categories.length === 0
              ? <option disabled>Không có thể loại</option>
              : categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))
            }
          </select>
        </div>

        {/* Giá */}
        <div>
          <label className="block mb-1 font-medium">Giá (VND)</label>
          <div className="flex items-center gap-2">
            <span>{priceRange[0].toLocaleString()}₫</span>
            <input
              type="range"
              min={0}
              max={1000000}
              step={10000}
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span>{priceRange[1].toLocaleString()}₫</span>
            <input
              type="range"
              min={0}
              max={1000000}
              step={10000}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="flex-1"
            />
          </div>
        </div>

        {/* Còn hàng */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="inStock"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
          <label htmlFor="inStock" className="font-medium">Chỉ còn hàng</label>
        </div>
      </div>

      {/* ---------- Danh sách sách ---------- */}
      <div className="flex-1 grid grid-cols-5 gap-6">
        {loadingBooks ? (
          <div className="col-span-4 flex justify-center items-center h-64">
            <div className="animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-12 h-12"></div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="col-span-4 text-center text-gray-500">
            Không có sách nào để hiển thị 📚
          </div>
        ) : (
          filteredBooks.map((book) => <BookCard key={book._id} book={book} />)
        )}
      </div>
    </div>
  );
};

export default BookListPage;
