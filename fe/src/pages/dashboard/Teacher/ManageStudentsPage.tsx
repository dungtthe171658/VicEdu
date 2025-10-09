import React from 'react';
import { FaPlus } from 'react-icons/fa';

const ManageStudentsPage = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Học sinh</h1>
        <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center">
          <FaPlus className="mr-2" />
          Thêm học sinh mới
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600">
          {/* Bảng dữ liệu học sinh sẽ được hiển thị ở đây. */}
          Đây là nơi giáo viên sẽ thấy danh sách học sinh của lớp mình, xem điểm, và thực hiện các thao tác khác.
        </p>
      </div>
    </div>
  );
};

export default ManageStudentsPage;