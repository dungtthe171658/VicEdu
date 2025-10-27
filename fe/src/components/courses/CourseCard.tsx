import type { Course } from "../../types/course";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import categoryApi from "../../api/categoryApi";
import type { Category } from "../../types/category";

const VND = (n = 0) =>
  (typeof n === "number" ? n : Number(n || 0)).toLocaleString("vi-VN");
const CoursePlaceholder =
  "https://placehold.co/640x360?text=No+Image&font=inter";

export function CardImage({
  src,
  alt,
  className = "h-40",
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src || CoursePlaceholder}
      alt={alt}
      loading="lazy"
      className={`w-full object-cover rounded-xl ${className}`}
    />
  );
}

export function CourseCard({ c }: { c: Course }) {
  const [category, setCategory] = useState<string>("");

  useEffect(() => {
    // ✅ Trường hợp đã có category (backend populate)
    if (Array.isArray(c.category) && c.category.length > 0) {
      setCategory(c.category.map((cat: any) => cat.name).join(", "));
      return;
    }

    // ✅ Nếu có category_id -> fetch thủ công
    if (c.category_id) {
      (async () => {
        try {
          const res = await categoryApi.getById(c.category_id);
          if (res?.data?.name) setCategory(res.data.name);
          else if (res?.name) setCategory(res.name);
        } catch (err) {
          console.error("Failed to fetch category:", err);
        }
      })();
    }
  }, [c.category, c.category_id]);

  return (
    <Link
      to={`/courses/${c.slug}`}
      className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition overflow-hidden"
    >
      <div className="p-4">
        <div className="relative">
          <CardImage
            src={c.thumbnail_url || "/assets/vicedu_banner.png"}
            alt={c.title}
            className="w-full h-48 object-cover rounded-t-xl"
          />
          {category && (
            <span className="absolute top-2 left-2 text-[11px] font-semibold bg-blue-600 text-white py-1 px-2 rounded">
              {category}
            </span>
          )}
        </div>
        <div className="mt-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-700 line-clamp-2 min-h-[2.75rem]">
            {c.title}
          </h3>

          {c.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mt-1 min-h-[2.25rem]">
              {c.description}
            </p>
          )}

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`size-4 ${i < 4 ? "fill-current" : ""}`}
                />
              ))}
            </div>
            <p className="font-semibold text-green-700">
              {VND(c.price_cents || 0)}đ
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
