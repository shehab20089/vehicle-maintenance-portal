import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Car, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const DEMO_ACCOUNTS = [
    { id: 'EMP-1042', role: 'مسؤول الحركة' },
    { id: 'EMP-2018', role: 'مدير الشؤون الإدارية' },
    { id: 'EMP-3055', role: 'مدير النقل والصيانة' },
    { id: 'EMP-4011', role: 'مدير التوجيه' },
    { id: 'EMP-5099', role: 'مسؤول الصيانة' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const success = login(employeeId, password);
    setIsLoading(false);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('رقم الموظف أو كلمة المرور غير صحيحة. حاول مجدداً.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/30 mb-4">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">بوابة صيانة المركبات</h1>
          <p className="mt-1 text-sm text-muted-foreground">نظام إدارة طلبات الصيانة الداخلي</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border bg-card shadow-xl p-8">
          <h2 className="mb-6 text-lg font-bold text-foreground">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Employee ID */}
            <div className="space-y-1.5">
              <label htmlFor="employeeId" className="block text-sm font-medium text-foreground">
                رقم الموظف
              </label>
              <input
                id="employeeId"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="مثال: EMP-1042"
                required
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  required
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !employeeId || !password}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {isLoading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              <button type="button" className="text-primary hover:underline">
                نسيت كلمة المرور؟
              </button>
            </p>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="mt-4 rounded-xl border border-border bg-card/60 p-4">
          <p className="mb-3 text-xs font-semibold text-muted-foreground text-center">حسابات العرض التجريبي (كلمة المرور: 123456)</p>
          <div className="grid grid-cols-1 gap-1.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => { setEmployeeId(acc.id); setPassword('123456'); }}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium bg-muted/50 hover:bg-muted text-foreground transition-colors"
              >
                <span className="text-muted-foreground font-mono">{acc.id}</span>
                <span>{acc.role}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          نظام إدارة طلبات صيانة المركبات — للاستخدام الداخلي فقط
        </p>
      </div>
    </div>
  );
}
