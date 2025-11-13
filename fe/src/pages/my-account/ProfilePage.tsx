// src/pages/my-account/ProfilePage.tsx
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { buildAvatarUrl } from "../../utils/buildAvatarUrl";
import axios from "../../api/axios";           // axios instance (đã có baseURL + token)
import userApi from "../../api/userApi";       // dùng để gọi /users/me/full

type CloudinarySign = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  upload_preset: string;
};

// Bạn có thể thay bằng UserDto của bạn nếu đã có type
type FullUser = {
  _id: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  is_verified?: boolean;
  role?: string;
  // ... các trường khác mà BE trả
};

export default function ProfilePage() {
  const { user, logout } = useAuth();  // user từ context (JWT)
  const navigate = useNavigate();

  const [fullUser, setFullUser] = useState<FullUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // Editable form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  // Lấy full profile từ BE
  const fetchFullProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await userApi.getProfileFull(); // GET /users/me/full
      // res.data dạng { user: FullUser }
      setFullUser(res.data.user);
      const u = res.data.user as FullUser;
      setName(u.fullName || u.name || user?.name || "");
      setEmail(u.email || user?.email || "");
      setPhone(u.phone || user?.phone || "");
      console.log("👉 Full profile:", res.data.user);
    } catch (e) {
      console.error("👉 Lỗi lấy full profile:", e);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchFullProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const payload: any = {
        name: String(name || "").trim(),
        email: String(email || "").trim(),
        phone: String((phone ?? "") as string).trim(),
      };
      await axios.put("/users/me", payload);
      await fetchFullProfile();
      alert("Cập nhật hồ sơ thành công!");
    } catch (e: any) {
      console.error("Lỗi cập nhật hồ sơ:", e);
      alert(e?.message || "Có lỗi khi cập nhật hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setSavingPwd(true);
      const curr = String(currentPwd || "");
      const next = String(newPwd || "").trim();
      const conf = String(confirmPwd || "").trim();

      if (!curr || !next || !conf) throw new Error("Vui lòng điền đầy đủ mật khẩu");
      if (next.length < 8) throw new Error("Mật khẩu mới phải từ 8 ký tự");
      if (next !== conf) throw new Error("Xác nhận mật khẩu không khớp");
      if (curr === next) throw new Error("Mật khẩu mới không được trùng mật khẩu hiện tại");

      await axios.put("/users/me/password", {
        currentPassword: curr,
        newPassword: next,
      });

      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      alert("Đổi mật khẩu thành công!");
    } catch (e: any) {
      console.error("Lỗi đổi mật khẩu:", e);
      alert(e?.message || "Không thể đổi mật khẩu");
    } finally {
      setSavingPwd(false);
    }
  };

  // BE trả THẲNG data do interceptor, nên res đã là JSON
  const getCloudinarySignature = async (
    folder: string,
    uploadPreset = "vicedu_default"
  ): Promise<CloudinarySign> => {
    const res = await axios.get<CloudinarySign>("/uploads/cloudinary-signature", {
      params: { folder, upload_preset: uploadPreset },
    });
    console.log("👉 Full res từ BE (đã là data do interceptor):", res);
    return res as unknown as CloudinarySign;
  };

  // Upload ảnh trực tiếp lên Cloudinary
  const uploadImageToCloudinary = async (
    file: File,
    sign: CloudinarySign
  ): Promise<{ secure_url: string; public_id: string }> => {
    console.log("👉 Sign nhận được ở FE:", sign);

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sign.apiKey);
    form.append("timestamp", String(sign.timestamp));
    form.append("upload_preset", sign.upload_preset?.trim());
    form.append("folder", sign.folder);
    form.append("signature", sign.signature);

    console.log("👉 FormData gửi Cloudinary:", {
      api_key: sign.apiKey,
      timestamp: sign.timestamp,
      upload_preset: sign.upload_preset?.trim(),
      folder: sign.folder,
      signature: sign.signature,
    });

    const endpoint = `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`;
    const res = await fetch(endpoint, { method: "POST", body: form });
    const json = await res.json();

    console.log("👉 Cloudinary trả về:", json);

    if (!json?.secure_url || !json?.public_id) {
      throw new Error(json?.error?.message || "Upload Cloudinary thất bại");
    }

    return { secure_url: json.secure_url, public_id: json.public_id };
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    try {
      console.log("👉 Bắt đầu upload avatar... file:", avatarFile);
      setUploadingAvatar(true);

      // 1) xin chữ ký từ BE
      const sign = await getCloudinarySignature("vicedu/images/avatars");
      console.log("👉 Chữ ký nhận được:", sign);

      // 2) upload lên Cloudinary
      const { secure_url, public_id } = await uploadImageToCloudinary(avatarFile, sign);
      console.log("👉 Upload Cloudinary OK:", { secure_url, public_id });

      // 3) cập nhật DB
      const updateRes = await axios.put("/users/me/avatar", {
        image_url: secure_url,
        image_public_id: public_id,
      });
      console.log("👉 API update avatar trả về:", updateRes);

      // 4) Refetch full profile để cập nhật UI
      await fetchFullProfile();

      alert("Cập nhật avatar thành công!");
    } catch (e: any) {
      console.error("👉 Lỗi upload avatar:", e);
      alert(e?.message || "Có lỗi khi upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-4">Hồ sơ</h1>
        <p className="text-gray-600">Bạn chưa đăng nhập.</p>
        <button
          onClick={() => navigate("/login")}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  const avatarSrc =
    buildAvatarUrl(fullUser?.avatar) || buildAvatarUrl(user.avatar) || "";
  const displayName = name;
  const displayEmail = email;
  const displayPhone = phone;
  const isVerified = (fullUser as any)?.is_verified ?? (user as any)?.is_verified ?? false;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Hồ sơ cá nhân</h1>

      <div className="bg-white rounded-2xl shadow p-6 grid grid-cols-1 sm:grid-cols-[140px,1fr] gap-6">
        {/* Avatar + Upload */}
        <div className="flex flex-col items-center gap-3">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="avatar"
              className="h-28 w-28 rounded-full object-cover border"
            />
          ) : (
            <div className="h-28 w-28 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              No Avatar
            </div>
          )}

          <div className="w-full">
            <label className="block text-sm text-gray-600 mb-1">
              Cập nhật ảnh đại diện
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-700"
            />
            <button
              onClick={handleUploadAvatar}
              disabled={!avatarFile || uploadingAvatar}
              className={`mt-2 w-full rounded-lg px-3 py-2 text-white ${
                uploadingAvatar ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {uploadingAvatar ? "Đang tải..." : "Upload Avatar"}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          {loadingProfile ? (
            <div className="text-sm text-gray-500">Đang tải hồ sơ...</div>
          ) : (
            <>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Họ và tên</label>
                <input
                  value={displayName}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Nhập họ tên"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Email</label>
                <input
                  value={displayEmail}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Nhập email"
                />
              </div>
              
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Số điện thoại</label>
                  <input
                    value={displayPhone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {isVerified ? (
                  <span className="px-2 py-1 rounded bg-green-100 text-green-700">
                    Đã xác minh
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700">
                    Chưa xác minh
                  </span>
                )}
              </div>

              <div className="mt-6 border-t pt-4">
                <h2 className="text-lg font-semibold mb-3">Đổi mật khẩu</h2>
                <div className="grid gap-3">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Nhập mật khẩu mới (>= 8 ký tự)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={savingPwd}
                  className={`mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 ${
                    savingPwd ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {savingPwd ? "Đang đổi..." : "Đổi mật khẩu"}
                </button>
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className={`bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 ${
                saving ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
