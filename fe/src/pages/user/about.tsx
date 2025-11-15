import React, { useState, useEffect } from 'react';
import { BookOpen, Video, Users, Award, TrendingUp, Check, Star, ChevronRight } from 'lucide-react';
import courseApi from '../../api/courseApi';

const VicEduLanding = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch 3 khóa học nổi bật
  useEffect(() => {
    (async () => {
      try {
        const res = await courseApi.getAll();
        // Lấy 3 khóa học đầu tiên
        const allCourses = Array.isArray(res) ? res : res?.data || res?.items || [];
        setCourses(allCourses.slice(0, 3));
      } catch (err) {
        console.error('Failed to load courses:', err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const features = [
    {
      icon: Video,
      title: "Khóa học chất lượng cao",
      description: "Hàng ngàn khóa học từ cơ bản đến nâng cao, được giảng dạy bởi các chuyên gia hàng đầu"
    },
    {
      icon: BookOpen,
      title: "Thư viện sách phong phú",
      description: "Kho tài liệu và sách điện tử đa dạng, cập nhật liên tục theo xu hướng mới nhất"
    },
    {
      icon: Award,
      title: "Chứng chỉ uy tín",
      description: "Nhận chứng chỉ hoàn thành được công nhận, nâng cao giá trị CV của bạn"
    },
    {
      icon: Users,
      title: "Cộng đồng học tập",
      description: "Kết nối với hàng nghìn học viên, chia sẻ kinh nghiệm và cùng nhau phát triển"
    }
  ];

  const stats = [
    { number: "50K+", label: "Học viên" },
    { number: "500+", label: "Khóa học" },
    { number: "1000+", label: "Đầu sách" },
    { number: "98%", label: "Hài lòng" }
  ];

  const testimonials = [
    {
      name: "Phạm Minh Tuấn",
      role: "Sinh viên IT",
      content: "VicEdu đã giúp tôi nâng cao kỹ năng lập trình một cách đáng kể. Các khóa học rất thực tế và dễ hiểu!",
      rating: 5
    },
    {
      name: "Nguyễn Thu Hà",
      role: "Marketing Manager",
      content: "Tôi đã tìm thấy rất nhiều tài liệu hữu ích và khóa học chất lượng cao tại VicEdu. Rất đáng đầu tư!",
      rating: 5
    },
    {
      name: "Trần Đức Anh",
      role: "Designer",
      content: "Nền tảng dễ sử dụng, nội dung phong phú và giá cả hợp lý. Tôi đã giới thiệu cho nhiều bạn bè!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white pt-20 pb-20">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Học tập không giới hạn
              <br />
              <span className="text-yellow-300">Cùng VicEdu</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Nền tảng học trực tuyến hàng đầu với hàng nghìn khóa học chất lượng cao 
              và thư viện sách phong phú, giúp bạn phát triển kỹ năng và đạt mục tiêu
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tại sao chọn VicEdu?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Chúng tôi cung cấp trải nghiệm học tập toàn diện với các tính năng vượt trội
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2">
                <div className="bg-blue-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="text-blue-600" size={28} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Khóa học nổi bật
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Được yêu thích nhất bởi học viên
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-300"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-300 rounded mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded mb-4 w-2/3"></div>
                    <div className="h-8 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <p className="text-center text-gray-500">Chưa có khóa học nào</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {courses.map((course, index) => {
                const gradients = [
                  'bg-gradient-to-br from-blue-500 to-purple-600',
                  'bg-gradient-to-br from-pink-500 to-orange-500',
                  'bg-gradient-to-br from-green-500 to-teal-600'
                ];
                
                return (
                  <div key={course._id || index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition transform hover:-translate-y-2">
                    {course.thumbnail_url ? (
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="h-48 w-full object-cover"
                      />
                    ) : (
                      <div className={`h-48 ${gradients[index % 3]} flex items-center justify-center`}>
                        <Video className="text-white" size={64} />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                          {course.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-blue-600">
                          {course.price_cents ? `${course.price_cents.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                        </span>
                        <a
                          href={`/courses/${course.slug}`}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                          Đăng ký
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <a
              href="/courses"
              className="inline-flex items-center bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Xem tất cả khóa học
              <ChevronRight className="ml-2" size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* Books Section */}
      <section id="books" className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Thư viện sách
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Hơn 1000 đầu sách từ các lĩnh vực: Công nghệ, Marketing, Thiết kế đồ họa. Đọc mọi lúc mọi nơi trên mọi thiết bị.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Cập nhật liên tục các đầu sách mới nhất",
                  "Đọc offline, không cần internet",
                  "Ghi chú và đánh dấu trang thông minh",
                  "Đồng bộ tiến độ đọc trên nhiều thiết bị"
                ].map((item, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <Check className="text-green-500 mr-3 flex-shrink-0" size={24} />
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
              <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition font-semibold">
                Khám phá thư viện
              </button>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white p-4 rounded-lg shadow-lg transform hover:scale-105 transition">
                    <div className="bg-gradient-to-br from-blue-400 to-purple-500 h-48 rounded-lg flex items-center justify-center mb-3">
                      <BookOpen className="text-white" size={48} />
                    </div>
                    <div className="h-2 bg-gray-200 rounded mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Học viên nói gì về VicEdu
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hàng nghìn học viên đã tin tưởng và phát triển cùng chúng tôi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current" size={20} />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Sẵn sàng bắt đầu hành trình học tập?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Tham gia cùng hơn 50,000 học viên đang học tập và phát triển mỗi ngày
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-xl">
              Đăng ký miễn phí
            </button>
            <button className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition">
              Liên hệ tư vấn
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VicEduLanding;