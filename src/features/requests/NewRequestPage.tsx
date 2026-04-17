import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRequestStore } from '@/store/requestStore';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormSection } from '@/components/shared/FormSection';
import {
  Priority, IssueCategory, VehicleCondition, RequestStatus, UserRole
} from '@/types';
import { PRIORITY_LABELS, ISSUE_CATEGORY_LABELS, VEHICLE_CONDITION_LABELS } from '@/utils/arabicLabels';
import { cn } from '@/lib/utils';
import {
  User, Car, Wrench, FileText, ChevronRight, ChevronLeft, Check, Send, Save
} from 'lucide-react';

const schema = z.object({
  requesterName: z.string().min(3, 'اسم مقدم الطلب مطلوب ولا يقل عن 3 أحرف'),
  employeeId: z.string().min(3, 'رقم الموظف مطلوب'),
  department: z.string().min(2, 'الجهة / الإدارة مطلوبة'),
  phone: z.string().optional(),
  vehicleNumber: z.string().min(2, 'رقم المركبة مطلوب'),
  plateNumber: z.string().min(2, 'رقم اللوحة مطلوب'),
  vehicleType: z.string().min(2, 'نوع المركبة مطلوب'),
  make: z.string().min(2, 'الماركة مطلوبة'),
  model: z.string().min(1, 'الموديل مطلوب'),
  year: z.preprocess((val) => Number(val), z.number().min(2000).max(2026)),
  color: z.string().min(2, 'اللون مطلوب'),
  currentCondition: z.enum(['operational', 'partially', 'non_operational'] as const),
  issueCategory: z.enum(['engine','brakes','electrical','tires','ac','body','suspension','transmission','oil_change','general'] as const),
  issueDescription: z.string().min(20, 'يرجى وصف المشكلة بشكل أوضح (20 حرفاً على الأقل)'),
  priority: z.enum(['urgent','high','medium','low'] as const),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 1, label: 'بيانات مقدم الطلب', icon: User },
  { id: 2, label: 'بيانات المركبة', icon: Car },
  { id: 3, label: 'تفاصيل الصيانة', icon: Wrench },
  { id: 4, label: 'المراجعة والإرسال', icon: FileText },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

function getErrorMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string') {
    return (err as { message: string }).message;
  }
  return undefined;
}

function Field({
  label, required, children, error, helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}: { label: string; required?: boolean; children: React.ReactNode; error?: any; helper?: string }) {
  const errorMsg = getErrorMessage(error);
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {helper && !errorMsg && <p className="text-xs text-muted-foreground">{helper}</p>}
      <FieldError message={errorMsg} />
    </div>
  );
}

export function NewRequestPage() {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const { currentUser } = useAuthStore();
  const { createRequest, performAction } = useRequestStore();
  const navigate = useNavigate();

  // Let zodResolver infer types to avoid RHF v7/Zod version mismatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, formState: { errors }, trigger, getValues, watch } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      requesterName: currentUser?.name ?? '',
      employeeId: currentUser?.employeeId ?? '',
      department: currentUser?.department ?? '',
      priority: 'medium',
      issueCategory: 'general',
      currentCondition: 'operational',
      year: 2022,
    },
  });

  const inputClass = 'w-full rounded-2xl border border-input bg-input-surface px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all';
  const selectClass = `${inputClass} cursor-pointer`;

  const stepFields: Record<number, (keyof FormData)[]> = {
    1: ['requesterName', 'employeeId', 'department', 'phone'],
    2: ['vehicleNumber', 'plateNumber', 'vehicleType', 'make', 'model', 'year', 'color', 'currentCondition'],
    3: ['issueCategory', 'issueDescription', 'priority', 'notes'],
    4: [],
  };

  const nextStep = async () => {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => Math.min(4, s + 1));
  };

  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const handleSaveDraft = async () => {
    setIsSaving(true);
    const data = getValues();
    const request = createRequest({
      requester: { name: data.requesterName, employeeId: data.employeeId, department: data.department, phone: data.phone },
      vehicle: { vehicleNumber: data.vehicleNumber, plateNumber: data.plateNumber, vehicleType: data.vehicleType, make: data.make, model: data.model, year: data.year, color: data.color, currentCondition: data.currentCondition },
      issueCategory: data.issueCategory,
      issueDescription: data.issueDescription,
      priority: data.priority,
      notes: data.notes,
    });
    setIsSaving(false);
    navigate(`/requests/${request.id}`);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (rawData: any) => {
    const data = rawData as FormData;
    setIsSaving(true);
    const request = createRequest({
      requester: { name: data.requesterName, employeeId: data.employeeId, department: data.department, phone: data.phone },
      vehicle: { vehicleNumber: data.vehicleNumber, plateNumber: data.plateNumber, vehicleType: data.vehicleType, make: data.make, model: data.model, year: data.year as number, color: data.color, currentCondition: data.currentCondition },
      issueCategory: data.issueCategory,
      issueDescription: data.issueDescription,
      priority: data.priority,
      notes: data.notes,
    });
    // Submit it immediately
    performAction(request.id, 'submit', currentUser!.name, UserRole.TRAFFIC_OFFICER);
    performAction(request.id, 'route_to_admin', currentUser!.name, UserRole.TRAFFIC_OFFICER);
    setIsSaving(false);
    navigate(`/requests/${request.id}`);
  };

  const values = watch();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="طلب صيانة جديد"
        description="قدّم طلب صيانة لمركبتك من خلال النموذج التالي"
        breadcrumbs={[{ label: 'الطلبات', href: '/requests' }, { label: 'طلب جديد' }]}
      />

      {/* Stepper */}
      <div className="surface-card p-4">
        <div className="flex items-center justify-between gap-0">
          {STEPS.map((s, idx) => {
            const isDone = s.id < step;
            const isCurrent = s.id === step;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-all',
                    isDone && 'border-primary bg-primary text-white',
                    isCurrent && 'border-primary bg-primary text-white shadow-[var(--shadow-float)]',
                    !isDone && !isCurrent && 'border-border bg-card text-muted-foreground'
                  )}>
                    {isDone ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                  </div>
                  <span className={cn(
                    'text-xs font-medium text-center hidden sm:block',
                    isDone && 'text-primary-dark',
                    isCurrent && 'text-primary',
                    !isDone && !isCurrent && 'text-muted-foreground'
                  )}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn('h-0.5 w-10 flex-shrink-0 mx-1', idx < step - 1 ? 'bg-primary/60' : 'bg-border')} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Step 1: Requester */}
        {step === 1 && (
          <FormSection title="بيانات مقدم الطلب" description="معلومات الموظف مقدم طلب الصيانة">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="اسم مقدم الطلب" required error={errors.requesterName?.message}>
                  <input {...register('requesterName')} className={inputClass} placeholder="الاسم الكامل" />
                </Field>
              </div>
              <Field label="رقم الموظف" required error={errors.employeeId?.message}>
                <input {...register('employeeId')} className={inputClass} placeholder="EMP-XXXX" />
              </Field>
              <Field label="الجهة / الإدارة" required error={errors.department?.message}>
                <input {...register('department')} className={inputClass} placeholder="اسم الإدارة" />
              </Field>
              <Field label="رقم الهاتف" error={errors.phone?.message} helper="اختياري">
                <input {...register('phone')} className={inputClass} placeholder="05XXXXXXXX" type="tel" />
              </Field>
            </div>
          </FormSection>
        )}

        {/* Step 2: Vehicle */}
        {step === 2 && (
          <FormSection title="بيانات المركبة" description="معلومات المركبة المراد صيانتها">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="رقم المركبة" required error={errors.vehicleNumber?.message}>
                <input {...register('vehicleNumber')} className={inputClass} placeholder="VH-XXX" />
              </Field>
              <Field label="رقم اللوحة" required error={errors.plateNumber?.message}>
                <input {...register('plateNumber')} className={inputClass} placeholder="أ ب ج 1234" />
              </Field>
              <Field label="نوع المركبة" required error={errors.vehicleType?.message}>
                <select {...register('vehicleType')} className={selectClass}>
                  <option value="">اختر النوع</option>
                  <option value="سيارة سيدان">سيارة سيدان</option>
                  <option value="سيارة رباعية الدفع">سيارة رباعية الدفع</option>
                  <option value="شاحنة خفيفة">شاحنة خفيفة</option>
                  <option value="شاحنة">شاحنة</option>
                  <option value="حافلة">حافلة</option>
                  <option value="دراجة نارية">دراجة نارية</option>
                </select>
              </Field>
              <Field label="الماركة" required error={errors.make?.message}>
                <input {...register('make')} className={inputClass} placeholder="تويوتا، نيسان، ..." />
              </Field>
              <Field label="الموديل" required error={errors.model?.message}>
                <input {...register('model')} className={inputClass} placeholder="لاند كروزر، باترول، ..." />
              </Field>
              <Field label="سنة الصنع" required error={errors.year?.message}>
                <input {...register('year')} type="number" min={2000} max={2026} className={inputClass} />
              </Field>
              <Field label="اللون" required error={errors.color?.message}>
                <input {...register('color')} className={inputClass} placeholder="أبيض، أسود، ..." />
              </Field>
              <Field label="حالة المركبة الحالية" required error={errors.currentCondition?.message}>
                <select {...register('currentCondition')} className={selectClass}>
                  {Object.values(VehicleCondition).map((v) => (
                    <option key={v} value={v}>{VEHICLE_CONDITION_LABELS[v]}</option>
                  ))}
                </select>
              </Field>
            </div>
          </FormSection>
        )}

        {/* Step 3: Issue */}
        {step === 3 && (
          <FormSection title="تفاصيل طلب الصيانة" description="وصف المشكلة والأولوية">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="فئة المشكلة" required error={errors.issueCategory?.message}>
                <select {...register('issueCategory')} className={selectClass}>
                  {Object.values(IssueCategory).map((c) => (
                    <option key={c} value={c}>{ISSUE_CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </Field>
              <Field label="درجة الأولوية" required error={errors.priority?.message}>
                <select {...register('priority')} className={selectClass}>
                  {Object.values(Priority).map((p) => (
                    <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="وصف المشكلة" required error={errors.issueDescription?.message} helper="اذكر أعراض المشكلة بالتفصيل لمساعدة مسؤول الصيانة">
                  <textarea
                    {...register('issueDescription')}
                    rows={4}
                    className={inputClass}
                    placeholder="اذكر وصفاً دقيقاً للمشكلة التي تعاني منها المركبة..."
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="ملاحظات إضافية" helper="اختياري — أي معلومات إضافية قد تساعد في معالجة الطلب">
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className={inputClass}
                    placeholder="ملاحظات إضافية..."
                  />
                </Field>
              </div>
            </div>
          </FormSection>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <FormSection title="مراجعة بيانات مقدم الطلب">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-medium text-muted-foreground">الاسم: </span><span>{values.requesterName}</span></div>
                <div><span className="font-medium text-muted-foreground">رقم الموظف: </span><span className="font-mono">{values.employeeId}</span></div>
                <div className="col-span-2"><span className="font-medium text-muted-foreground">الجهة: </span><span>{values.department}</span></div>
              </div>
            </FormSection>
            <FormSection title="مراجعة بيانات المركبة">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-medium text-muted-foreground">رقم المركبة: </span><span>{values.vehicleNumber}</span></div>
                <div><span className="font-medium text-muted-foreground">اللوحة: </span><span>{values.plateNumber}</span></div>
                <div><span className="font-medium text-muted-foreground">النوع: </span><span>{values.vehicleType}</span></div>
                <div><span className="font-medium text-muted-foreground">الماركة والموديل: </span><span>{values.make} {values.model} ({values.year})</span></div>
                <div><span className="font-medium text-muted-foreground">الحالة: </span><span>{VEHICLE_CONDITION_LABELS[(values.currentCondition ?? 'operational') as 'operational' | 'partially' | 'non_operational']}</span></div>
              </div>
            </FormSection>
            <FormSection title="مراجعة تفاصيل الصيانة">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-medium text-muted-foreground">الفئة: </span><span>{ISSUE_CATEGORY_LABELS[(values.issueCategory ?? 'general') as 'engine' | 'brakes' | 'electrical' | 'tires' | 'ac' | 'body' | 'suspension' | 'transmission' | 'oil_change' | 'general']}</span></div>
                <div><span className="font-medium text-muted-foreground">الأولوية: </span><span>{PRIORITY_LABELS[(values.priority ?? 'medium') as 'urgent' | 'high' | 'medium' | 'low']}</span></div>
                <div className="col-span-2"><span className="font-medium text-muted-foreground">وصف المشكلة: </span><span>{values.issueDescription}</span></div>
                {values.notes && <div className="col-span-2"><span className="font-medium text-muted-foreground">ملاحظات: </span><span>{values.notes}</span></div>}
              </div>
            </FormSection>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-sidebar-active transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
                السابق
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-sidebar-active transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              حفظ كمسودة
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {isSaving ? 'جارٍ الإرسال...' : 'تقديم الطلب'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
