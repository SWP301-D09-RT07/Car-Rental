import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCarSide,
  FaCheckCircle,
  FaEnvelope,
  FaLock,
  FaShieldAlt,
} from 'react-icons/fa';
import { resetPassword } from '../../../services/api';

const passwordRules = [
  'Tối thiểu 8 ký tự',
  'Nên có chữ hoa, số và ký tự đặc biệt',
  'Không trùng với mật khẩu cũ',
];

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!email) {
      setError('Không tìm thấy email. Vui lòng kiểm tra lại liên kết.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, newPassword);
      setMessage('Đặt lại mật khẩu thành công. Đang chuyển về trang đăng nhập...');
      setTimeout(() => navigate('/login'), 2200);
    } catch (err) {
      setError(err?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-cyan-50 to-blue-100">
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-[-3rem] top-24 h-40 w-40 rounded-full bg-cyan-300/25 blur-3xl" />
          <div className="absolute right-[-4rem] top-20 h-48 w-48 rounded-full bg-blue-300/20 blur-3xl" />
          <div className="absolute bottom-14 right-1/4 h-44 w-44 rounded-full bg-indigo-200/25 blur-3xl" />
        </div>

        <div className="relative grid w-full overflow-hidden rounded-[32px] border border-white/70 bg-white/85 shadow-2xl backdrop-blur xl:grid-cols-[1fr_1fr]">
          <div className="order-2 bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-950 p-12 font-sans text-white xl:order-1">
            <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-cyan-100 backdrop-blur">
              <FaShieldAlt />
              Đặt lại mật khẩu an toàn
            </div>

            <h2 className="max-w-md text-4xl font-semibold font-heading leading-tight">
              Tài khoản của bạn sắp sẵn sàng quay trở lại.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-cyan-100/80">
              Hoàn tất bước cập nhật mật khẩu mới để tiếp tục sử dụng hệ thống, theo dõi đơn đặt xe
              và quản lý chuyến đi một cách liền mạch.
            </p>

            <div className="mt-10 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-200">
                    <FaEnvelope />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold font-heading">Dùng đúng email</h3>
                    <p className="mt-1 text-sm leading-6 text-cyan-100/75">
                      Email đang được dùng làm khóa xác định tài khoản cần khôi phục.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-400/20 text-sky-200">
                    <FaLock />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold font-heading">Mật khẩu mới mạnh hơn</h3>
                    <p className="mt-1 text-sm leading-6 text-cyan-100/75">
                      Ưu tiên mật khẩu khó đoán và không sử dụng lại mật khẩu đã từng dùng trước
                      đây.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/20 text-violet-200">
                    <FaCheckCircle />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold font-heading">
                      Đăng nhập lại ngay sau đó
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-cyan-100/75">
                      Sau khi đổi mật khẩu thành công, bạn sẽ được đưa về trang đăng nhập để tiếp
                      tục.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 p-6 font-sans sm:p-8 lg:p-12 xl:order-2">
            <Link
              to="/forgot-password"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
            >
              <FaArrowLeft className="text-xs" />
              Quay lại bước trước
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
                Đặt lại mật khẩu
              </h1>
            </div>

            <p className="mb-8 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Tạo mật khẩu mới để bảo vệ tài khoản và tiếp tục sử dụng dịch vụ một cách an toàn.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email tài khoản
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <FaEnvelope />
                  </span>
                  <input
                    type="email"
                    value={email}
                    readOnly={!!emailFromUrl}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="Nhập email đã đăng ký"
                    className={`w-full rounded-2xl border py-3.5 pl-12 pr-4 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                      emailFromUrl
                        ? 'border-slate-200 bg-slate-100 focus:border-slate-300 focus:ring-slate-100'
                        : 'border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <FaLock />
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <FaLock />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-700">Gợi ý mật khẩu</p>
                <div className="mt-3 space-y-2">
                  {passwordRules.map(rule => (
                    <div key={rule} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                      {rule}
                    </div>
                  ))}
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
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-200 transition hover:from-cyan-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    Cập nhật mật khẩu
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <Link
                to="/login"
                className="font-medium text-cyan-700 transition hover:text-cyan-900"
              >
                Về trang đăng nhập
              </Link>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
              <Link to="/" className="font-medium text-slate-600 transition hover:text-slate-900">
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
