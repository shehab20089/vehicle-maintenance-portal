import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRequestStore } from '@/store/requestStore';
import { useAuthStore } from '@/store/authStore';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { Timeline } from '@/components/shared/Timeline';
import { WorkflowStepper } from '@/components/shared/WorkflowStepper';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { PageHeader } from '@/components/shared/PageHeader';
import { CamundaFormRenderer } from '@/components/shared/CamundaFormRenderer';
import { OfficialCamundaFormViewer } from '@/components/shared/OfficialCamundaFormViewer';
import type { CamundaFormSchema } from '@/types/camunda';
import { UserRole, RequestStatus } from '@/types';
import { getAllowedTransitions } from '@/utils/workflow';
import { ROLE_LABELS, ISSUE_CATEGORY_LABELS, VEHICLE_CONDITION_LABELS } from '@/utils/arabicLabels';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import {
  Car, User, Wrench, FileText, MessageSquare, Send, CheckCircle, XCircle,
  RotateCcw, Play, Flag, ArrowRightLeft, AlertCircle, Paperclip, ChevronLeft
} from 'lucide-react';

const ACTION_ICONS: Record<string, React.ElementType> = {
  admin_approve: CheckCircle,
  admin_return: RotateCcw,
  admin_reject: XCircle,
  transport_approve: CheckCircle,
  transport_reject: XCircle,
  route_to_maintenance: ArrowRightLeft,
  routing_reject: XCircle,
  start_execution: Play,
  maintenance_return: RotateCcw,
  maintenance_reject: XCircle,
  complete_execution: Flag,
  final_completed: CheckCircle,
  final_follow_up: RotateCcw,
  final_could_not_complete: XCircle,
  submit: Send,
  resubmit: Send,
  close: CheckCircle,
  resume_execution: Play,
};

const ACTION_STYLES: Record<string, string> = {
  admin_approve: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  transport_approve: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  route_to_maintenance: 'bg-blue-600 hover:bg-blue-700 text-white',
  start_execution: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  complete_execution: 'bg-teal-600 hover:bg-teal-700 text-white',
  final_completed: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  submit: 'bg-primary hover:bg-primary/90 text-white',
  resubmit: 'bg-primary hover:bg-primary/90 text-white',
  close: 'bg-slate-600 hover:bg-slate-700 text-white',
  resume_execution: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  admin_return: 'bg-orange-500 hover:bg-orange-600 text-white',
  maintenance_return: 'bg-orange-500 hover:bg-orange-600 text-white',
  final_follow_up: 'bg-amber-500 hover:bg-amber-600 text-white',
  admin_reject: 'bg-red-600 hover:bg-red-700 text-white',
  transport_reject: 'bg-red-600 hover:bg-red-700 text-white',
  routing_reject: 'bg-red-600 hover:bg-red-700 text-white',
  maintenance_reject: 'bg-red-600 hover:bg-red-700 text-white',
  final_could_not_complete: 'bg-red-600 hover:bg-red-700 text-white',
};

type ActiveTab = 'details' | 'timeline' | 'comments' | 'documents';

const sampleCamundaSchema: CamundaFormSchema & { type: string } = {
  "executionPlatform": "Camunda Cloud",
  "executionPlatformVersion": "8.7.0",
  "exporter": {
    "name": "Camunda Web Modeler",
    "version": "a0293e6"
  },
  "schemaVersion": 18,
  "id": "Form_0nog1ps",
  "components": [
    {
      "label": "Reason",
      "type": "textarea",
      "layout": {
        "row": "Row_06nmr5f",
        "columns": null
      },
      "id": "Field_0aawab9",
      "key": "textarea_dm5l4",
      "validate": {
        "required": true,
        "minLength": 20,
        "maxLength": 500
      },
      "properties": {
        "labelEn": "Reason",
        "labelAr": "السبب"
      }
    },
    {
      "label": "Upload File",
      "type": "filepicker",
      "layout": {
        "row": "Row_1ovdgab",
        "columns": null
      },
      "id": "Field_0ui9ubd",
      "key": "filepicker_szirtj",
      "accept": ".png, .jpg, .jpeg, .pdf, .doc, .docx",
      "validate": {
        "required": true
      },
      "properties": {
        "labelEn": "Upload Document",
        "labelAr": "تحميل المستند"
      }
    }
  ],
  "type": "default"
};

export function RequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRequestById, performAction, addComment } = useRequestStore();
  const { currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('details');
  const [useOfficialForm, setUseOfficialForm] = useState(true);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [officerName, setOfficerName] = useState('فيصل بن علي الزهراني');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const request = id ? getRequestById(id) : undefined;

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-bold text-foreground">الطلب غير موجود</h2>
        <button onClick={() => navigate('/requests')} className="mt-4 text-sm text-primary hover:underline">
          العودة للقائمة
        </button>
      </div>
    );
  }

  const isRejectedStatus =
    request.status === 'rejected_by_admin' ||
    request.status === 'rejected_by_transport_maintenance' ||
    request.status === 'rejected_by_routing' ||
    request.status === 'rejected_by_maintenance' ||
    request.status === 'could_not_complete';

  const allowedTransitions = currentUser
    ? getAllowedTransitions(request.status, currentUser.role)
    : [];

  const handleActionConfirm = async () => {
    if (!confirmAction || !currentUser) return;
    setIsSubmitting(true);
    const additionalData = confirmAction === 'route_to_maintenance'
      ? { maintenanceExecution: { assignedOfficer: officerName } }
      : {};
    await new Promise((r) => setTimeout(r, 500));
    performAction(request.id, confirmAction, currentUser.name, currentUser.role, actionNotes, additionalData);
    setIsSubmitting(false);
    setConfirmAction(null);
    setActionNotes('');
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !currentUser) return;
    addComment(request.id, commentText.trim(), currentUser.name, currentUser.role);
    setCommentText('');
  };

  const TABS: { id: ActiveTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'details', label: 'التفاصيل', icon: FileText },
    { id: 'timeline', label: 'سجل النشاط', icon: Wrench, count: request.timeline.length },
    { id: 'comments', label: 'التعليقات', icon: MessageSquare, count: request.comments.length },
    { id: 'documents', label: 'المستندات', icon: Paperclip, count: request.finalDocuments.length },
  ];

  return (
    <div className="max-w-[1400px] space-y-5">
      {/* Header */}
      <PageHeader
        title={`طلب رقم ${request.requestNumber}`}
        breadcrumbs={[
          { label: 'الطلبات', href: '/requests' },
          { label: request.requestNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <PriorityBadge priority={request.priority} />
            <StatusBadge status={request.status} />
          </div>
        }
      />

      {/* Workflow Stepper */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card p-5 shadow-sm">
        <WorkflowStepper currentStatus={request.status} isRejected={isRejectedStatus} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
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
              {/* Form Toggle */}
              <div className="flex justify-end p-2 mb-2 bg-muted/50 rounded-lg">
                <label className="flex items-center cursor-pointer gap-2">
                  <span className="text-sm text-muted-foreground mr-2">استخدام النموذج الرسمي (form-js)</span>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="toggle" checked={useOfficialForm} onChange={(e) => setUseOfficialForm(e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-muted-foreground transition-transform checked:transform checked:translate-x-full checked:border-primary" style={{transform: useOfficialForm ? 'translateX(-100%)' : 'translateX(0)'}} />
                    <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-5 rounded-full bg-muted-foreground cursor-pointer ${useOfficialForm ? 'bg-primary' : ''}`}></label>
                  </div>
                </label>
              </div>

              {/* Dynamic Task Form (Camunda Integration) */}
              {useOfficialForm ? (
                <OfficialCamundaFormViewer
                  schema={sampleCamundaSchema}
                  onSubmit={(data) => {
                    console.log("Official form submitted:", data);
                    alert("تم حفظ النموذج الرسمي بنجاح!");
                  }}
                />
              ) : (
                <CamundaFormRenderer
                  schema={sampleCamundaSchema}
                  onSubmit={(data) => {
                    console.log("Camunda Form Submitted:", data);
                    alert("تم حفظ النموذج المخصص بنجاح!");
                  }}
                />
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
                  <div><span className="text-muted-foreground">اللون: </span><span>{request.vehicle.color}</span></div>
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
                  <div>
                    <p className="text-muted-foreground mb-1">وصف المشكلة:</p>
                    <p className="rounded-lg bg-muted/50 p-3 leading-relaxed">{request.issueDescription}</p>
                  </div>
                  {request.notes && (
                    <div>
                      <p className="text-muted-foreground mb-1">ملاحظات:</p>
                      <p className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-800 leading-relaxed">{request.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Maintenance Execution */}
              {request.maintenanceExecution && (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground mb-4">تفاصيل التنفيذ</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">مسؤول الصيانة: </span><span className="font-medium">{request.maintenanceExecution.assignedOfficer}</span></div>
                    {request.maintenanceExecution.startDate && <div><span className="text-muted-foreground">تاريخ البدء: </span><span>{formatDate(request.maintenanceExecution.startDate)}</span></div>}
                    {request.maintenanceExecution.actualCompletion && <div><span className="text-muted-foreground">تاريخ الانتهاء: </span><span>{formatDate(request.maintenanceExecution.actualCompletion)}</span></div>}
                    {request.maintenanceExecution.workDescription && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground mb-1">وصف الأعمال المنجزة:</p>
                        <p className="rounded-lg bg-muted/50 p-3">{request.maintenanceExecution.workDescription}</p>
                      </div>
                    )}
                    {request.maintenanceExecution.partsUsed && request.maintenanceExecution.partsUsed.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground mb-1.5">قطع الغيار المستخدمة:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {request.maintenanceExecution.partsUsed.map((part, i) => (
                            <span key={i} className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs text-blue-700">{part}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Checklist */}
                  {request.maintenanceExecution.checklist && request.maintenanceExecution.checklist.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-foreground mb-2">قائمة مهام التنفيذ:</p>
                      <div className="space-y-2">
                        {request.maintenanceExecution.checklist.map((item) => (
                          <div key={item.id} className="flex items-center gap-2.5">
                            <div className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2 flex-shrink-0', item.completed ? 'border-emerald-500 bg-emerald-500' : 'border-border')}>
                              {item.completed && <CheckCircle className="h-3 w-3 text-white" style={{ height: 10, width: 10 }} />}
                            </div>
                            <span className={cn('text-sm', item.completed ? 'line-through text-muted-foreground' : 'text-foreground')}>{item.label}</span>
                          </div>
                        ))}
                      </div>
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
                        <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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

              {/* Add Comment */}
              <div className="space-y-2">
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

              {/* Comments list */}
              {request.comments.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">لا توجد تعليقات بعد</p>
              ) : (
                <div className="divide-y divide-border">
                  {[...request.comments].reverse().map((c) => (
                    <div key={c.id} className="py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {c.author[0]}
                          </div>
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
              <h3 className="text-sm font-semibold text-foreground mb-4">المستندات النهائية</h3>
              {request.finalDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">لا توجد مستندات بعد. ستظهر هنا بعد اكتمال الصيانة.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {request.finalDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-border p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
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
        </div>

        {/* Action Sidebar */}
        <div className="space-y-4">
          {/* Status Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-foreground">معلومات الطلب</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">الحالة</span>
                <StatusBadge status={request.status} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">الأولوية</span>
                <PriorityBadge priority={request.priority} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">المرحلة</span>
                <span className="text-xs font-medium">{request.currentStage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">المسؤول</span>
                <span className="text-xs font-medium">{request.currentOwnerName || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">الدور</span>
                <span className="text-xs font-medium">{ROLE_LABELS[request.currentOwnerRole]}</span>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          {allowedTransitions.length > 0 && (
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
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all shadow-sm',
                        style
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {transition.actionLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* No actions for current role */}
          {allowedTransitions.length === 0 && currentUser && (
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
            confirmAction.includes('reject') || confirmAction.includes('could_not')
              ? 'danger'
              : confirmAction.includes('return') || confirmAction.includes('follow_up')
              ? 'warning'
              : 'primary'
          }
        >
          {/* Extra fields for routing */}
          {confirmAction === 'route_to_maintenance' && (
            <div className="mb-2 space-y-1.5">
              <label className="block text-xs font-medium text-foreground">اختر مسؤول الصيانة *</label>
              <select
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option>فيصل بن علي الزهراني</option>
                <option>سعد محمد الغامدي</option>
                <option>عمر خالد السلمي</option>
              </select>
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
    </div>
  );
}
