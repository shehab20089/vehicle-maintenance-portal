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
    { id: 'EMP-1042', role: 'مسؤول الحركة', name: 'محمد الشهري' },
    { id: 'EMP-2018', role: 'مدير الشؤون الإدارية', name: 'سلمى العتيبي' },
    { id: 'EMP-3055', role: 'مدير شعبة النقل والصيانة', name: 'خالد القحطاني' },
    { id: 'EMP-4011', role: 'مدير الإمداد والصيانة', name: 'عبدالرحمن الدوسري' },
    { id: 'EMP-5033', role: 'مدير الصيانة', name: 'سعود الحربي' },
    { id: 'EMP-6099', role: 'مسؤول الصيانة', name: 'فيصل الزهراني' },
    { id: 'EMP-7077', role: 'مسؤول صيانة مختص', name: 'أحمد الغامدي' },
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-primary-soft">
            <Car className="h-9 w-9 text-primary-icon" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">بوابة صيانة المركبات</h1>
          <p className="mt-2 text-sm text-muted-foreground">اختر الخدمة التي تريد الوصول إليها</p>
          <div className="accent-line mt-5" />
        </div>

        <div className="surface-card p-8">
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
                className="w-full rounded-2xl border border-input bg-input-surface px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
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
                  className="w-full rounded-2xl border border-input bg-input-surface px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="mt-5 rounded-[1.5rem] border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <p className="mb-3 text-xs font-semibold text-muted-foreground text-center">حسابات العرض التجريبي (كلمة المرور: 123456)</p>
          <div className="grid grid-cols-1 gap-1.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => { setEmployeeId(acc.id); setPassword('123456'); }}
                className="flex items-center justify-between rounded-2xl border border-transparent px-3 py-2.5 text-xs font-medium bg-input-surface hover:border-primary/20 hover:bg-primary-soft/40 text-foreground transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-mono">{acc.id}</span>
                  <span className="text-muted-foreground">—</span>
                  <span>{acc.name}</span>
                </div>
                <span className="text-primary text-[10px]">{acc.role}</span>
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
