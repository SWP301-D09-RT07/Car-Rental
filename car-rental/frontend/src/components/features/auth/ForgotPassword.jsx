import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCarSide,
  FaCheckCircle,
  FaEnvelope,
  FaKey,
  FaShieldAlt,
} from 'react-icons/fa';
import { checkEmail } from '../../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await checkEmail(email);
      setMessage('Yêu cầu đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email của bạn.');
      setTimeout(() => navigate('/login'), 2200);
    } catch (err) {
      setError(err?.message || 'Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100">
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-[-4rem] top-16 h-36 w-36 rounded-full bg-sky-300/25 blur-3xl" />
          <div className="absolute right-[-2rem] top-28 h-40 w-40 rounded-full bg-indigo-300/20 blur-3xl" />
          <div className="absolute bottom-10 left-1/3 h-44 w-44 rounded-full bg-cyan-200/20 blur-3xl" />
        </div>

        <div className="relative grid w-full overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-2xl backdrop-blur xl:grid-cols-[1.05fr_0.95fr]">
          <div className="p-6 font-sans sm:p-8 lg:p-12">
            <Link
              to="/login"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
            >
              <FaArrowLeft className="text-xs" />
              Quay lại đăng nhập
            </Link>

            <div className="mb-8">
              <Link to="/" className="inline-flex items-center group">
                <div className="mr-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-3 shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl">
                  <FaCarSide className="text-xl text-white" />
                </div>
                <div>
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-2xl font-bold font-heading text-transparent">
                    DriveLuxe
                  </span>
                  <p className="-mt-1 text-xs text-gray-500">Premium Car Rental</p>
                </div>
              </Link>

              <h1 className="mt-6 text-3xl font-bold font-heading text-slate-900 sm:text-4xl">
                Quên mật khẩu
              </h1>
            </div>

            <div className="mb-8 max-w-xl">
              <p className="text-base leading-7 text-slate-600 sm:text-lg">
                Nhập email đã đăng ký để chúng tôi gửi hướng dẫn khôi phục tài khoản cho bạn.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Địa chỉ email
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <FaEnvelope />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="Nhập email đã đăng ký"
                    className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3.5 pl-12 pr-4 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>

              {message && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-700 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:from-sky-700 hover:to-indigo-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Đang gửi yêu cầu...
                  </>
                ) : (
                  <>
                    <FaKey />
                    Gửi yêu cầu đặt lại mật khẩu
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <Link to="/login" className="font-medium text-sky-700 transition hover:text-sky-900">
                Đã nhớ mật khẩu? Đăng nhập
              </Link>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
              <Link to="/" className="font-medium text-slate-600 transition hover:text-slate-900">
                Về trang chủ
              </Link>
            </div>
          </div>

          <div className="hidden xl:flex xl:flex-col xl:justify-between bg-gradient-to-br from-slate-900 via-sky-900 to-indigo-950 p-12 text-white">
            <div>
              <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-sky-100 backdrop-blur">
                <FaShieldAlt />
                Bảo vệ tài khoản an toàn
              </div>

              <h2 className="max-w-md text-4xl font-semibold font-heading leading-tight">
                Khôi phục quyền truy cập một cách nhanh gọn và rõ ràng.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-sky-100/80">
                Hệ thống sẽ hướng dẫn bạn từng bước để đặt lại mật khẩu và quay trở lại hành trình
                thuê xe mà không bị rời mạch.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-200">
                    <FaCheckCircle />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold font-heading">Kiểm tra email đăng ký</h3>
                    <p className="mt-1 text-sm leading-6 text-sky-100/75">
                      Chỉ cần dùng đúng email đã tạo tài khoản để bắt đầu khôi phục.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/20 text-cyan-200">
                    <FaEnvelope />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold font-heading">Nhận hướng dẫn reset</h3>
                    <p className="mt-1 text-sm leading-6 text-sky-100/75">
                      Bạn sẽ được đưa đến bước đặt lại mật khẩu để tiếp tục ngay.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/20 text-violet-200">
                    <FaKey />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold font-heading">Đặt mật khẩu mới</h3>
                    <p className="mt-1 text-sm leading-6 text-sky-100/75">
                      Chọn mật khẩu mạnh hơn để tài khoản luôn an toàn cho những lần đăng nhập sau.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
