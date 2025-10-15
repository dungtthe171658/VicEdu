import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import * as authApi from '../api/authApi';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [accept, setAccept] = useState(false);

  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    if (!fullName.trim()) return 'Vui lòng nhập họ tên.';
    if (!email.trim()) return 'Vui lòng nhập email.';
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return 'Email không hợp lệ.';
    if (password.length < 6) return 'Mật khẩu tối thiểu 6 ký tự.';
    if (password !== confirm) return 'Mật khẩu xác nhận không khớp.';
    if (!accept) return 'Bạn cần đồng ý Điều khoản sử dụng.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // chặn double submit
    setError(null);
    setSuccess(null);

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setIsLoading(true);
      // BE đang default role = "customer" -> không gửi role từ FE nữa
      await authApi.register({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      });

      setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.');
      // Điều hướng sang login sau 1s (tuỳ bạn giữ/ bỏ)
      setTimeout(() => navigate('/login', { replace: true }), 1000);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Không thể đăng ký. Vui lòng thử lại.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Đăng ký VicEdu</h1>
          <p className="mt-2 text-sm text-gray-600">Tạo tài khoản để bắt đầu học tập 🎓</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="text-sm font-medium text-gray-700">Họ và tên</label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Mật khẩu</label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPw ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm" className="text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                aria-label={showConfirm ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              checked={accept}
              onChange={(e) => setAccept(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              Tôi đồng ý với <span className="text-blue-600">Điều khoản sử dụng</span>
            </label>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          {success && <p className="text-sm text-green-600 text-center">{success}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang tạo tài khoản…' : 'Đăng ký'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
