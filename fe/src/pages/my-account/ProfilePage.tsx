import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Hồ sơ cá nhân</h1>

      <div className="bg-white rounded-2xl shadow p-6 grid grid-cols-1 sm:grid-cols-[120px,1fr] gap-6">
        <div className="flex items-start">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt="avatar"
              className="h-24 w-24 rounded-full object-cover border"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              No Avatar
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Họ và tên</label>
            <input value={user.name || ""} readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Email</label>
            <input value={user.email || ""} readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" />
          </div>
          {user.phone && (
            <div>
              <label className="block text-sm text-gray-500 mb-1">Số điện thoại</label>
              <input value={user.phone} readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" />
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {/* <span className="px-2 py-1 rounded bg-gray-100">Role: {user.role}</span> */}
            {user.is_verified ? (
              <span className="px-2 py-1 rounded bg-green-100 text-green-700">Đã xác minh</span>
            ) : (
              <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700">Chưa xác minh</span>
            )}
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
