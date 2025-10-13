import React, { useState, useEffect } from 'react';
import { FaPlus, FaLock, FaUnlock, FaEdit, FaTrashAlt } from 'react-icons/fa';
import userApi from '../../../api/userApi';
import type { UserDto, UserRole } from '../../../types/user.d'; 
// import UserForm from "../../../components/common/UserForm"; // Tạm thời comment

const ManageUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Logic Gọi API (Read) ---
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      // Gọi API để lấy danh sách người dùng
      const res = await userApi.getAll(); 
      // Giả định response.data là mảng UserDto
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách người dùng:", err);
      setError("Không thể tải danh sách người dùng. Vui lòng kiểm tra kết nối API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // --- Helper để định dạng UI ---
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Admin</span>;
      case 'teacher':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">Teacher</span>;
      case 'customer':
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Customer</span>;
    }
  };

  const getUserStatus = (user: UserDto) => {
    if (user.deletedAt) {
      return <span className="text-red-500">Đã xóa mềm</span>;
    }
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return <span className="text-orange-500">Đã khóa</span>;
    }
    return <span className="text-green-500">Hoạt động</span>;
  };


  // --- Render UI ---
  if (loading) {
    return <div className="p-6">Đang tải danh sách người dùng...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Người dùng (UC01)</h1>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center">
          <FaPlus className="mr-2" />
          Thêm người dùng mới
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        {users.length === 0 ? (
            <p className="text-gray-600 text-center">Không có người dùng nào được tìm thấy.</p>
        ) : (
            <table className="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên đầy đủ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                        <tr key={user._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fullName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{getRoleBadge(user.role)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{getUserStatus(user)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                {/* Thao tác Sửa */}
                                <button title="Sửa thông tin" className="text-indigo-600 hover:text-indigo-900">
                                    <FaEdit />
                                </button>
                                
                                {/* Thao tác Khóa/Mở Khóa */}
                                {!user.deletedAt && (
                                    <button 
                                        title={user.lockedUntil ? "Mở khóa tài khoản" : "Khóa tài khoản"} 
                                        className={user.lockedUntil ? "text-green-600" : "text-orange-600"}
                                        // onClick={() => handleLockUnlock(user._id, !!user.lockedUntil)} // Logic sẽ thêm sau
                                    >
                                        {user.lockedUntil ? <FaUnlock /> : <FaLock />}
                                    </button>
                                )}

                                {/* Thao tác Xóa mềm */}
                                <button title="Xóa tài khoản" className="text-red-600 hover:text-red-900">
                                    <FaTrashAlt />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>
    </div>
  );
};

export default ManageUsersPage;