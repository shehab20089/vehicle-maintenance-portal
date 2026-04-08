import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequestStore } from '@/store/requestStore';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { CamundaFormRenderer } from '@/components/shared/CamundaFormRenderer';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { requestApi } from '@/lib/api';
import { useLookups } from '@/lib/useLookups';
import { IssueCategory, Priority, UserRole, VehicleCondition } from '@/types';
import type { CamundaFormSchema } from '@/types/camunda';
import {
  AlertCircle,
} from 'lucide-react';

export function NewRequestPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formSchema, setFormSchema] = useState<CamundaFormSchema | null>(null);
  const [formVariables, setFormVariables] = useState<Record<string, unknown>>({});
  const [isFormLoading, setIsFormLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const { currentUser } = useAuthStore();
  const { createRequest, performAction } = useRequestStore();
  const { lookups } = useLookups();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadStartForm() {
      setIsFormLoading(true);
      setSubmitError('');

      try {
        const context = await requestApi.getStartForm();
        if (!cancelled) {
          setFormSchema(context.form.schema);
          setFormVariables(context.form.variables ?? {});
        }
      } catch (error) {
        if (!cancelled) {
          setSubmitError(error instanceof Error ? error.message : 'تعذر تحميل نموذج الطلب.');
        }
      } finally {
        if (!cancelled) {
          setIsFormLoading(false);
        }
      }
    }

    void loadStartForm();

    return () => {
      cancelled = true;
    };
  }, []);

  const defaultValues = useMemo(() => ({
    requesterName: currentUser?.name ?? '',
    employeeId: currentUser?.employeeId ?? '',
    department: currentUser?.department ?? '',
    phone: '',
    mobileNumber: '',
    priority: 'medium',
    issueCategory: 'general',
    currentCondition: 'operational',
    vehicleYear: 2022,
    year: 2022,
  }), [currentUser]);

  const onSubmit = async (formData: Record<string, unknown>) => {
    setIsSaving(true);
    setSubmitError('');

    try {
      const mobileNumber = String(formData.mobileNumber ?? formData.phone ?? '');
      const vehiclePlate = String(formData.vehiclePlate ?? formData.plateNumber ?? '');
      const vehicleCategory = String(formData.vehicleCategory ?? formData.vehicleType ?? '');
      const vehicleName = String(formData.vehicleName ?? formData.make ?? '');
      const vehicleModel = String(formData.vehicleModel ?? formData.model ?? '');
      const vehicleYear = Number(formData.vehicleYear ?? formData.year ?? 2022);

      const request = await createRequest({
        requester: {
          name: String(formData.requesterName ?? ''),
          employeeId: String(formData.employeeId ?? ''),
          department: String(formData.department ?? ''),
          phone: mobileNumber,
        },
        vehicle: {
          vehicleNumber: String(formData.vehicleNumber ?? vehiclePlate),
          plateNumber: vehiclePlate,
          vehicleType: vehicleCategory,
          make: vehicleName,
          model: vehicleModel,
          year: vehicleYear,
          color: String(formData.color ?? formData.vehicleColor ?? ''),
          currentCondition: String(formData.currentCondition ?? 'operational') as VehicleCondition,
        },
        issueCategory: String(formData.issueCategory ?? 'general') as IssueCategory,
        issueDescription: String(formData.issueDescription ?? ''),
        priority: String(formData.priority ?? 'medium') as Priority,
        notes: String(formData.notes ?? ''),
        mobileNumber,
        vehiclePlate,
        vehicleCategory,
        vehicleName,
        vehicleModel,
        vehicleYear,
        requestedService: String(formData.requestedService ?? ''),
        region: String(formData.region ?? ''),
        batterySize: String(formData.batterySize ?? ''),
        tireSize: String(formData.tireSize ?? ''),
        tireCount: String(formData.tireCount ?? ''),
        otherServiceDescription: String(formData.otherServiceDescription ?? ''),
      });

      const submitted = await performAction(request.id, 'submit', currentUser?.name ?? '', UserRole.TRAFFIC_OFFICER);
      if (!submitted) {
        throw new Error('تعذر تقديم الطلب.');
      }

      setShowCompletionModal(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'تعذر إرسال الطلب.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompletionRedirect = () => {
    setShowCompletionModal(false);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="طلب صيانة جديد"
        description="قدّم طلب الصيانة من خلال نموذج Camunda الديناميكي في صفحة واحدة"
        breadcrumbs={[{ label: 'الطلبات', href: '/requests' }, { label: 'طلب جديد' }]}
      />

      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {isFormLoading && (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground shadow-sm">
          جاري تحميل نموذج Camunda...
        </div>
      )}

      {!isFormLoading && !formSchema && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-12 text-center text-sm text-amber-800 shadow-sm">
          <AlertCircle className="mx-auto mb-3 h-8 w-8" />
          تعذر تحميل نموذج الطلب الديناميكي.
        </div>
      )}

      {!isFormLoading && formSchema && (
        <CamundaFormRenderer
          schema={formSchema}
          defaultValues={defaultValues}
          isSubmitting={isSaving}
          onSubmit={onSubmit}
          data={{ ...lookups, ...formVariables }}
        />
      )}

      <ConfirmationModal
        isOpen={showCompletionModal}
        onClose={handleCompletionRedirect}
        onConfirm={handleCompletionRedirect}
        title="تم تقديم الطلب بنجاح"
        description="اضغط متابعة للعودة إلى الصفحة الرئيسية."
        confirmLabel="متابعة"
        variant="success"
        hideCancel={true}
        dismissible={false}
      />
    </div>
  );
}
