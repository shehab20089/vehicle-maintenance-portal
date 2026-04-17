import { useEffect, useState ,useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRequestStore } from '@/store/requestStore';
import { useAuthStore } from '@/store/authStore';
import { OfficialCamundaFormViewer } from '@/components/shared/OfficialCamundaFormViewer';
import { CamundaFormRenderer } from '@/components/shared/CamundaFormRenderer';
import type { CamundaFormSchema } from '@/types/camunda';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { Timeline } from '@/components/shared/Timeline';
import { WorkflowStepper } from '@/components/shared/WorkflowStepper';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { PageHeader } from '@/components/shared/PageHeader';
import { requestApi } from '@/lib/api';
import { useLookups } from '@/lib/useLookups';
import { UserRole, type MaintenanceOutcome, type MaintenanceRequest, type RequestWorkflowContext, OutcomeType } from '@/types';
import { getAllowedTransitions } from '@/utils/workflow';
import { ROLE_LABELS, ISSUE_CATEGORY_LABELS, VEHICLE_CONDITION_LABELS, OUTCOME_TYPE_LABELS } from '@/utils/arabicLabels';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import {
  Car, User, Wrench, FileText, MessageSquare, Send, CheckCircle,
  RotateCcw, AlertCircle, Paperclip,
  Bell, Star, Package, Calendar,
  Car, User, Wrench, FileText, MessageSquare, Send, CheckCircle, XCircle,
  RotateCcw, Play, Flag, ArrowRightLeft, AlertCircle, Paperclip, ChevronLeft,
  Bell, Star, Package, Calendar, Layers,
} from 'lucide-react';
import { CamundaFormRenderer } from '@/components/shared/CamundaFormRenderer';

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function DetailTextBlock({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'warning' | 'success' }) {
  const toneClass = tone === 'warning'
    ? 'border-amber-200 bg-amber-50 text-amber-900'
    : tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : 'border-border bg-muted/40 text-foreground';

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <div className={cn('rounded-lg border p-3 text-sm leading-relaxed', toneClass)}>{value}</div>
    </div>
  );
}

function BooleanChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
      {label}
    </span>
  );
}

function getLookupLabel(
  value: string | undefined,
  ...groups: Array<Array<{ label: string; value: string }> | undefined>
) {
  if (!value) {
    return '';
  }

  for (const group of groups) {
    const match = group?.find((item) => item.value === value);
    if (match) {
      return match.label;
    }
  }

  return value;
}

function buildWorkflowDefaultValues(request: MaintenanceRequest, formId?: string) {
  const values = {
    requestId: request.id,
    requestNumber: request.requestNumber,
    requesterName: request.requester.name,
    employeeId: request.requester.employeeId,
    department: request.requester.department,
    phone: request.requester.phone ?? '',
    mobileNumber: request.mobileNumber ?? request.requester.phone ?? '',
    vehicleNumber: request.vehicle.vehicleNumber,
    plateNumber: request.vehicle.plateNumber,
    vehiclePlate: request.vehiclePlate ?? request.vehicle.plateNumber,
    vehicleType: request.vehicle.vehicleType,
    vehicleCategory: request.vehicleCategory ?? request.vehicle.vehicleType,
    make: request.vehicle.make,
    vehicleName: request.vehicleName ?? request.vehicle.make,
    model: request.vehicle.model,
    vehicleModel: request.vehicleModel ?? request.vehicle.model,
    year: request.vehicle.year,
    vehicleYear: request.vehicleYear ?? request.vehicle.year,
    color: request.vehicle.color,
    currentCondition: request.vehicle.currentCondition,
    issueCategory: request.issueCategory,
    issueDescription: request.issueDescription,
    priority: request.priority,
    notes: request.notes ?? '',
    requestedService: request.requestedService ?? '',
    region: request.region ?? '',
    batterySize: request.batterySize ?? '',
    tireSize: request.tireSize ?? '',
    tireCount: request.tireCount ?? '',
    otherServiceDescription: request.otherServiceDescription ?? '',
    requestStatus: request.requestStatus ?? request.currentStage,
    rejectionReason: request.rejectionReason ?? '',
    returnReason: request.returnReason ?? '',
    finalReturnReason: request.finalReturnReason ?? '',
    assignedOfficer: request.maintenanceExecution?.assignedOfficer ?? '',
    reassignTarget: request.maintenanceExecution?.specializedOfficer ?? '',
    vehicleEntryDate: request.vehicleEntryDate ?? '',
    maintenanceAppointmentDate: request.maintenanceAppointmentDate ?? '',
    faultDescription: request.faultDescription ?? '',
    requiredItem: request.requiredItem ?? '',
    itemQuantity: request.itemQuantity ?? '',
    itemRequestReceivedDate: request.itemRequestReceivedDate ?? '',
    itemsReceivedDate: request.itemsReceivedDate ?? '',
    warehouseKeeper: request.warehouseKeeper ?? '',
    warehouseSectionManager: request.warehouseSectionManager ?? '',
    orderNumber: request.orderNumber ?? '',
    vehicleReceiptDate: request.vehicleReceiptDate ?? '',
    vehicleReceiverName: request.vehicleReceiverName ?? '',
    washingDone: request.washingDone ?? false,
    batteryChanged: request.batteryChanged ?? false,
    oilChanged: request.oilChanged ?? false,
    tiresChanged: request.tiresChanged ?? false,
    tiresChangedCount: request.tiresChangedCount ?? '',
    otherActionDone: request.otherActionDone ?? false,
    otherActionDescription: request.otherActionDescription ?? '',
    maintenanceOutcome: request.maintenanceOutcome?.outcomeType === OutcomeType.MAINTENANCE_SCHEDULED
      ? 'notify_appointment'
      : request.maintenanceOutcome?.outcomeType === OutcomeType.SUPPLY_ITEMS_REQUESTED
        ? 'notify_spare_parts'
        : 'completed_with_report',
    scheduledDate: request.maintenanceOutcome?.scheduledDate ?? request.maintenanceExecution?.scheduledDate ?? '',
    supplyItemsRequested: request.maintenanceOutcome?.supplyItemsRequested ?? request.maintenanceExecution?.supplyItemsRequested ?? [],
    reportNotes: request.maintenanceOutcome?.reportNotes ?? '',
  };

  const transientFieldsByForm: Record<string, string[]> = {
    form_initial_review: ['action', 'notes', 'rejectionReason', 'returnReason'],
    form_supply_maint_review: ['action', 'notes', 'rejectionReason'],
    form_maintenance_mgr_review: ['action', 'assignedOfficer', 'rejectionReason'],
    form_maintenance_processing: [
      'action',
      'notes',
      'rejectionReason',
      'reassignTarget',
      'vehicleEntryDate',
      'maintenanceAppointmentDate',
      'faultDescription',
      'requiredItem',
      'itemQuantity',
      'itemRequestReceivedDate',
      'itemsReceivedDate',
      'warehouseKeeper',
      'warehouseSectionManager',
      'orderNumber',
      'vehicleReceiptDate',
      'vehicleReceiverName',
      'washingDone',
      'batteryChanged',
      'oilChanged',
      'tiresChanged',
      'tiresChangedCount',
      'otherActionDone',
      'otherActionDescription',
    ],
    form_maintenance_outcome: ['maintenanceOutcome', 'notes'],
    form_final_approval: ['action', 'notes', 'finalReturnReason'],
  };

  for (const key of transientFieldsByForm[formId ?? ''] ?? []) {
    values[key as keyof typeof values] = key.includes('Done') ? false as never : '' as never;
  }

  return values;
}

// ─── Actual Camunda Form Schema (from Camunda workflow) ────────────────────
const DEMO_CAMUNDA_SCHEMA: CamundaFormSchema = {
  executionPlatform: 'Camunda Cloud',
  executionPlatformVersion: '8.7.0',
  exporter: { name: 'Camunda Web Modeler', version: 'a0293e6' },
  schemaVersion: 18,
  id: 'Form_0nog1ps',
  components: [
    {
      id: 'Field_0aawab9',
      key: 'textarea_dm5l4',
      type: 'textarea',
      label: 'Reason',
      layout: { row: 'Row_06nmr5f', columns: null },
      validate: { required: true, minLength: '20', maxLength: '500' },
      properties: { labelEn: 'Reason', labelAr: 'السبب' },
    },
    {
      id: 'Field_0ui9ubd',
      key: 'filepicker_szirtj',
      type: 'filepicker',
      label: 'Upload File',
      layout: { row: 'Row_1ovdgab', columns: null },
      validate: { required: true },
      properties: { labelEn: 'Upload Document', labelAr: 'تحميل المستند' },
    },
  ],
  type:'default'
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  transport_approve: CheckCircle,
  transport_reject: XCircle,
  transport_return: RotateCcw,
  supply_approve: CheckCircle,
  supply_reject: XCircle,
  route_to_maintenance: ArrowRightLeft,
  maintenance_director_reject: XCircle,
  start_execution: Play,
  maintenance_reject: XCircle,
  maintenance_return: RotateCcw,
  route_to_specialized: ArrowRightLeft,
  specialized_execute: Play,
  specialized_reject: XCircle,
  specialized_return: RotateCcw,
  complete_execution: Flag,
  final_approve: Star,
  final_return: RotateCcw,
  submit: Send,
  resubmit: Send,
  close: CheckCircle,
};

const ACTION_STYLES: Record<string, string> = {
  transport_approve: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  supply_approve: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  route_to_maintenance: 'bg-blue-600 hover:bg-blue-700 text-white',
  start_execution: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  specialized_execute: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  route_to_specialized: 'bg-violet-600 hover:bg-violet-700 text-white',
  complete_execution: 'bg-teal-600 hover:bg-teal-700 text-white',
  final_approve: 'bg-amber-600 hover:bg-amber-700 text-white',
  submit: 'bg-primary hover:bg-primary/90 text-white',
  resubmit: 'bg-primary hover:bg-primary/90 text-white',
  close: 'bg-slate-600 hover:bg-slate-700 text-white',
  transport_return: 'bg-orange-500 hover:bg-orange-600 text-white',
  maintenance_return: 'bg-orange-500 hover:bg-orange-600 text-white',
  specialized_return: 'bg-orange-500 hover:bg-orange-600 text-white',
  final_return: 'bg-orange-500 hover:bg-orange-600 text-white',
  transport_reject: 'bg-red-600 hover:bg-red-700 text-white',
  supply_reject: 'bg-red-600 hover:bg-red-700 text-white',
  maintenance_director_reject: 'bg-red-600 hover:bg-red-700 text-white',
  maintenance_reject: 'bg-red-600 hover:bg-red-700 text-white',
  specialized_reject: 'bg-red-600 hover:bg-red-700 text-white',
};

type ActiveTab = 'details' | 'timeline' | 'comments' | 'documents' | 'camunda_forms';

export function RequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRequestById, performAction, addComment, loadRequests, isLoading, error: requestError } = useRequestStore();
  const { currentUser, users } = useAuthStore();
  const { lookups } = useLookups();

  const [activeTab, setActiveTab] = useState<ActiveTab>('details');
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [specializedOfficerName, setSpecializedOfficerName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [executionAttachment, setExecutionAttachment] = useState<File | null>(null);
  const [workflowContext, setWorkflowContext] = useState<RequestWorkflowContext | null>(null);
  const [workflowError, setWorkflowError] = useState('');
  const [isWorkflowLoading, setIsWorkflowLoading] = useState(false);
  const [isWorkflowSubmitting, setIsWorkflowSubmitting] = useState(false);
  const [completionModal, setCompletionModal] = useState<{ title: string; description: string } | null>(null);
  const [camundaFormType, setCamundaFormType] = useState<'official' | 'custom'>('custom');
  // Final outcome selection
  const [selectedOutcome, setSelectedOutcome] = useState<MaintenanceOutcome>({
    outcomeType: OutcomeType.MAINTENANCE_COMPLETED,
    outcomeLabel: OUTCOME_TYPE_LABELS[OutcomeType.MAINTENANCE_COMPLETED],
  });

  const request = id ? getRequestById(id) : undefined;
  const requestId = request?.id;
  const requestUpdatedAt = request?.updatedAt;
  const requestedServiceLabel = getLookupLabel(request?.requestedService, lookups.servicesTypes, lookups.requestedServices);
  const regionLabel = getLookupLabel(request?.region, lookups.regions);
  const returnReasonText = request?.status === 'returned_from_final'
    ? request.finalReturnReason || request.returnReason || ''
    : request?.returnReason || request?.finalReturnReason || '';
  const completedExecutionFlags = [
    request?.washingDone ? 'تم الغسيل' : null,
    request?.batteryChanged ? 'تم تغيير البطارية' : null,
    request?.oilChanged ? 'تم تغيير الزيت' : null,
    request?.tiresChanged ? `تم تغيير الكفرات${request?.tiresChangedCount ? ` (${request.tiresChangedCount})` : ''}` : null,
    request?.otherActionDone ? `أعمال أخرى${request?.otherActionDescription ? `: ${request.otherActionDescription}` : ''}` : null,
  ].filter((item): item is string => Boolean(item));
  const maintenanceSupplyItems = request?.maintenanceOutcome?.supplyItemsRequested
    ?? request?.maintenanceExecution?.supplyItemsRequested
    ?? [];
  const workflowMetaItems = [
    request?.workflow?.currentTaskName ? { label: 'المهمة الحالية', value: request.workflow.currentTaskName } : null,
    workflowContext?.task?.formId ? { label: 'معرف النموذج', value: workflowContext.task.formId } : null,
    request?.workflow?.processInstanceKey ? { label: 'معرف العملية', value: String(request.workflow.processInstanceKey) } : null,
    request?.workflow?.startedAt ? { label: 'بدء العملية', value: formatDate(request.workflow.startedAt) } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  useEffect(() => {
    let cancelled = false;

    async function loadWorkflowContext() {
      if (!requestId || !currentUser) {
        if (!cancelled) {
          setWorkflowContext(null);
          setWorkflowError('');
        }
        return;
      }

      setIsWorkflowLoading(true);

      try {
        const context = await requestApi.getWorkflowContext(requestId, currentUser.role);
        if (!cancelled) {
          setWorkflowContext(context);
          setWorkflowError('');
        }
      } catch (error) {
        if (!cancelled) {
          setWorkflowContext(null);
          setWorkflowError(error instanceof Error ? error.message : 'تعذر تحميل نموذج Camunda الحالي.');
        }
      } finally {
        if (!cancelled) {
          setIsWorkflowLoading(false);
        }
      }
    }

    void loadWorkflowContext();

    return () => {
      cancelled = true;
    };
  }, [currentUser, requestId, requestUpdatedAt]);

  if (!request && isLoading) {
    return <div className="py-24 text-center text-sm text-muted-foreground">جاري تحميل بيانات الطلب...</div>;
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-bold text-foreground">الطلب غير موجود</h2>
        <button onClick={() => navigate('/requests')} className="mt-4 text-sm text-primary hover:underline">العودة للقائمة</button>
      </div>
    );
  }

  const isAdminDirector = currentUser?.role === UserRole.ADMIN_DIRECTOR;
  const allowedTransitions = currentUser ? getAllowedTransitions(request.status, currentUser.role) : [];
  const hasInteractiveWorkflowForm = Boolean(
    workflowContext?.enabled
    && workflowContext.form
    && currentUser
    && workflowContext.task?.role === currentUser.role
  );
  const showLegacyActions = !hasInteractiveWorkflowForm;

  // Officers for routing dropdowns — both primary & specialized share the MAINTENANCE_OFFICER role
  const allMaintenanceOfficers = users.filter((user) => user.role === UserRole.MAINTENANCE_OFFICER);
  // For the specialized dropdown, exclude the already-assigned primary officer
  const specializedOfficerOptions = allMaintenanceOfficers.filter(
    (u) => u.name !== request.maintenanceExecution?.assignedOfficer
  );

  const handleActionConfirm = async () => {
    if (!confirmAction || !currentUser) return;
    setIsSubmitting(true);
    setActionError('');

    let additionalData: Record<string, unknown> = {};
    if (confirmAction === 'route_to_maintenance') {
      additionalData = { maintenanceExecution: { assignedOfficer: officerName || allMaintenanceOfficers[0]?.name, assignedOfficerRole: UserRole.MAINTENANCE_OFFICER } };
    }
    if (confirmAction === 'route_to_specialized') {
      additionalData = {
        maintenanceExecution: {
          ...request.maintenanceExecution,
          specializedOfficer: specializedOfficerName || specializedOfficerOptions[0]?.name,
        },
      };
    }
    if (confirmAction === 'final_return') {
      // Final return always routes back to the maintenance officer for rework
      additionalData = { pendingReturnToRole: UserRole.MAINTENANCE_OFFICER };
    }
    if (confirmAction === 'complete_execution') {
      additionalData = {
        maintenanceOutcome: selectedOutcome,
        finalDocuments: [
          ...(request.finalDocuments ?? []),
          { id: `doc-${Date.now()}`, title: selectedOutcome.outcomeLabel, type: 'final_report' as const, generatedAt: new Date().toISOString(), url: '#', linkedOutcomeType: selectedOutcome.outcomeType },
        ],
      };
    }

    const success = await performAction(
      request.id,
      confirmAction,
      currentUser.name,
      currentUser.role,
      actionNotes,
      additionalData as Partial<MaintenanceRequest>
    );
    setIsSubmitting(false);

    if (!success) {
      setActionError(requestError ?? 'تعذر تنفيذ الإجراء.');
      return;
    }

    const ACTION_SUCCESS_MESSAGES: Record<string, string> = {
      transport_approve: 'تمت الموافقة وإحالة الطلب بنجاح',
      transport_reject: 'تم رفض الطلب',
      transport_return: 'تم إرجاع الطلب للاستكمال',
      supply_approve: 'تمت الموافقة وإحالة الطلب بنجاح',
      supply_reject: 'تم رفض الطلب',
      route_to_maintenance: 'تم توجيه الطلب لمسؤول الصيانة',
      maintenance_director_reject: 'تم رفض الطلب',
      start_execution: 'تم بدء التنفيذ بنجاح',
      maintenance_reject: 'تم رفض الطلب',
      maintenance_return: 'تم إرجاع الطلب للاستكمال',
      route_to_specialized: 'تم التوجيه للمسؤول المختص',
      specialized_execute: 'تم بدء التنفيذ بنجاح',
      specialized_reject: 'تم رفض الطلب',
      specialized_return: 'تم إرجاع الطلب للاستكمال',
      complete_execution: 'تم إتمام التنفيذ وإحالة الطلب للمراجعة النهائية',
      final_approve: 'تم الاعتماد النهائي للطلب',
      final_return: 'تم إرجاع الطلب لإستكمال أعمال الصيانة',
      resubmit: 'تمت إعادة تقديم الطلب بنجاح',
      close: 'تم إغلاق الطلب بنجاح',
    };

    setSuccessMessage(ACTION_SUCCESS_MESSAGES[confirmAction] ?? 'تم تنفيذ الإجراء بنجاح');
    setTimeout(() => setSuccessMessage(''), 5000);

    setConfirmAction(null);
    setActionNotes('');
    setExecutionAttachment(null);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser) return;

    try {
      setActionError('');
      await addComment(request.id, commentText.trim(), currentUser.name, currentUser.role);
      setCommentText('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر إضافة التعليق.');
    }
  };

  const handleWorkflowSubmit = async (formData: Record<string, unknown>) => {
    if (!currentUser) {
      return;
    }

    setIsWorkflowSubmitting(true);
    setActionError('');

    try {
      await requestApi.submitWorkflowTask(request.id, {
        performedBy: currentUser.name,
        performedByRole: currentUser.role,
        variables: formData,
      });
      await loadRequests(true);
      const refreshedContext = await requestApi.getWorkflowContext(request.id, currentUser.role);
      setWorkflowContext(refreshedContext);
      setWorkflowError('');

      const submittedAction = typeof formData.action === 'string'
        ? formData.action
        : workflowContext?.task?.formId === 'form_edit_resubmit'
          ? 'resubmit'
          : workflowContext?.task?.formId === 'form_submit_request'
            ? 'submit'
            : '';

      if (submittedAction === 'return' || submittedAction === 'submit' || submittedAction === 'resubmit') {
        setCompletionModal(
          submittedAction === 'return'
            ? {
                title: 'تم إرجاع الطلب بنجاح',
                description: 'اضغط متابعة للعودة إلى الصفحة الرئيسية.',
              }
            : submittedAction === 'resubmit'
              ? {
                  title: 'تمت إعادة تقديم الطلب بنجاح',
                  description: 'اضغط متابعة للعودة إلى الصفحة الرئيسية.',
                }
              : {
                  title: 'تم تقديم الطلب بنجاح',
                  description: 'اضغط متابعة للعودة إلى الصفحة الرئيسية.',
                }
        );
      }
    } catch (error) {
      try {
        await loadRequests(true);
        const refreshedContext = await requestApi.getWorkflowContext(request.id, currentUser.role);
        setWorkflowContext(refreshedContext);
        setWorkflowError('');
      } catch (refreshError) {
        setWorkflowError(refreshError instanceof Error ? refreshError.message : 'تعذر تحديث حالة المهمة الحالية.');
      }
      setActionError(error instanceof Error ? error.message : 'تعذر إرسال نموذج Camunda.');
    } finally {
      setIsWorkflowSubmitting(false);
    }
  };

  const handleCompletionRedirect = () => {
    setCompletionModal(null);
    navigate('/dashboard', { replace: true });
  };

  // Camunda form submit handler (demo)
  const handleCamundaFormSubmit = useCallback((data: any) => {
    console.log('✅ Camunda Form Submitted:', data);
    alert('تم إرسال النموذج بنجاح!\n\n' + JSON.stringify(data, null, 2));
  }, []);

  const TABS: { id: ActiveTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'details', label: 'التفاصيل', icon: FileText },
    { id: 'timeline', label: 'سجل النشاط', icon: Wrench, count: request.timeline.length },
    { id: 'comments', label: 'التعليقات', icon: MessageSquare, count: request.comments.length },
    { id: 'documents', label: 'المستندات', icon: Paperclip, count: request.finalDocuments.length },
    { id: 'camunda_forms', label: 'نماذج Camunda', icon: Layers },
  ];

  return (
    <div className="max-w-350 space-y-5">
      <PageHeader
        title={`طلب رقم ${request.requestNumber}`}
        breadcrumbs={[{ label: 'الطلبات', href: '/requests' }, { label: request.requestNumber }]}
        actions={
          <div className="flex items-center gap-2">
            <PriorityBadge priority={request.priority} />
            <StatusBadge status={request.status} />
          </div>
        }
      />

      {/* Workflow Stepper */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card p-5 shadow-sm">
        <WorkflowStepper currentStatus={request.status} />
      </div>

      {/* Admin Director — notification-only banner */}
      {isAdminDirector && (
        <div className="flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4">
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />
          <div>
            <p className="text-sm font-semibold text-purple-800">وضع الاطلاع فقط</p>
            <p className="text-xs text-purple-600 mt-0.5">
              دورك كمدير الشؤون الإدارية هو الاطلاع على الطلبات وتلقي الإشعارات. لا تتطلب الطلبات موافقتك لتتقدم في سير العمل.
            </p>
          </div>
        </div>
      )}

      {/* Success feedback banner */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 shadow-sm">
          <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
          <p className="text-sm font-medium text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Return banner for traffic officer — only when request is in a returned state */}
      {request.pendingReturnToRole && request.status !== 'closed' && currentUser?.role === UserRole.TRAFFIC_OFFICER && (
        <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
          <div>
            <p className="text-sm font-semibold text-orange-800">الطلب معاد للاستكمال</p>
            <p className="text-xs text-orange-600 mt-0.5">
              بعد إعادة التقديم سيُرسل هذا الطلب مباشرة إلى{' '}
              <strong>{ROLE_LABELS[request.pendingReturnToRole]}</strong> الذي أعاده.
            </p>
            {returnReasonText && (
              <p className="mt-2 rounded-lg border border-orange-200 bg-white/70 px-3 py-2 text-xs leading-relaxed text-orange-900">
                <span className="font-semibold">سبب الإرجاع:</span> {returnReasonText}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tabs */}
          <div className="flex border-b border-border overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap',
                  activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {workflowContext?.enabled && (
                <div className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">تكامل Camunda 8</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {workflowContext.task
                          ? `المهمة الحالية: ${workflowContext.task.name}`
                          : 'لا توجد مهمة نشطة حالياً لهذا الطلب في Camunda.'}
                      </p>
                    </div>
                    {workflowContext.task?.role && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {ROLE_LABELS[workflowContext.task.role]}
                      </span>
                    )}
                  </div>

                  {workflowError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {workflowError}
                    </div>
                  )}

                  {isWorkflowLoading && (
                    <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                      جاري تحميل المهمة الحالية من Camunda...
                    </div>
                  )}

                  {!isWorkflowLoading && hasInteractiveWorkflowForm && workflowContext.form && (
                    <CamundaFormRenderer
                      schema={workflowContext.form.schema}
                      onSubmit={handleWorkflowSubmit}
                      isSubmitting={isWorkflowSubmitting}
                      defaultValues={workflowContext.form.variables ?? buildWorkflowDefaultValues(request, workflowContext.form.id)}
                      data={{ ...lookups, ...(workflowContext.form.variables ?? {}) }}
                    />
                  )}

                  {!isWorkflowLoading && workflowContext.task && !hasInteractiveWorkflowForm && currentUser && (
                    <div className="rounded-lg border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                      هذه المهمة مخصصة حالياً إلى {ROLE_LABELS[workflowContext.task.role]}.
                    </div>
                  )}

                  {isWorkflowSubmitting && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                      جاري إرسال النموذج إلى Camunda...
                    </div>
                  )}
                </div>
              )}

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'تاريخ الإنشاء', value: formatDate(request.createdAt) },
                  { label: 'آخر تحديث', value: formatDate(request.updatedAt) },
                  { label: 'المرحلة الحالية', value: request.currentStage },
                  { label: 'المسؤول الحالي', value: request.currentOwnerName || 'غير محدد' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-muted/50 px-3 py-2.5">
                    <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Requester Card */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100"><User className="h-4 w-4 text-blue-600" /></div>
                  <h3 className="text-sm font-semibold text-foreground">بيانات مقدم الطلب</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">الاسم: </span><span className="font-medium">{request.requester.name}</span></div>
                  <div><span className="text-muted-foreground">الرقم الوظيفي: </span><span className="font-mono font-medium">{request.requester.employeeId}</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">الجهة: </span><span className="font-medium">{request.requester.department}</span></div>
                  {request.requester.phone && <div><span className="text-muted-foreground">الهاتف: </span><span>{request.requester.phone}</span></div>}
                </div>
              </div>

              {/* Vehicle Card */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100"><Car className="h-4 w-4 text-teal-600" /></div>
                  <h3 className="text-sm font-semibold text-foreground">بيانات المركبة</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">رقم المركبة: </span><span className="font-mono font-bold text-primary">{request.vehicle.vehicleNumber}</span></div>
                  <div><span className="text-muted-foreground">رقم اللوحة: </span><span className="font-medium">{request.vehicle.plateNumber}</span></div>
                  <div><span className="text-muted-foreground">النوع: </span><span>{request.vehicle.vehicleType}</span></div>
                  <div><span className="text-muted-foreground">الماركة: </span><span>{request.vehicle.make} {request.vehicle.model}</span></div>
                  <div><span className="text-muted-foreground">سنة الصنع: </span><span>{request.vehicle.year}</span></div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">الحالة: </span>
                    <span className={cn('font-semibold', request.vehicle.currentCondition === 'non_operational' ? 'text-red-600' : request.vehicle.currentCondition === 'partially' ? 'text-amber-600' : 'text-emerald-600')}>
                      {VEHICLE_CONDITION_LABELS[request.vehicle.currentCondition]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Issue Card */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100"><Wrench className="h-4 w-4 text-orange-600" /></div>
                  <h3 className="text-sm font-semibold text-foreground">تفاصيل المشكلة</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div><span className="text-muted-foreground">فئة المشكلة: </span><span className="font-semibold">{ISSUE_CATEGORY_LABELS[request.issueCategory]}</span></div>
                  {request.requestedService && (
                    <div><span className="text-muted-foreground">الخدمة المطلوبة: </span><span className="font-semibold">{requestedServiceLabel}</span></div>
                  )}
                  {request.region && (
                    <div><span className="text-muted-foreground">المنطقة / الفرع: </span><span className="font-semibold">{regionLabel}</span></div>
                  )}
                  {request.notes && (
                    <div>
                      <p className="text-muted-foreground mb-1">ملاحظات:</p>
                      <p className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-800 leading-relaxed">{request.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Request Specifics */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100"><FileText className="h-4 w-4 text-violet-600" /></div>
                  <h3 className="text-sm font-semibold text-foreground">بيانات الخدمة والملاحظات</h3>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {requestedServiceLabel && <DetailPill label="الخدمة المطلوبة" value={requestedServiceLabel} />}
                  {regionLabel && <DetailPill label="المنطقة / الفرع" value={regionLabel} />}
                  {request.batterySize && <DetailPill label="مقاس البطارية" value={request.batterySize} />}
                  {request.tireSize && <DetailPill label="مقاس الكفر" value={request.tireSize} />}
                  {request.tireCount && <DetailPill label="عدد الكفرات المطلوبة" value={request.tireCount} />}
                </div>

                <div className="mt-4 space-y-3">
                  {request.otherServiceDescription && (
                    <DetailTextBlock label="وصف الخدمة الأخرى" value={request.otherServiceDescription} />
                  )}
                  {request.notes && (
                    <DetailTextBlock label="ملاحظات مقدم الطلب" value={request.notes} tone="warning" />
                  )}
                  {request.rejectionReason && (
                    <DetailTextBlock label="سبب الرفض" value={request.rejectionReason} tone="warning" />
                  )}
                  {returnReasonText && (
                    <DetailTextBlock label="سبب الإرجاع" value={returnReasonText} tone="warning" />
                  )}
                  {request.finalNotes && (
                    <DetailTextBlock label="الملاحظات النهائية" value={request.finalNotes} tone="success" />
                  )}
                </div>
              </div>

              {/* Maintenance Execution */}
              {request.maintenanceExecution && (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground mb-4">تفاصيل التنفيذ</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                    <DetailPill label="مسؤول الصيانة" value={request.maintenanceExecution.assignedOfficer} />
                    {request.maintenanceExecution.specializedOfficer && (
                      <DetailPill label="المسؤول المختص" value={request.maintenanceExecution.specializedOfficer} />
                    )}
                    {request.maintenanceExecution.startDate && <DetailPill label="تاريخ البدء" value={formatDate(request.maintenanceExecution.startDate)} />}
                    {request.maintenanceExecution.actualCompletion && <DetailPill label="تاريخ الانتهاء" value={formatDate(request.maintenanceExecution.actualCompletion)} />}
                    {request.vehicleEntryDate && <DetailPill label="دخول المركبة للصيانة" value={formatDate(request.vehicleEntryDate)} />}
                    {request.maintenanceAppointmentDate && <DetailPill label="موعد الصيانة" value={formatDate(request.maintenanceAppointmentDate)} />}
                    {request.requiredItem && <DetailPill label="الصنف المطلوب" value={request.requiredItem} />}
                    {request.itemQuantity && <DetailPill label="الكمية لكل صنف" value={request.itemQuantity} />}
                    {request.itemRequestReceivedDate && <DetailPill label="استلام طلب الأصناف" value={formatDate(request.itemRequestReceivedDate)} />}
                    {request.itemsReceivedDate && <DetailPill label="استلام الأصناف" value={formatDate(request.itemsReceivedDate)} />}
                    {request.warehouseKeeper && <DetailPill label="أمين المستودع" value={request.warehouseKeeper} />}
                    {request.warehouseSectionManager && <DetailPill label="مدير شعبة المستودعات" value={request.warehouseSectionManager} />}
                    {request.orderNumber && <DetailPill label="رقم الأمر" value={request.orderNumber} />}
                    {request.vehicleReceiptDate && <DetailPill label="تاريخ استلام المركبة" value={formatDate(request.vehicleReceiptDate)} />}
                    {request.vehicleReceiverName && <DetailPill label="اسم مستلم المركبة" value={request.vehicleReceiverName} />}
                    {request.maintenanceExecution.workDescription && (
                      <div className="col-span-2">
                        <DetailTextBlock label="وصف الأعمال" value={request.maintenanceExecution.workDescription} />
                      </div>
                    )}
                    {completedExecutionFlags.length > 0 && (
                      <div className="col-span-2">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">الأعمال المنفذة</p>
                        <div className="flex flex-wrap gap-2">
                          {completedExecutionFlags.map((item) => <BooleanChip key={item} label={item} />)}
                        </div>
                      </div>
                    )}
                    {request.maintenanceExecution.partsUsed && request.maintenanceExecution.partsUsed.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground mb-1.5">قطع الغيار:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {request.maintenanceExecution.partsUsed.map((part, i) => (
                            <span key={i} className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs text-blue-700">{part}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {maintenanceSupplyItems.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground mb-1.5">الأصناف / قطع الغيار المطلوبة:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {maintenanceSupplyItems.map((item, i) => (
                            <span key={`${item}-${i}`} className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs text-amber-800">{item}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {request.maintenanceExecution.checklist && request.maintenanceExecution.checklist.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-foreground mb-2">قائمة مهام التنفيذ:</p>
                      <div className="space-y-2">
                        {request.maintenanceExecution.checklist.map((item) => (
                          <div key={item.id} className="flex items-center gap-2.5">
                            <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', item.completed ? 'border-emerald-500 bg-emerald-500' : 'border-border')}>
                              {item.completed && <CheckCircle className="h-3 w-3 text-white" />}
                            </div>
                            <span className={cn('text-sm', item.completed ? 'line-through text-muted-foreground' : 'text-foreground')}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Maintenance Outcome (if present) */}
              {request.maintenanceOutcome && (
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-5 w-5 text-teal-600" />
                    <h3 className="text-sm font-semibold text-teal-800">نتيجة الصيانة</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-teal-600">نوع النتيجة: </span><span className="font-semibold text-teal-800">{request.maintenanceOutcome.outcomeLabel}</span></div>
                    {request.maintenanceOutcome.reportNotes && <div><span className="text-teal-600">ملاحظات: </span><span className="text-teal-800">{request.maintenanceOutcome.reportNotes}</span></div>}
                    {request.maintenanceOutcome.scheduledDate && (
                      <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-teal-600" /><span className="text-teal-800">موعد الصيانة: {formatDate(request.maintenanceOutcome.scheduledDate)}</span></div>
                    )}
                    {request.maintenanceOutcome.supplyItemsRequested && request.maintenanceOutcome.supplyItemsRequested.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1"><Package className="h-3.5 w-3.5 text-teal-600" /><span className="text-teal-600">الأصناف المطلوبة:</span></div>
                        <div className="flex flex-wrap gap-1.5">
                          {request.maintenanceOutcome.supplyItemsRequested.map((item, i) => (
                            <span key={i} className="rounded-full bg-teal-100 border border-teal-200 px-2.5 py-1 text-xs text-teal-800">{item}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {request.finalDocuments.length > 0 && (
                      <div className="rounded-lg border border-teal-200 bg-white/70 px-3 py-2 text-teal-900">
                        <span className="text-teal-600">عدد المستندات المرتبطة: </span>
                        <span className="font-semibold">{request.finalDocuments.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Workflow Meta */}
              {(workflowMetaItems.length > 0 || workflowContext?.timeline?.length) && (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100"><Wrench className="h-4 w-4 text-sky-600" /></div>
                    <h3 className="text-sm font-semibold text-foreground">بيانات سير العمل</h3>
                  </div>
                  {workflowMetaItems.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {workflowMetaItems.map((item) => <DetailPill key={item.label} label={item.label} value={item.value} />)}
                    </div>
                  )}
                  {workflowContext?.timeline && workflowContext.timeline.length > 0 && (
                    <div className="mt-4 rounded-lg border border-border/70 bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">عدد مراحل Camunda المتاحة</p>
                      <p className="text-sm font-semibold text-foreground">{workflowContext.timeline.length}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Attachments */}
              {request.attachments.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground mb-3">المرفقات ({request.attachments.length})</h3>
                  <div className="space-y-2">
                    {request.attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                        <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{att.name}</p>
                          <p className="text-xs text-muted-foreground">{att.uploadedBy} · {formatDate(att.uploadedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">سجل النشاط والمراحل</h3>
              <Timeline entries={request.timeline} />
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-foreground">التعليقات والملاحظات</h3>
              <div className="space-y-2">
                {actionError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {actionError}
                  </div>
                )}
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="أضف تعليقاً أو ملاحظة..."
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    إضافة تعليق
                  </button>
                </div>
              </div>
              {request.comments.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">لا توجد تعليقات بعد</p>
              ) : (
                <div className="divide-y divide-border">
                  {[...request.comments].reverse().map((c) => (
                    <div key={c.id} className="py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{c.author[0]}</div>
                          <div>
                            <span className="text-sm font-semibold">{c.author}</span>
                            <span className="mr-1.5 text-xs text-muted-foreground">— {ROLE_LABELS[c.authorRole]}</span>
                          </div>
                        </div>
                        <time className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</time>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed pr-9">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">المستندات والتقارير النهائية</h3>
              {request.finalDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">لا توجد مستندات بعد. ستظهر هنا بعد اكتمال الصيانة.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {request.finalDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-border p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(doc.generatedAt)}</p>
                      </div>
                      <button className="text-xs text-primary hover:underline font-medium">تحميل</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Camunda Forms Demo Tab */}
          {activeTab === 'camunda_forms' && (
            <div className="space-y-5">
              {/* Info banner */}
              <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <Layers className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">عرض توضيحي — نماذج Camunda الديناميكية</p>
                  <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                    يوجد أسلوبان لعرض نماذج Camunda في النظام. استخدم المفتاح أدناه للتبديل بينهما:
                  </p>
                  <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                    <li><strong>المعالج المخصص (CamundaFormRenderer)</strong> — مبني بـ React + React Hook Form، يدعم RTL بالكامل مع تحكم كامل بالتصميم.</li>
                    <li><strong>العارض الرسمي (OfficialCamundaFormViewer)</strong> — يستخدم مكتبة <code className="bg-blue-100 px-1 rounded">@bpmn-io/form-js</code> الرسمية من Camunda مباشرة.</li>
                  </ul>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">طريقة العرض:</span>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    <button
                      onClick={() => setCamundaFormType('custom')}
                      className={cn(
                        'px-4 py-2 text-xs font-semibold transition-all',
                        camundaFormType === 'custom'
                          ? 'bg-primary text-white'
                          : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      المعالج المخصص (React)
                    </button>
                    <button
                      onClick={() => setCamundaFormType('official')}
                      className={cn(
                        'px-4 py-2 text-xs font-semibold transition-all',
                        camundaFormType === 'official'
                          ? 'bg-primary text-white'
                          : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      العارض الرسمي (@bpmn-io/form-js)
                    </button>
                  </div>
                </div>
              </div>

              {/* Render the selected form type */}
              {camundaFormType === 'custom' ? (
                <CamundaFormRenderer
                  schema={DEMO_CAMUNDA_SCHEMA}
                  onSubmit={handleCamundaFormSubmit}
                  isSubmitting={false}
                />
              ) : (
                <OfficialCamundaFormViewer
                  schema={DEMO_CAMUNDA_SCHEMA}
                  onSubmit={handleCamundaFormSubmit}
                />
              )}

              {/* Schema preview */}
              <details className="rounded-xl border border-border bg-card shadow-sm">
                <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors rounded-xl">
                  عرض مخطط النموذج (JSON Schema)
                </summary>
                <pre
                  dir="ltr"
                  className="p-5 text-xs font-mono text-muted-foreground overflow-x-auto border-t border-border bg-muted/20 rounded-b-xl max-h-[400px]"
                >
                  {JSON.stringify(DEMO_CAMUNDA_SCHEMA, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* Action Sidebar */}
        <div className="space-y-4">
          {/* Status Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-foreground">معلومات الطلب</h3>
            <div className="space-y-2">
              {[
                { label: 'الحالة', node: <StatusBadge status={request.status} size="sm" /> },
                { label: 'الأولوية', node: <PriorityBadge priority={request.priority} size="sm" /> },
                { label: 'المرحلة', node: <span className="text-xs font-medium">{request.currentStage}</span> },
                { label: 'المسؤول', node: <span className="text-xs font-medium">{request.currentOwnerName || '—'}</span> },
                { label: 'الدور', node: <span className="text-xs font-medium">{ROLE_LABELS[request.currentOwnerRole]}</span> },
              ].map(({ label, node }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  {node}
                </div>
              ))}
            </div>
          </div>

          {/* Actions Card
          {showLegacyActions && allowedTransitions.length > 0 && !isAdminDirector && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-foreground">الإجراءات المتاحة</h3>
              <p className="text-xs text-muted-foreground">
                بصفتك <strong>{currentUser ? ROLE_LABELS[currentUser.role] : ''}</strong>، يمكنك تنفيذ:
              </p>
              <div className="space-y-2">
                {allowedTransitions.map((transition) => {
                  const Icon = ACTION_ICONS[transition.action] ?? ChevronLeft;
                  const style = ACTION_STYLES[transition.action] ?? 'bg-primary hover:bg-primary/90 text-white';
                  return (
                    <button
                      key={transition.action}
                      onClick={() => { setConfirmAction(transition.action); setActionNotes(''); }}
                      className={cn('flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all shadow-sm', style)}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {transition.actionLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          )} */}

          {/* No actions */}
          {showLegacyActions && allowedTransitions.length === 0 && currentUser && !isAdminDirector && (
            <div className="rounded-xl border border-border bg-muted/30 p-5 text-center">
              <p className="text-xs text-muted-foreground">
                لا توجد إجراءات متاحة لك في هذه المرحلة بصفتك {ROLE_LABELS[currentUser.role]}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleActionConfirm}
          title={allowedTransitions.find((t) => t.action === confirmAction)?.actionLabel ?? 'تأكيد الإجراء'}
          description="تأكيد تنفيذ هذا الإجراء على الطلب. لا يمكن التراجع بعد التأكيد."
          confirmLabel="تأكيد التنفيذ"
          isLoading={isSubmitting}
          variant={
            confirmAction.includes('reject') ? 'danger'
              : confirmAction.includes('return') ? 'warning'
              : 'primary'
          }
        >
          {/* Attachment upload for execution start */}
          {(confirmAction === 'start_execution' || confirmAction === 'specialized_execute') && (
            <div className="mb-2 space-y-1.5">
              <label className="block text-xs font-medium text-foreground">مرفق التنفيذ (اختياري)</label>
              {!executionAttachment ? (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-input rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex flex-col items-center gap-1">
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">اضغط لرفع ملف</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) setExecutionAttachment(e.target.files[0]); }}
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-border p-2.5">
                  <span className="text-xs font-medium text-foreground truncate">{executionAttachment.name}</span>
                  <button type="button" onClick={() => setExecutionAttachment(null)} className="mr-2 text-xs text-red-500 hover:text-red-700 shrink-0">إزالة</button>
                </div>
              )}
            </div>
          )}

          {/* Route to maintenance officer */}
          {confirmAction === 'route_to_maintenance' && (
            <div className="mb-2 space-y-1.5">
              <label className="block text-xs font-medium text-foreground">اختر مسؤول الصيانة *</label>
              <select
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {allMaintenanceOfficers.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            </div>
          )}

          {/* Route to specialized officer */}
          {confirmAction === 'route_to_specialized' && (
            <div className="mb-2 space-y-1.5">
              <label className="block text-xs font-medium text-foreground">اختر مسؤول الصيانة المختص *</label>
              <select
                value={specializedOfficerName}
                onChange={(e) => setSpecializedOfficerName(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {specializedOfficerOptions.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">بعد التوجيه ستنتقل مسؤولية التنفيذ إلى المسؤول المختص.</p>
            </div>
          )}

          {/* Final outcome selection */}
          {confirmAction === 'complete_execution' && (
            <div className="mb-2 space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground">نتيجة الصيانة *</label>
                <select
                  value={selectedOutcome.outcomeType}
                  onChange={(e) => {
                    const type = e.target.value as typeof selectedOutcome.outcomeType;
                    setSelectedOutcome({ outcomeType: type, outcomeLabel: OUTCOME_TYPE_LABELS[type] });
                  }}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.entries(OUTCOME_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              {selectedOutcome.outcomeType === 'maintenance_scheduled' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-foreground">موعد الصيانة</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    onChange={(e) => setSelectedOutcome(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>
              )}
              {selectedOutcome.outcomeType === 'supply_items_requested' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-foreground">الأصناف المطلوبة (افصل بفواصل)</label>
                  <input
                    type="text"
                    placeholder="مثال: مضخة وقود، فلتر زيت"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    onChange={(e) => setSelectedOutcome(prev => ({ ...prev, supplyItemsRequested: e.target.value.split('،').map(s => s.trim()).filter(Boolean) }))}
                  />
                </div>
              )}
            </div>
          )}
          {actionError && (
            <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {actionError}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground">
              {confirmAction.includes('reject') || confirmAction.includes('return') ? 'سبب الإجراء *' : 'ملاحظات (اختياري)'}
            </label>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="أضف ملاحظاتك هنا..."
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </ConfirmationModal>
      )}

      {completionModal && (
        <ConfirmationModal
          isOpen={true}
          onClose={handleCompletionRedirect}
          onConfirm={handleCompletionRedirect}
          title={completionModal.title}
          description={completionModal.description}
          confirmLabel="متابعة"
          variant="success"
          hideCancel={true}
          dismissible={false}
        />
      )}
    </div>
  );
}
