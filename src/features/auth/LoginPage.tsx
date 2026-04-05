import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROLE_LABELS } from '@/utils/arabicLabels';
import { Car, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, users, loadUsers, isLoading, error: authError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const demoAccounts = users.map((user) => ({
    id: user.employeeId,
    role: ROLE_LABELS[user.role],
    name: user.name,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(employeeId, password);

    if (success) {
      navigate('/dashboard');
    } else {
      setError(authError ?? 'رقم الموظف أو كلمة المرور غير صحيحة. حاول مجدداً.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/30">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">بوابة صيانة المركبات</h1>
          <p className="mt-1 text-sm text-muted-foreground">نظام إدارة طلبات الصيانة الداخلي</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          <h2 className="mb-6 text-lg font-bold text-foreground">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

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
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {(error || authError) && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error || authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !employeeId || !password}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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

        <div className="mt-4 rounded-xl border border-border bg-card/60 p-4">
          <p className="mb-3 text-center text-xs font-semibold text-muted-foreground">
            حسابات العرض التجريبي (كلمة المرور: 123456)
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {demoAccounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => {
                  setEmployeeId(account.id);
                  setPassword('123456');
                }}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">{account.id}</span>
                  <span className="text-muted-foreground">—</span>
                  <span>{account.name}</span>
                </div>
                <span className="text-[10px] text-primary">{account.role}</span>
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
