import { Request, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth";
import UserModel from "../models/user.model";

const isValidObjectId = (id: any) => mongoose.Types.ObjectId.isValid(id);
const toObjectId = (id: any): mongoose.Types.ObjectId | null =>
  isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null;

const parseNum = (v: any, d = 0) => (v === undefined ? d : Number(v));
const parseBool = (v: any) =>
  v === true || v === "true" ? true : v === false || v === "false" ? false : undefined;

const SAFE_USER_PROJECTION = "-password -__v"; // ẩn trường nhạy cảm
const PROFILE_PROJECTION = "-password -__v"; // muốn ẩn thêm trường gì thì thêm ở đây
/**
 * GET /users
 * [Admin] Liệt kê người dùng với lọc/tìm kiếm/phân trang/sort + meta.
 * query: search, role, isActive, includeDeleted, sortBy(fullName|email|created_at), order(asc|desc), page, limit
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      role,
      isActive,
      includeDeleted, // true/false
      sortBy,
      order,
      page = "1",
      limit = "20",
    } = req.query;

    const filter: Record<string, any> = {};

    if (search) {
      const s = String(search);
      filter.$or = [
        { fullName: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { phone: { $regex: s, $options: "i" } },
      ];
    }

    if (role) filter.role = String(role);
    const activeFlag = parseBool(isActive);
    if (activeFlag !== undefined) filter.isActive = activeFlag;

    // sort whitelist
    const dir: 1 | -1 = order === "asc" ? 1 : -1;
    const sortWhitelist = new Set(["fullName", "email", "created_at"]);
    const sort: Record<string, 1 | -1> = sortWhitelist.has(String(sortBy))
      ? { [String(sortBy)]: dir }
      : { created_at: -1 };

    // paging
    const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    // Nếu có plugin mongoose-delete:
    //  - includeDeleted=true => dùng findWithDeleted, countWithDeleted
    //  - ngược lại => find bình thường (không lấy deleted)
    const useWithDeleted = parseBool(includeDeleted) === true;

    const queryExec = async () => {
      if ((UserModel as any).findWithDeleted && useWithDeleted) {
        const [data, total] = await Promise.all([
          (UserModel as any)
            .findWithDeleted(filter)
            .select(SAFE_USER_PROJECTION)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean(),
          (UserModel as any).countDocumentsWithDeleted
            ? (UserModel as any).countDocumentsWithDeleted(filter)
            : UserModel.countDocuments(filter),
        ]);
        return { data, total };
      } else {
        const [data, total] = await Promise.all([
          UserModel.find(filter)
            .select(SAFE_USER_PROJECTION)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean(),
          UserModel.countDocuments(filter),
        ]);
        return { data, total };
      }
    };

    const { data, total } = await queryExec();

    res.status(200).json({
      data,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

/**
 * GET /users/me
 * Lấy thông tin cá nhân (từ token).
 */
export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // req.user đã được gắn bởi middleware auth
    res.status(200).json(req.user);
  } catch (error: any) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

export const getMyProfileFull = async (req: AuthRequest, res: Response) => {
  try {
    const userId =
      (req.user as any)?._id?.toString?.() || (req.user as any)?.id?.toString?.();
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await UserModel.findById(userId)
      .select(PROFILE_PROJECTION)
      // .populate([{ path: "courses", select: "title slug" }]) // nếu cần populate
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ user });
  } catch (e: any) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * GET /users/me/avatar
 * Lấy avatar của user từ token (nhẹ hơn so với trả full profile).
 */
export const getMyAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const userId =
      (req.user as any)?._id?.toString?.() || (req.user as any)?.id?.toString?.();
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });

    const doc = await UserModel.findById(userId)
      .select({ avatar: 1, _id: 0 })
      .lean();

    if (!doc) return res.status(404).json({ message: "User not found" });

    return res.json({ avatar: doc.avatar ?? null });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Server error" });
  }
};


export const updateMyAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const { image_url, image_public_id } = req.body as {
      image_url?: string;
      image_public_id?: string;
    };

    if (!image_url || !image_public_id) {
      return res
        .status(400)
        .json({ message: "Thiếu image_url hoặc image_public_id" });
    }

    // userId lấy từ middleware auth gắn vào req.user
    const userId =
      (req.user as any)?._id?.toString?.() || (req.user as any)?.id?.toString?.();
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // cập nhật avatar và (tuỳ chọn) lưu cả public_id để sau này xoá Cloudinary
    const updated = await UserModel.findByIdAndUpdate(
      userId,
      {
        avatar: image_url,
        avatar_public_id: image_public_id,
        updated_at: new Date(),
      },
      { new: true, runValidators: true }
    )
      .select(SAFE_USER_PROJECTION)
      .lean();

    if (!updated) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    return res.json({
      message: "Cập nhật avatar thành công",
      user: updated,
    });
  } catch (e: any) {
    return res.status(500).json({ message: e.message });
  }
};


/**
 * GET /users/:id
 * [Admin] Lấy user theo ID (kể cả đã xóa mềm nếu có plugin).
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid user ID format." });
      return;
    }

    let user: any;
    if ((UserModel as any).findOneWithDeleted) {
      user = await (UserModel as any)
        .findOneWithDeleted({ _id: id })
        .select(SAFE_USER_PROJECTION)
        .lean();
    } else {
      user = await UserModel.findById(id).select(SAFE_USER_PROJECTION).lean();
    }

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

/**
 * POST /users
 * [Admin] Tạo mới user (không xử lý password ở đây – giả định có flow đăng ký/đặt mật khẩu riêng).
 * Body: fullName, email, phone?, role, isActive?, avatarUrl?
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role, avatar } = req.body;

    if (!name || !email || !role || !password) {
      res.status(400).json({ message: "name, email, role, password are required." });
      return;
    }

    const exists = await UserModel.exists({ email: String(email).toLowerCase() });
    if (exists) {
      res.status(409).json({ message: "Email already exists." });
      return;
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      name,
      email: String(email).toLowerCase(),
      password: hashedPassword,
      phone,
      role,
      avatar,
      is_verified: false,
    });

    const plainUser = user.toObject() as Record<string, any>;
    delete plainUser.password;

    res.status(201).json({ message: "User created successfully.", user: plainUser });
  } catch (error: any) {
    console.error("❌ CreateUser Error:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};


/**
 * PUT /users/:id
 * [Admin] Cập nhật thông tin user (không đổi password ở đây).
 * Body: fullName?, phone?, role?, isActive?, avatarUrl?, email? (validate trùng)
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid user ID format." });
      return;
    }

    const payload: any = {};
    const { fullName, phone, role, isActive, avatarUrl, email } = req.body;

    if (fullName !== undefined) payload.fullName = fullName;
    if (phone !== undefined) payload.phone = phone;
    if (role !== undefined) payload.role = role;
    if (isActive !== undefined) payload.isActive = Boolean(isActive);
    if (avatarUrl !== undefined) payload.avatarUrl = avatarUrl;

    if (email !== undefined) {
      const emailNorm = String(email).toLowerCase();
      const exists = await UserModel.exists({ email: emailNorm, _id: { $ne: id } });
      if (exists) {
        res.status(409).json({ message: "Email already exists." });
        return;
      }
      payload.email = emailNorm;
    }

    const updated = await UserModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    })
      .select(SAFE_USER_PROJECTION)
      .lean();

    if (!updated) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    res.status(200).json({ message: "User updated successfully.", user: updated });
  } catch (error: any) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

/**
 * POST /users/:id/lock
 * [Admin] Khóa tài khoản trong X giờ.
 */
export const lockUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const hours = parseNum(req.body.hours);
    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid user ID format." });
      return;
    }
    if (!hours || isNaN(hours) || hours <= 0) {
      res.status(400).json({ message: "Invalid lock duration in hours." });
      return;
    }

    const lockedUntil = new Date(Date.now() + hours * 3600 * 1000);
    const user = await UserModel.findByIdAndUpdate(
      id,
      { lockedUntil },
      { new: true }
    )
      .select(SAFE_USER_PROJECTION)
      .lean();

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    res
      .status(200)
      .json({ message: `User locked until ${lockedUntil.toISOString()}`, user });
  } catch (error: any) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

/**
 * POST /users/:id/unlock
 * [Admin] Mở khóa tài khoản ngay.
 */
export const unlockUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid user ID format." });
      return;
    }
    const user = await UserModel.findByIdAndUpdate(id, { lockedUntil: null }, { new: true })
      .select(SAFE_USER_PROJECTION)
      .lean();

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    res.status(200).json({ message: "User unlocked successfully.", user });
  } catch (error: any) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

/**
 * DELETE /users/:id
 * [Admin] Xóa mềm người dùng (mongoose-delete).
 */
export const softDeleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid user ID format." });
      return;
    }

    if ((UserModel as any).delete) {
      const result = await (UserModel as any).delete({ _id: id });
      // plugin thường trả về { acknowledged, deletedCount / modifiedCount }
      if (!result || (result.modifiedCount === 0 && result.deletedCount === 0)) {
        res.status(404).json({ message: "User not found or already deleted." });
        return;
      }
      res.status(200).json({ message: "User soft-deleted successfully." });
    } else {
      // fallback: hard delete (nếu không dùng plugin)
      const deleted = await UserModel.findByIdAndDelete(id).lean();
      if (!deleted) {
        res.status(404).json({ message: "User not found." });
        return;
      }
      res.status(200).json({ message: "User deleted permanently.", user: deleted });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

/**
 * POST /users/:id/restore
 * [Admin] Khôi phục user đã xóa mềm.
 */
export const restoreUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid user ID format." });
      return;
    }

    if ((UserModel as any).restore) {
      const result = await (UserModel as any).restore({ _id: id });
      if (!result || result.modifiedCount === 0) {
        res.status(404).json({ message: "User not found or not deleted." });
        return;
      }
      // trả về bản ghi sau khi restore
      const user = await UserModel.findById(id).select(SAFE_USER_PROJECTION).lean();
      res.status(200).json({ message: "User restored successfully.", user });
    } else {
      res.status(400).json({ message: "Restore is not supported (plugin missing)." });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};
