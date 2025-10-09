import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { FaUsers, FaBookOpen, FaChalkboardTeacher } from 'react-icons/fa';

const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
    <div className={`mr-4 p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);


const OverviewPage = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Chào mừng trở lại, {user?.fullName}!
      </h1>

      {/* Grid of statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          icon={<FaUsers size={24} className="text-white" />}
          title="Tổng số học sinh"
          value="1,250"
          color="bg-blue-500"
        />
        <StatCard 
          icon={<FaBookOpen size={24} className="text-white" />}
          title="Khóa học đang hoạt động"
          value="42"
          color="bg-green-500"
        />
        <StatCard 
          icon={<FaChalkboardTeacher size={24} className="text-white" />}
          title="Giáo viên"
          value="78"
          color="bg-purple-500"
        />
      </div>

      {/* Thêm các component khác ở đây, ví dụ: biểu đồ, danh sách công việc... */}
    </div>
  );
};

export default OverviewPage;