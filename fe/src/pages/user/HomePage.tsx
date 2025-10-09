import React from 'react';

const HomePage = () => {
  return (
    <div className="container mx-auto px-6 py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Chào mừng đến với VicEdu
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Nền tảng học tập trực tuyến dành cho tương lai.
      </p>
      <button className="bg-blue-500 text-white font-bold py-3 px-6 rounded-full hover:bg-blue-600 transition duration-300">
        Khám phá các khóa học
      </button>
    </div>
  );
};

export default HomePage;