import { useState, useEffect, useMemo } from "react";
import reviewApi from "../../../api/reviewApi";
import type { ReviewDto } from "../../../types/review";
import ReviewForm from "../../../components/reviews/ReviewForm";
import "./ManageReviewsPage.css";
import courseApi from "../../../api/courseApi";
import categoryApi from "../../../api/categoryApi";
import type { Course } from "../../../types/course";
import type { Category } from "../../../types/category";

function toId(val: any): string {
  if (val == null) return "";
  if (typeof val === "object") {
    if ((val as any).$oid) return String((val as any).$oid);
    if ((val as any)._id) return String((val as any)._id);
  }
  return String(val);
}

const ManageReviewsPage = () => {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [selectedReview, setSelectedReview] = useState<Partial<ReviewDto> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  // Filters
  const [filterCourseId, setFilterCourseId] = useState<string>("all");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Load reviews (admin) with filters + pagination
  const loadReviews = async () => {
    try {
      const params: any = { page, limit, product_type: "Course" };
      if (statusFilter !== "all") params.status = statusFilter;
      if (filterCourseId !== "all") params.product_id = filterCourseId;
      if (filterCategoryId !== "all") params.category_id = filterCategoryId;

      const res = await reviewApi.getAll(params);
      const body = res as any;
      setReviews(Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : []);
      setTotal(Number(body?.total || 0));
      setTotalPages(Number(body?.totalPages || 1));
    } catch (error) {
      console.error("Error loading reviews:", error);
      alert("Failed to load reviews. Please check admin token or backend.");
    }
  };

  useEffect(() => {
    loadReviews();
  }, [page, limit, filterCategoryId, filterCourseId, statusFilter]);

  // Load supporting data for filters
  useEffect(() => {
    (async () => {
      try {
        const [courseRes, cateRes] = await Promise.all([
          courseApi.getAll({ limit: 1000 }).catch(() => [] as any),
          categoryApi.getAll().catch(() => [] as any),
        ]);
        const toArr = (res: any) => (Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []);
        setCoursesList(toArr(courseRes) as Course[]);
        setCategoriesList(toArr(cateRes) as Category[]);
      } catch {
        setCoursesList([]);
        setCategoriesList([]);
      }
    })();
  }, []);

  // Client-side safeguard filter (in case server returns broad set)
  const filteredReviews = useMemo(() => {
    if (filterCourseId === "all" && filterCategoryId === "all") return reviews;
    const result: ReviewDto[] = [];
    for (const r of reviews) {
      const productType = (r as any).product_type;
      if (productType !== "Course") continue;
      const pid = toId((r as any).product_id);
      if (filterCourseId !== "all" && pid !== filterCourseId) continue;
      if (filterCategoryId !== "all") {
        const course = coursesList.find((c) => toId((c as any)._id) === pid);
        if (!course) continue;
        let matches = false;
        const cat = (course as any).category;
        if (Array.isArray(cat) && cat.length > 0) {
          matches = cat.some((c: any) => toId(c?._id) === filterCategoryId);
        } else if ((course as any).category_id) {
          matches = toId((course as any).category_id) === filterCategoryId;
        }
        if (!matches) continue;
      }
      result.push(r);
    }
    return result;
  }, [reviews, filterCourseId, filterCategoryId, coursesList]);

  // Courses dropdown constrained by selected category
  const filteredCoursesForSelect = useMemo(() => {
    if (filterCategoryId === "all") return coursesList;
    return coursesList.filter((course: any) => {
      const cat = (course as any)?.category;
      if (Array.isArray(cat) && cat.length > 0) return cat.some((c: any) => toId(c?._id) === filterCategoryId);
      if ((course as any)?.category_id) return toId((course as any).category_id) === filterCategoryId;
      return false;
    });
  }, [coursesList, filterCategoryId]);

  // Reset course if category changed and current course not in that category
  useEffect(() => {
    if (filterCourseId === "all") return;
    const exists = filteredCoursesForSelect.some((c: any) => toId((c as any)._id) === filterCourseId);
    if (!exists) setFilterCourseId("all");
  }, [filterCategoryId, filteredCoursesForSelect]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      try {
        await reviewApi.delete(id);
        loadReviews();
      } catch (error) {
        console.error("Error deleting review:", error);
        alert("Failed to delete review.");
      }
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await reviewApi.updateStatus(id, "approved");
      loadReviews();
    } catch (error) {
      console.error("Error approving review:", error);
      alert("Failed to approve review.");
    }
  };

  const handleEdit = (review: ReviewDto) => {
    setSelectedReview(review);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedReview(null);
    setShowModal(true);
  };

  return (
    <div className="review-management-container">
      <div className="header">
        <h2>Manage Reviews</h2>
        <button className="add-btn" onClick={handleAdd}>+ Add Review</button>
      </div>

      {/* Filters */}
      <div className="filters" style={{ display: "flex", gap: 12, margin: "12px 0" }}>
        <select value={filterCategoryId} onChange={(e) => { setFilterCategoryId(e.target.value); setFilterCourseId("all"); setPage(1); }}>
          <option value="all">All categories</option>
          {categoriesList.map((cat) => (
            <option key={toId((cat as any)._id)} value={toId((cat as any)._id)}>
              {(cat as any).name}
            </option>
          ))}
        </select>
        <select value={filterCourseId} onChange={(e) => { setFilterCourseId(e.target.value); setPage(1); }}>
          <option value="all">All courses</option>
          {filteredCoursesForSelect.map((c) => (
            <option key={toId((c as any)._id)} value={toId((c as any)._id)}>
              {(c as any).title}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>
        {(filterCourseId !== "all" || filterCategoryId !== "all") && (
          <button onClick={() => { setFilterCourseId("all"); setFilterCategoryId("all"); setStatusFilter("all"); setPage(1); }}>Clear</button>
        )}
      </div>

      <ul className="review-list">
        {filteredReviews.map((r, idx) => {
          const id = (r as any)._id || (r as any).id || String(idx);
          const user = (r as any).user_id;
          const userLabel = typeof user === "object" && user
            ? (user.name || user.email || toId(user))
            : String(user || "");
          const product = (r as any).product_id;
          const courseObj = (r as any).course || (typeof product === "object" ? product : null);
          const productLabel = courseObj
            ? (courseObj.title || courseObj.name || toId(courseObj))
            : String(product || "");
          const createdAt = (r as any).created_at ? new Date((r as any).created_at) : null;
          return (
            <li key={String(id)}>
              <div className="review-info">
                <span>ID: {String(id)}</span>
                <span>User: {userLabel || "(anonymous)"}</span>
                <span>Product: {productLabel || "(unknown)"}</span>
                <span>Rating: {r.rating}/5</span>
                <span>{(r as any).comment || (r as any).content || "(No comment)"}</span>
                <span>Status: {r.status}</span>
                {createdAt && <span>Created: {createdAt.toLocaleDateString()}</span>}
              </div>
              <div className="actions">
                {r.status !== "approved" && (
                  <button className="approve-btn" onClick={() => handleApprove(String(id))}>Approve</button>
                )}
                <button className="edit-btn" onClick={() => handleEdit(r)}>Edit</button>
                <button className="delete-btn" onClick={() => handleDelete(String(id))}>Delete</button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page}/{totalPages} • {total} items</span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
          {[10,20,50,100].map((n) => (
            <option key={n} value={n}>{n}/page</option>
          ))}
        </select>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedReview ? "Edit Review" : "Add New Review"}</h3>
            <ReviewForm
              initialData={selectedReview || {}}
              onSubmit={() => {
                setShowModal(false);
                loadReviews();
              }}
            />
            <button className="close-btn" onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageReviewsPage;

