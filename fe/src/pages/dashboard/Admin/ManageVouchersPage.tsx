import { useEffect, useState } from "react";

import "./ManageVouchersPage.css"; // tái dùng style bảng sẵn có
import type {CreateVoucherPayload, VoucherApplyTo, VoucherDto, VoucherType} from "@/api/voucherApi";
import voucherApi from "@/api/voucherApi";

const formatVND = (n: number | null | undefined) =>
    (n ?? 0).toLocaleString("vi-VN");

// Convert ISO → datetime-local value
const toDateTimeLocal = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (v: number) => v.toString().padStart(2, "0");
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
};

const ManageVouchersPage = () => {
    const [vouchers, setVouchers] = useState<VoucherDto[]>([]);
    const [loading, setLoading] = useState(true);

    // form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [type, setType] = useState<VoucherType>("amount");
    const [value, setValue] = useState<number>(0);
    const [applyTo, setApplyTo] = useState<VoucherApplyTo>("both");
    const [minOrderAmount, setMinOrderAmount] = useState<number | null>(0);
    const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | null>(null);
    const [totalUsageLimit, setTotalUsageLimit] = useState<number | null>(null);
    const [startAt, setStartAt] = useState<string>(""); // datetime-local
    const [endAt, setEndAt] = useState<string>(""); // datetime-local

    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const loadVouchers = async () => {
        try {
            setLoading(true);
            const data = await voucherApi.getAll();
            setVouchers(data);
        } catch (error) {
            console.error("Error loading vouchers:", error);
            alert("Không thể tải danh sách voucher!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVouchers();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setCode("");
        setType("amount");
        setValue(0);
        setApplyTo("both");
        setMinOrderAmount(0);
        setMaxDiscountAmount(null);
        setTotalUsageLimit(null);
        setStartAt("");
        setEndAt("");
        setFormError(null);
    };

    const fillFormForEdit = (v: VoucherDto) => {
        setEditingId(v._id);
        setCode(v.code);
        setType(v.type);
        setValue(v.value);
        setApplyTo(v.applyTo);
        setMinOrderAmount(
            v.minOrderAmount === null || v.minOrderAmount === undefined
                ? 0
                : v.minOrderAmount
        );
        setMaxDiscountAmount(
            v.maxDiscountAmount === null || v.maxDiscountAmount === undefined
                ? null
                : v.maxDiscountAmount
        );
        setTotalUsageLimit(
            v.totalUsageLimit === null || v.totalUsageLimit === undefined
                ? null
                : v.totalUsageLimit
        );
        setStartAt(toDateTimeLocal(v.startAt));
        setEndAt(toDateTimeLocal(v.endAt));
        setFormError(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa voucher này?")) return;
        try {
            await voucherApi.delete(id);
            setVouchers((prev) => prev.filter((v) => v._id !== id));
        } catch (error) {
            console.error("Error deleting voucher:", error);
            alert("Không thể xóa voucher!");
        }
    };

    const handleToggleActive = async (v: VoucherDto) => {
        try {
            const updated = await voucherApi.update(v._id, {
                isActive: !v.isActive,
            });
            setVouchers((prev) =>
                prev.map((item) => (item._id === v._id ? updated : item))
            );
        } catch (error) {
            console.error("Error toggling voucher:", error);
            alert("Không thể cập nhật trạng thái voucher!");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!code.trim()) {
            setFormError("Mã voucher không được để trống");
            return;
        }
        if (!startAt || !endAt) {
            setFormError("Vui lòng chọn thời gian bắt đầu và kết thúc");
            return;
        }

        const payload: CreateVoucherPayload = {
            code: code.trim(),
            type,
            value: Number(value),
            applyTo,
            minOrderAmount:
                minOrderAmount == null ? null : Number(minOrderAmount) || 0,
            maxDiscountAmount:
                maxDiscountAmount == null
                    ? null
                    : Number(maxDiscountAmount) || 0,
            totalUsageLimit:
                totalUsageLimit == null
                    ? null
                    : Number(totalUsageLimit) || null,
            startAt: new Date(startAt).toISOString(),
            endAt: new Date(endAt).toISOString(),
        };

        try {
            setSaving(true);
            if (editingId) {
                const updated = await voucherApi.update(editingId, payload);
                setVouchers((prev) =>
                    prev.map((v) => (v._id === editingId ? updated : v))
                );
                alert("Cập nhật voucher thành công!");
            } else {
                const created = await voucherApi.create(payload);
                setVouchers((prev) => [created, ...prev]);
                alert("Tạo voucher mới thành công!");
            }
            resetForm();
        } catch (error: any) {
            console.error("Error saving voucher:", error);
            const msg =
                error?.response?.data?.message || "Không thể lưu voucher!";
            setFormError(msg);
        } finally {
            setSaving(false);
        }
    };

    const getTypeLabel = (v: VoucherDto) =>
        v.type === "amount"
            ? `Giảm ${formatVND(v.value)}₫`
            : `Giảm ${v.value}%`;

    return (
        <div className="order-management-container">
            <div className="header">
                <h2>Quản lý Voucher</h2>
                <button className="refresh-btn" onClick={loadVouchers}>
                    Làm mới
                </button>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "24px",
                    alignItems: "flex-start",
                }}
            >
                {/* BẢNG DANH SÁCH VOUCHER */}
                <div>
                    {loading ? (
                        <p>Đang tải danh sách voucher...</p>
                    ) : vouchers.length === 0 ? (
                        <p>Không có voucher nào.</p>
                    ) : (
                        <table className="order-table">
                            <thead>
                            <tr>
                                <th>Mã</th>
                                <th>Loại</th>
                                <th>Áp dụng</th>
                                <th>Đơn tối thiểu</th>
                                <th>Giảm tối đa</th>
                                <th>Lượt / Tổng</th>
                                <th>Thời gian</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                            </thead>
                            <tbody>
                            {vouchers.map((v) => (
                                <tr key={v._id}>
                                    <td>{v.code}</td>
                                    <td>{getTypeLabel(v)}</td>
                                    <td>{v.applyTo}</td>
                                    <td>{formatVND(v.minOrderAmount)}₫</td>
                                    <td>
                                        {v.maxDiscountAmount != null
                                            ? `${formatVND(v.maxDiscountAmount)}₫`
                                            : "—"}
                                    </td>
                                    <td>
                                        {v.usedCount} /{" "}
                                        {v.totalUsageLimit != null ? v.totalUsageLimit : "∞"}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: "12px" }}>
                                            <div>
                                                từ{" "}
                                                {new Date(v.startAt).toLocaleString("vi-VN")}
                                            </div>
                                            <div>
                                                đến{" "}
                                                {new Date(v.endAt).toLocaleString("vi-VN")}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                      <span
                          style={{
                              color: v.isActive ? "green" : "gray",
                              fontWeight: 600,
                          }}
                      >
                        {v.isActive ? "Đang bật" : "Tắt"}
                      </span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", gap: "6px" }}>
                                            <button
                                                onClick={() => fillFormForEdit(v)}
                                                style={{
                                                    padding: "4px 8px",
                                                    fontSize: "12px",
                                                    backgroundColor: "#3b82f6",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(v)}
                                                style={{
                                                    padding: "4px 8px",
                                                    fontSize: "12px",
                                                    backgroundColor: v.isActive
                                                        ? "#f97316"
                                                        : "#22c55e",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                {v.isActive ? "Tắt" : "Bật"}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(v._id)}
                                                style={{
                                                    padding: "4px 8px",
                                                    fontSize: "12px",
                                                    backgroundColor: "#ef4444",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* FORM TẠO / SỬA VOUCHER */}
                <div
                    style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "16px",
                        backgroundColor: "white",
                    }}
                >
                    <h3 style={{ marginBottom: "12px" }}>
                        {editingId ? "Sửa Voucher" : "Thêm Voucher mới"}
                    </h3>
                    <form onSubmit={handleSubmit} className="voucher-form">
                        <div className="form-group">
                            <label>Mã voucher</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="VD: GIAM10K"
                            />
                        </div>

                        <div className="form-group">
                            <label>Loại giảm</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as VoucherType)}
                            >
                                <option value="amount">Giảm số tiền (VND)</option>
                                <option value="percent">Giảm theo %</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>
                                Giá trị{" "}
                                {type === "amount" ? "(VND)" : "(%)"}
                            </label>
                            <input
                                type="number"
                                value={value}
                                onChange={(e) => setValue(Number(e.target.value))}
                                min={0}
                            />
                        </div>

                        <div className="form-group">
                            <label>Áp dụng cho</label>
                            <select
                                value={applyTo}
                                onChange={(e) =>
                                    setApplyTo(e.target.value as VoucherApplyTo)
                                }
                            >
                                <option value="both">Tất cả (Sách + Khóa học)</option>
                                <option value="book">Chỉ sách</option>
                                <option value="course">Chỉ khóa học</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Đơn hàng tối thiểu (VND)</label>
                            <input
                                type="number"
                                value={minOrderAmount ?? 0}
                                onChange={(e) =>
                                    setMinOrderAmount(
                                        e.target.value === "" ? 0 : Number(e.target.value)
                                    )
                                }
                                min={0}
                            />
                        </div>

                        <div className="form-group">
                            <label>Giảm tối đa (cho % - VND)</label>
                            <input
                                type="number"
                                value={maxDiscountAmount ?? ""}
                                onChange={(e) =>
                                    setMaxDiscountAmount(
                                        e.target.value === ""
                                            ? null
                                            : Number(e.target.value)
                                    )
                                }
                                min={0}
                            />
                        </div>

                        <div className="form-group">
                            <label>Tổng số lượt dùng</label>
                            <input
                                type="number"
                                value={totalUsageLimit ?? ""}
                                onChange={(e) =>
                                    setTotalUsageLimit(
                                        e.target.value === ""
                                            ? null
                                            : Number(e.target.value)
                                    )
                                }
                                min={0}
                            />
                            <small>Để trống = không giới hạn</small>
                        </div>

                        <div className="form-group">
                            <label>Thời gian bắt đầu</label>
                            <input
                                type="datetime-local"
                                value={startAt}
                                onChange={(e) => setStartAt(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Thời gian kết thúc</label>
                            <input
                                type="datetime-local"
                                value={endAt}
                                onChange={(e) => setEndAt(e.target.value)}
                            />
                        </div>

                        {formError && (
                            <p style={{ color: "red", fontSize: "13px" }}>{formError}</p>
                        )}

                        <div
                            style={{
                                marginTop: "12px",
                                display: "flex",
                                gap: "8px",
                            }}
                        >
                            <button
                                type="submit"
                                disabled={saving}
                                className="refresh-btn"
                            >
                                {saving
                                    ? "Đang lưu..."
                                    : editingId
                                        ? "Cập nhật voucher"
                                        : "Tạo voucher"}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: "4px",
                                        border: "1px solid #9ca3af",
                                        backgroundColor: "#f3f4f6",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                    }}
                                >
                                    Hủy chỉnh sửa
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ManageVouchersPage;
