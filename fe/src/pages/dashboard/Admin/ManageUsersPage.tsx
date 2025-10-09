import React from 'react';
import { FaPlus } from 'react-icons/fa';

const ManageUsersPage = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Người dùng</h1>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center">
          <FaPlus className="mr-2" />
          Thêm người dùng mới
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600">
          {/* Bảng dữ liệu người dùng (sử dụng thư viện table hoặc tự code) sẽ được hiển thị ở đây. */}
          Đây là nơi bạn sẽ hiển thị danh sách tất cả người dùng với các chức năng tìm kiếm, phân trang, sửa, và xóa.
        </p>
      </div>
    </div>
  );
};

export default ManageUsersPage;