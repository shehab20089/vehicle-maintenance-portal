import {
  RequestStatus, Priority, IssueCategory, VehicleCondition, UserRole, type MaintenanceRequest,
} from '@/types';

const TF = { name: 'محمد عبدالله الشهري', employeeId: 'EMP-1042', department: 'إدارة الحركة والمواصلات', phone: '0501234567', email: 'm.shahri@org.gov.sa' };
const TRANSPORT_DIR = { name: 'خالد بن سعد القحطاني', role: UserRole.TRANSPORT_MAINTENANCE_DIRECTOR };
const SUPPLY_DIR = { name: 'عبدالرحمن بن فهد الدوسري', role: UserRole.SUPPLY_MAINTENANCE_DIRECTOR };
const MAINT_DIR = { name: 'سعود بن ناصر الحربي', role: UserRole.MAINTENANCE_DIRECTOR };
const MAINT_OFF = { name: 'فيصل بن علي الزهراني', role: UserRole.MAINTENANCE_OFFICER };
const SPEC_OFF = { name: 'أحمد بن سعد الغامدي', role: UserRole.MAINTENANCE_OFFICER };
const ADMIN_DIR = { name: 'سلمى بنت أحمد العتيبي', role: UserRole.ADMIN_DIRECTOR };

function tl(id: string, action: string, desc: string, by: string, role: UserRole, ts: string, from?: RequestStatus, to?: RequestStatus, notes?: string) {
  return { id, action, description: desc, performedBy: by, performedByRole: role, timestamp: ts, ...(from ? { fromStatus: from } : {}), ...(to ? { toStatus: to } : {}), ...(notes ? { notes } : {}) };
}

export const MOCK_REQUESTS: MaintenanceRequest[] = [

  // 1. DRAFT
  {
    id: 'req-001', requestNumber: 'MR-2026-1011', requester: TF,
    vehicle: { vehicleNumber: 'VH-190', plateNumber: 'ن هـ و 2580', vehicleType: 'سيارة رباعية الدفع', make: 'ميتسوبيشي', model: 'باجيرو', year: 2022, color: 'بيج', currentCondition: VehicleCondition.PARTIALLY },
    issueCategory: IssueCategory.BRAKES, issueDescription: 'صوت صفير عند الكبح ويبدو أن الفرامل تحتاج للفحص.', priority: Priority.MEDIUM,
    status: RequestStatus.DRAFT, currentStage: 'مسودة', currentOwnerRole: UserRole.TRAFFIC_OFFICER, currentOwnerName: TF.name,
    createdAt: '2026-03-31T07:00:00Z', updatedAt: '2026-03-31T07:00:00Z', attachments: [], comments: [], finalDocuments: [],
    timeline: [tl('tl-001-1', 'إنشاء الطلب', 'تم إنشاء طلب الصيانة', TF.name, UserRole.TRAFFIC_OFFICER, '2026-03-31T07:00:00Z', undefined, RequestStatus.DRAFT)],
  },

  // 2. UNDER_TRANSPORT_REVIEW (new normal path — skips admin decision)
  {
    id: 'req-002', requestNumber: 'MR-2026-1001', requester: TF,
    vehicle: { vehicleNumber: 'VH-445', plateNumber: 'أ ب ج 1234', vehicleType: 'سيارة رباعية الدفع', make: 'تويوتا', model: 'لاند كروزر', year: 2021, color: 'أبيض', currentCondition: VehicleCondition.PARTIALLY },
    issueCategory: IssueCategory.ENGINE, issueDescription: 'تسرب زيت من المحرك مع صوت طقطقة عند تسريع المحرك.', priority: Priority.HIGH,
    status: RequestStatus.UNDER_TRANSPORT_REVIEW, currentStage: 'مراجعة شعبة النقل والصيانة', currentOwnerRole: UserRole.TRANSPORT_MAINTENANCE_DIRECTOR, currentOwnerName: TRANSPORT_DIR.name,
    createdAt: '2026-03-28T08:30:00Z', updatedAt: '2026-03-28T10:05:00Z', submittedAt: '2026-03-28T09:00:00Z',
    attachments: [{ id: 'att-002-1', name: 'صورة تسرب الزيت.jpg', type: 'image/jpeg', size: 1245000, url: '#', uploadedAt: '2026-03-28T08:45:00Z', uploadedBy: TF.name }],
    comments: [], finalDocuments: [],
    timeline: [
      tl('tl-002-1', 'إنشاء الطلب', 'تم إنشاء طلب الصيانة', TF.name, UserRole.TRAFFIC_OFFICER, '2026-03-28T08:30:00Z', undefined, RequestStatus.DRAFT),
      tl('tl-002-2', 'تقديم الطلب', 'تم تقديم الطلب', TF.name, UserRole.TRAFFIC_OFFICER, '2026-03-28T09:00:00Z', RequestStatus.DRAFT, RequestStatus.SUBMITTED),
      tl('tl-002-3', 'إشعار مدير الشؤون الإدارية', 'تم إشعار مدير الشؤون الإدارية تلقائياً', 'النظام', UserRole.ADMIN_DIRECTOR, '2026-03-28T09:01:00Z', RequestStatus.SUBMITTED, RequestStatus.ADMIN_NOTIFIED),
      tl('tl-002-4', 'إحالة لمدير شعبة النقل والصيانة', 'تم تحويل الطلب تلقائياً', 'النظام', UserRole.ADMIN_DIRECTOR, '2026-03-28T10:05:00Z', RequestStatus.ADMIN_NOTIFIED, RequestStatus.UNDER_TRANSPORT_REVIEW),
    ],
    notes: 'المركبة مطلوبة لرحلات رسمية مقررة.',
  },

  // 3. RETURNED_BY_TRANSPORT — scenario: returned by transport director
  {
    id: 'req-003', requestNumber: 'MR-2026-1002', requester: TF,
    vehicle: { vehicleNumber: 'VH-217', plateNumber: 'د هـ و 5678', vehicleType: 'حافلة', make: 'مرسيدس بنز', model: 'Sprinter', year: 2019, color: 'أبيض', currentCondition: VehicleCondition.PARTIALLY },
    issueCategory: IssueCategory.BRAKES, issueDescription: 'الفرامل تصدر صوتاً حاداً عند الضغط عليها.', priority: Priority.URGENT,
    status: RequestStatus.RETURNED_BY_TRANSPORT, currentStage: 'معاد من شعبة النقل والصيانة', currentOwnerRole: UserRole.TRAFFIC_OFFICER, currentOwnerName: TF.name,
    pendingReturnToRole: UserRole.TRANSPORT_MAINTENANCE_DIRECTOR,
    createdAt: '2026-03-25T09:00:00Z', updatedAt: '2026-03-26T14:00:00Z', submittedAt: '2026-03-25T10:00:00Z', attachments: [], finalDocuments: [],
    comments: [{ id: 'c-003-1', text: 'يرجى إرفاق تقرير الكشف الأولي قبل إعادة التقديم.', author: TRANSPORT_DIR.name, authorRole: UserRole.TRANSPORT_MAINTENANCE_DIRECTOR, createdAt: '2026-03-26T14:00:00Z' }],
    timeline: [
      tl('tl-003-1', 'إنشاء الطلب', 'تم إنشاء طلب الصيانة', TF.name, UserRole.TRAFFIC_OFFICER, '2026-03-25T09:00:00Z', undefined, RequestStatus.DRAFT),
      tl('tl-003-2', 'تقديم الطلب', 'تم تقديم الطلب', TF.name, UserRole.TRAFFIC_OFFICER, '2026-03-25T10:00:00Z', RequestStatus.DRAFT, RequestStatus.SUBMITTED),
      tl('tl-003-3', 'إشعار مدير الشؤون الإدارية', 'تم الإشعار تلقائياً', 'النظام', UserRole.ADMIN_DIRECTOR, '2026-03-25T10:01:00Z', RequestStatus.SUBMITTED, RequestStatus.ADMIN_NOTIFIED),
      tl('tl-003-4', 'إحالة للمراجعة', 'تحويل تلقائي', 'النظام', UserRole.ADMIN_DIRECTOR, '2026-03-25T11:00:00Z', RequestStatus.ADMIN_NOTIFIED, RequestStatus.UNDER_TRANSPORT_REVIEW),
      tl('tl-003-5', 'إرجاع الطلب للاستكمال', 'أعاد المدير الطلب بسبب نقص المستندات', TRANSPORT_DIR.name, UserRole.TRANSPORT_MAINTENANCE_DIRECTOR, '2026-03-26T14:00:00Z', RequestStatus.UNDER_TRANSPORT_REVIEW, RequestStatus.RETURNED_BY_TRANSPORT, 'يرجى إرفاق تقرير الكشف الأولي.'),
    ],
  },

  // 4. UNDER_SUPPLY_REVIEW — scenario: approved by transport, now at supply stage
  {
    id: 'req-004', requestNumber: 'MR-2026-1003', requester: TF,
    vehicle: { vehicleNumber: 'VH-089', plateNumber: 'ز ح ط 9012', vehicleType: 'سيارة سيدان', make: 'كيا', model: 'سيراتو', year: 2022, color: 'رمادي', currentCondition: VehicleCondition.OPERATIONAL },
    issueCategory: IssueCategory.AC, issueDescription: 'جهاز التكييف لا يبرد بشكل كافٍ.', priority: Priority.MEDIUM,
    status: RequestStatus.UNDER_SUPPLY_REVIEW, currentStage: 'مراجعة الإمداد والصيانة', currentOwnerRole: UserRole.SUPPLY_MAINTENANCE_DIRECTOR, currentOwnerName: SUPPLY_DIR.name,
    createdAt: '2026-03-20T08:00:00Z', updatedAt: '2026-03-22T11:00:00Z', submittedAt: '2026-03-20T09:00:00Z', attachments: [], comments: [], finalDocuments: [],
    timeline: [
      tl('tl-004-1', 'تقديم الطلب', 'تم التقديم', TF.name, UserRole.TRAFFIC_OFFICER, '2026-03-20T09:00:00Z', RequestStatus.DRAFT, RequestStatus.SUBMITTED),
      tl('tl-004-2', 'إشعار الشؤون الإدارية', 'تلقائي', 'النظام', UserRole.ADMIN_DIRECTOR, '2026-03-20T09:01:00Z', RequestStatus.SUBMITTED, RequestStatus.ADMIN_NOTIFIED),
      tl('tl-004-3', 'إحالة للنقل والصيانة', 'تلقائي', 'النظام', UserRole.ADMIN_DIRECTOR, '2026-03-20T10:00:00Z', RequestStatus.ADMIN_NOTIFIED, RequestStatus.UNDER_TRANSPORT_REVIEW),
      tl('tl-004-4', 'قبول وإحالة لمدير الإمداد والصيانة', 'وافق مدير شعبة النقل والصيانة', TRANSPORT_DIR.name, UserRole.TRANSPORT_MAINTENANCE_DIRECTOR, '2026-03-22T11:00:00Z', RequestStatus.UNDER_TRANSPORT_REVIEW, RequestStatus.UNDER_SUPPLY_REVIEW, 'الطلب مستوفٍ للمتطلبات.'),
    ],
  },

  // 5. REJECTED_BY_SUPPLY — scenario: rejected by supply director
  {
    id: 'req-005', requestNumber: 'MR-2026-0970', requester: TF,
    vehicle: { vehicleNumber: 'VH-778', plateNumber: 'س ش ص 2468', vehicleType: 'سيارة سيدان', make: 'تويوتا', model: 'كامري', year: 2018, color: 'أسود', currentCondition: VehicleCondition.OPERATIONAL },
    issueCategory: IssueCategory.BODY, issueDescription: 'خدوش وأضرار بسيطة في الهيكل الخارجي.', priority: Priority.LOW,
    status: RequestStatus.REJECTED_BY_SUPPLY, currentStage: 'مرفوض من الإمداد والصيانة', currentOwnerRole: UserRole.TRAFFIC_OFFICER, currentOwnerName: TF.name,
    createdAt: '2026-02-20T08:00:00Z', updatedAt: '2026-02-23T12:00:00Z', submittedAt: '2026-02-20T09:00:00Z', attachments: [], comments: [], finalDocuments: [],
    timeline: [
      tl('tl-005-1', 'تقديم الطلب', 'تم التقديم', TF.name, UserRole.TRAFFIC_OFFICER, '2026-02-20T09:00:00Z', RequestStatus.DRAFT, RequestStatus.SUBMITTED),
      tl('tl-005-2', 'قبول من النقل والصيانة', 'موافقة المرحلة الأولى', TRANSPORT_DIR.name, UserRole.TRANSPORT_MAINTENANCE_DIRECTOR, '2026-02-21T10:00:00Z', RequestStatus.UNDER_TRANSPORT_REVIEW, RequestStatus.UNDER_SUPPLY_REVIEW),
      tl('tl-005-3', 'رفض الطلب', 'رفض مدير الإمداد الطلب', SUPPLY_DIR.name, UserRole.SUPPLY_MAINTENANCE_DIRECTOR, '2026-02-23T12:00:00Z', RequestStatus.UNDER_SUPPLY_REVIEW, RequestStatus.REJECTED_BY_SUPPLY, 'لا يندرج إصلاح الهيكل الخارجي ضمن نطاق الميزانية المعتمدة.'),
    ],
  },

  // 6. UNDER_MAINTENANCE_DIRECTOR_REVIEW — scenario: routed by supply director
  {
    id: 'req-006', requestNumber: 'MR-2026-1004', requester: TF,
    vehicle: { vehicleNumber: 'VH-312', plateNumber: 'ي ك ل 3456', vehicleType: 'شاحنة خفيفة', make: 'فورد', model: 'F-150', year: 2020, color: 'أزرق', currentCondition: VehicleCondition.NON_OPERATIONAL },
    issueCategory: IssueCategory.ELECTRICAL, issueDescription: 'انقطاع كامل في الأنظمة الكهربائية للمركبة.', priority: Priority.URGENT,
    status: RequestStatus.UNDER_MAINTENANCE_DIRECTOR_REVIEW, currentStage: 'مراجعة مدير الصيانة', currentOwnerRole: UserRole.MAINTENANCE_DIRECTOR, currentOwnerName: MAINT_DIR.name,
    createdAt: '2026-03-15T07:30:00Z', updatedAt: '2026-03-19T15:00:00Z', submittedAt: '2026-03-15T08:00:00Z',
    attachments: [{ id: 'att-006-1', name: 'تقرير الكشف المبدئي.pdf', type: 'application/pdf', size: 524000, url: '#', uploadedAt: '2026-03-15T08:30:00Z', uploadedBy: TF.name }],
    comments: [], finalDocuments: [],
    timeline: [
      tl('tl-006-1', 'تقديم الطلب', 'تم التقديم', TF.name, UserRole.TRAFFIC_OFFICER, '2026-03-15T08:00:00Z', RequestStatus.DRAFT, RequestStatus.SUBMITTED),
      tl('tl-006-2', 'قبول من النقل والصيانة', 'موافقة المرحلة الأولى', TRANSPORT_DIR.name, UserRole.TRANSPORT_MAINTENANCE_DIRECTOR, '2026-03-16T10:00:00Z', RequestStatus.UNDER_TRANSPORT_REVIEW, RequestStatus.UNDER_SUPPLY_REVIEW),
      tl('tl-006-3', 'قبول من الإمداد والصيانة', 'موافقة المرحلة الثانية', SUPPLY_DIR.name, UserRole.SUPPLY_MAINTENANCE_DIRECTOR, '2026-03-19T15:00:00Z', RequestStatus.UNDER_SUPPLY_REVIEW, RequestStatus.UNDER_MAINTENANCE_DIRECTOR_REVIEW, 'موافقة على الميزانية.'),
    ],
  },

  // 7. ROUTED_TO_MAINTENANCE — scenario: routed by maintenance director
  {
    id: 'req-007', requestNumber: 'MR-2026-1006', requester: TF,
    vehicle: { vehicleNumber: 'VH-623', plateNumber: 'ط ظ ع 8024', vehicleType: 'سيارة رباعية الدفع', make: 'جيب', model: 'رانجلر', year: 2022, color: 'أخضر', currentCondition: VehicleCondition.PARTIALLY },
    issueCategory: IssueCategory.SUSPENSION, issueDescription: 'صوت طقطقة في التعليق الأمامي واهتزاز في عجلة القيادة.', priority: Priority.HIGH,
    status: RequestStatus.ROUTED_TO_MAINTENANCE, currentStage: 'محول لمسؤول الصيانة', currentOwnerRole: UserRole.MAINTENANCE_OFFICER, currentOwnerName: MAINT_OFF.name,
    createdAt: '2026-03-27T10:00:00Z', updatedAt: '2026-03-30T14:00:00Z', submittedAt: '2026-03-27T11:00:00Z', attachments: [], comments: [], finalDocuments: [],
    timeline: [
      tl('tl-007-1', 'تقديم الطلب', 'تم التقديم', TF.name, UserRole.TRAFFIC_OFFICER, '2026-03-27T11:00:00Z', RequestStatus.DRAFT, RequestStatus.SUBMITTED),
      tl('tl-007-2', 'قبول من النقل والصيانة', 'موافقة أولى', TRANSPORT_DIR.name, UserRole.TRANSPORT_MAINTENANCE_DIRECTOR, '2026-03-28T09:00:00Z', RequestStatus.UNDER_TRANSPORT_REVIEW, RequestStatus.UNDER_SUPPLY_REVIEW),
      tl('tl-007-3', 'قبول من الإمداد والصيانة', 'موافقة ثانية', SUPPLY_DIR.name, UserRole.SUPPLY_MAINTENANCE_DIRECTOR, '2026-03-28T15:00:00Z', RequestStatus.UNDER_SUPPLY_REVIEW, RequestStatus.UNDER_MAINTENANCE_DIRECTOR_REVIEW),
      tl('tl-007-4', 'توجيه إلى مسؤول الصيانة', 'تم تعيين فيصل الزهراني', MAINT_DIR.name, UserRole.MAINTENANCE_DIRECTOR, '2026-03-30T14:00:00Z', RequestStatus.UNDER_MAINTENANCE_DIRECTOR_REVIEW, RequestStatus.ROUTED_TO_MAINTENANCE, 'أولوية قصوى.'),
    ],
    maintenanceExecution: { assignedOfficer: MAINT_OFF.name, assignedOfficerRole: UserRole.MAINTENANCE_OFFICER },
  },

  // 8. ROUTED_TO_SPECIALIZED — scenario: primary officer routes to specialized
  {
    id: 'req-008', requestNumber: 'MR-2026-1007', requester: TF,
    vehicle: { vehicleNumber: 'VH-550', plateNumber: 'م ن هـ 7890', vehicleType: 'سيارة رباعية الدفع', make: 'نيسان', model: 'باترول', year: 2023, color: 'أبيض', currentCondition: VehicleCondition.NON_OPERATIONAL },
    issueCategory: IssueCategory.TRANSMISSION, issueDescription: 'ناقل الحركة يصدر ضوضاء عالية وتعذر التغيير من وضع الوقوف.', priority: Priority.URGENT,
    status: RequestStatus.ROUTED_TO_SPECIALIZED, currentStage: 'محول لمسؤول صيانة مختص', currentOwnerRole: UserRole.MAINTENANCE_OFFICER, currentOwnerName: SPEC_OFF.name,
    createdAt: '2026-03-10T07:00:00Z', updatedAt: '2026-03-26T11:00:00Z', submittedAt: '2026-03-10T08:00:00Z', attachments: [], comments: [], finalDocuments: [],
    timeline: [
      tl('tl-008-1', 'تقديم الطلب', 'تم التقديم', TF.name, UserRole.TRAFFIC_OFFICER, '2026-03-10T08:00:00Z', RequestStatus.DRAFT, RequestStatus.SUBMITTED),
      tl('tl-008-2', 'توجيه إلى مسؤول الصيانة', 'تعيين فيصل الزهراني', MAINT_DIR.name, UserRole.MAINTENANCE_DIRECTOR, '2026-03-20T09:00:00Z', RequestStatus.UNDER_MAINTENANCE_DIRECTOR_REVIEW, RequestStatus.ROUTED_TO_MAINTENANCE),
      tl('tl-008-3', 'توجيه إلى مسؤول صيانة آخر مختص', 'يحتاج تخصص في ناقل الحركة', MAINT_OFF.name, UserRole.MAINTENANCE_OFFICER, '2026-03-26T11:00:00Z', RequestStatus.ROUTED_TO_MAINTENANCE, RequestStatus.ROUTED_TO_SPECIALIZED, 'المشكلة تتطلب متخصصاً في أنظمة ناقل الحركة الأوتوماتيكي.'),
    ],
    maintenanceExecution: { assignedOfficer: MAINT_OFF.name, assignedOfficerRole: UserRole.MAINTENANCE_OFFICER, specializedOfficer: SPEC_OFF.name },
  },

  // 9. RETURNED_BY_SPECIALIZED — scenario: specialized officer returns
  {
    id: 'req-009', requestNumber: 'MR-2026-1008', requester: TF,
    vehicle: { vehicleNumber: 'VH-401', plateNumber: 'غ ف ق 6543', vehicleType: 'سيارة سيدان', make: 'هوندا', model: 'أكورد', year: 2021, color: 'أحمر', currentCondition: VehicleCondition.PARTIALLY },
    issueCategory: IssueCategory.ENGINE, issueDescription: 'مشكلة متكررة في نظام الحقن الإلكتروني.', priority: Priority.HIGH,
    status: RequestStatus.RETURNED_BY_SPECIALIZED, currentStage: 'معاد من مسؤول الصيانة المختص', currentOwnerRole: UserRole.TRAFFIC_OFFICER, currentOwnerName: TF.name,
    pendingReturnToRole: UserRole.MAINTENANCE_OFFICER,
    createdAt: '2026-03-05T08:00:00Z', updatedAt: '2026-03-29T10:00:00Z', submittedAt: '2026-03-05T09:00:00Z', attachments: [], comments: [], finalDocuments: [],
    timeline: [
      tl('tl-009-1', 'توجيه إلى مسؤول صيانة مختص', 'تحويل من الصيانة الأساسية', MAINT_OFF.name, UserRole.MAINTENANCE_OFFICER, '2026-03-15T09:00:00Z', RequestStatus.ROUTED_TO_MAINTENANCE, RequestStatus.ROUTED_TO_SPECIALIZED),
      tl('tl-009-2', 'إرجاع الطلب', 'يحتاج بيانات إضافية من مقدم الطلب', SPEC_OFF.name, UserRole.MAINTENANCE_OFFICER, '2026-03-29T10:00:00Z', RequestStatus.ROUTED_TO_SPECIALIZED, RequestStatus.RETURNED_BY_SPECIALIZED, 'يرجى إرفاق تقرير الفحص الإلكتروني من الوكالة.'),
    ],
  },

  // 10. IN_EXECUTION
  {
    id: 'req-010', requestNumber: 'MR-2026-1005', requester: TF,
    vehicle: { vehicleNumber: 'VH-255', plateNumber: 'ك ل م 1357', vehicleType: 'حافلة', make: 'تويوتا', model: 'كوستر', year: 2019, color: 'أبيض', currentCondition: VehicleCondition.NON_OPERATIONAL },
    issueCategory: IssueCategory.TIRES, issueDescription: 'الإطارات تالفة وتحتاج إلى استبدال عاجل.', priority: Priority.HIGH,
    status: RequestStatus.IN_EXECUTION, currentStage: 'تحت التنفيذ', currentOwnerRole: UserRole.MAINTENANCE_OFFICER, currentOwnerName: MAINT_OFF.name,
    createdAt: '2026-03-18T09:00:00Z', updatedAt: '2026-03-29T08:00:00Z', submittedAt: '2026-03-18T10:00:00Z', attachments: [], finalDocuments: [],
    comments: [{ id: 'c-010-1', text: 'تم الكشف — الإطارات الأربعة تحتاج استبدال.', author: MAINT_OFF.name, authorRole: UserRole.MAINTENANCE_OFFICER, createdAt: '2026-03-29T08:00:00Z' }],
    timeline: [
      tl('tl-010-1', 'توجيه إلى مسؤول الصيانة', 'تعيين للتنفيذ', MAINT_DIR.name, UserRole.MAINTENANCE_DIRECTOR, '2026-03-22T08:00:00Z', RequestStatus.UNDER_MAINTENANCE_DIRECTOR_REVIEW, RequestStatus.ROUTED_TO_MAINTENANCE),
      tl('tl-010-2', 'تنفيذ', 'بدء أعمال الصيانة', MAINT_OFF.name, UserRole.MAINTENANCE_OFFICER, '2026-03-29T08:00:00Z', RequestStatus.ROUTED_TO_MAINTENANCE, RequestStatus.IN_EXECUTION),
    ],
    maintenanceExecution: {
      assignedOfficer: MAINT_OFF.name, assignedOfficerRole: UserRole.MAINTENANCE_OFFICER,
      startDate: '2026-03-29T08:00:00Z', estimatedCompletion: '2026-04-01T17:00:00Z',
      workDescription: 'استبدال الإطارات الأربعة وفحص نظام التوازن',
      partsUsed: ['إطارات 225/55R17 × 4'],
      checklist: [
        { id: 'chk-1', label: 'فحص الإطارات وتحديد المطلوب', completed: true, completedAt: '2026-03-29T09:00:00Z' },
        { id: 'chk-2', label: 'طلب قطع الغيار', completed: true, completedAt: '2026-03-29T11:00:00Z' },
        { id: 'chk-3', label: 'تركيب الإطارات الجديدة', completed: false },
        { id: 'chk-4', label: 'ضبط التوازن واختبار المركبة', completed: false },
      ],
    },
  },

  // 11. UNDER_FINAL_REVIEW — pending final approval
  {
    id: 'req-011', requestNumber: 'MR-2026-1000', requester: TF,
    vehicle: { vehicleNumber: 'VH-101', plateNumber: 'أ ج هـ 1111', vehicleType: 'سيارة سيدان', make: 'هيونداي', model: 'سوناتا', year: 2020, color: 'فضي', currentCondition: VehicleCondition.OPERATIONAL },
    issueCategory: IssueCategory.OIL_CHANGE, issueDescription: 'حان موعد تغيير الزيت وفلتر الزيت.', priority: Priority.LOW,
    status: RequestStatus.UNDER_FINAL_REVIEW, currentStage: 'المراجعة النهائية', currentOwnerRole: UserRole.TRANSPORT_MAINTENANCE_DIRECTOR, currentOwnerName: TRANSPORT_DIR.name,
    createdAt: '2026-03-01T08:00:00Z', updatedAt: '2026-03-10T17:00:00Z', submittedAt: '2026-03-01T09:00:00Z', attachments: [], comments: [],
    finalDocuments: [{ id: 'doc-011-1', title: 'تقرير الصيانة', type: 'maintenance_report', generatedAt: '2026-03-10T16:00:00Z', url: '#', linkedOutcomeType: 'maintenance_completed' }],
    timeline: [
      tl('tl-011-1', 'تنفيذ', 'بدء أعمال الصيانة', MAINT_OFF.name, UserRole.MAINTENANCE_OFFICER, '2026-03-08T09:00:00Z', RequestStatus.ROUTED_TO_MAINTENANCE, RequestStatus.IN_EXECUTION),
      tl('tl-011-2', 'إتمام التنفيذ', 'اكتمل تغيير الزيت والفلتر', MAINT_OFF.name, UserRole.MAINTENANCE_OFFICER, '2026-03-10T15:00:00Z', RequestStatus.IN_EXECUTION, RequestStatus.EXECUTION_COMPLETE, 'تمت الصيانة بنجاح.'),
      tl('tl-011-3', 'إحالة للمراجعة النهائية', 'تلقائي', 'النظام', UserRole.MAINTENANCE_OFFICER, '2026-03-10T15:01:00Z', RequestStatus.EXECUTION_COMPLETE, RequestStatus.UNDER_FINAL_REVIEW),
    ],
    maintenanceExecution: { assignedOfficer: MAINT_OFF.name, startDate: '2026-03-08T09:00:00Z', actualCompletion: '2026-03-10T15:00:00Z', workDescription: 'تغيير زيت المحرك وفلتر الزيت', partsUsed: ['زيت محرك 5W-30', 'فلتر زيت'] },
    maintenanceOutcome: { outcomeType: 'maintenance_completed', outcomeLabel: 'تمت الصيانة + التقرير النهائي', reportNotes: 'المركبة في حالة ممتازة.' },
  },

  // 12. APPROVED_FINAL — different outcome: maintenance scheduled
  {
    id: 'req-012', requestNumber: 'MR-2026-0985', requester: TF,
    vehicle: { vehicleNumber: 'VH-720', plateNumber: 'و ز ح 3690', vehicleType: 'سيارة سيدان', make: 'بي إم دبليو', model: '520i', year: 2020, color: 'كحلي', currentCondition: VehicleCondition.PARTIALLY },
    issueCategory: IssueCategory.GENERAL, issueDescription: 'صيانة دورية شاملة وتغيير الفلاتر.', priority: Priority.MEDIUM,
    status: RequestStatus.APPROVED_FINAL, currentStage: 'تم الاعتماد النهائي', currentOwnerRole: UserRole.TRAFFIC_OFFICER, currentOwnerName: TF.name,
    createdAt: '2026-02-15T08:00:00Z', updatedAt: '2026-02-28T12:00:00Z', submittedAt: '2026-02-15T09:00:00Z', attachments: [], comments: [],
    finalDocuments: [
      { id: 'doc-012-1', title: 'إشعار موعد الصيانة', type: 'schedule_notice', generatedAt: '2026-02-25T10:00:00Z', url: '#', linkedOutcomeType: 'maintenance_scheduled' },
      { id: 'doc-012-2', title: 'التقرير النهائي', type: 'final_report', generatedAt: '2026-02-28T12:00:00Z', url: '#' },
    ],
    timeline: [
      tl('tl-012-1', 'إتمام التنفيذ', 'اكتملت أعمال الصيانة', SPEC_OFF.name, UserRole.MAINTENANCE_OFFICER, '2026-02-25T10:00:00Z', RequestStatus.IN_EXECUTION, RequestStatus.EXECUTION_COMPLETE),
      tl('tl-012-2', 'اعتماد نهائي', 'اعتمد مدير النقل والصيانة الطلب', TRANSPORT_DIR.name, UserRole.TRANSPORT_MAINTENANCE_DIRECTOR, '2026-02-28T12:00:00Z', RequestStatus.UNDER_FINAL_REVIEW, RequestStatus.APPROVED_FINAL, 'ممتاز. الجودة مقبولة.'),
    ],
    maintenanceExecution: { assignedOfficer: MAINT_OFF.name, specializedOfficer: SPEC_OFF.name, startDate: '2026-02-20T09:00:00Z', actualCompletion: '2026-02-25T10:00:00Z', workDescription: 'صيانة دورية شاملة', partsUsed: ['فلتر هواء', 'فلتر زيت', 'شمعات الإشعال'] },
    maintenanceOutcome: { outcomeType: 'maintenance_scheduled', outcomeLabel: 'إشعار بموعد الصيانة', scheduledDate: '2026-03-15T09:00:00Z', reportNotes: 'الموعد القادم أول مارس.' },
  },

  // 13. CLOSED — supply items outcome
  {
    id: 'req-013', requestNumber: 'MR-2026-0950', requester: TF,
    vehicle: { vehicleNumber: 'VH-035', plateNumber: 'ط ي ك 1597', vehicleType: 'شاحنة', make: 'مان', model: 'TGX', year: 2017, color: 'أبيض', currentCondition: VehicleCondition.OPERATIONAL },
    issueCategory: IssueCategory.ENGINE, issueDescription: 'تغيير قطع غيار المحرك الدورية.', priority: Priority.MEDIUM,
    status: RequestStatus.CLOSED, currentStage: 'مغلق', currentOwnerRole: UserRole.TRAFFIC_OFFICER, currentOwnerName: TF.name,
    createdAt: '2026-02-01T08:00:00Z', updatedAt: '2026-02-18T12:00:00Z', submittedAt: '2026-02-01T09:00:00Z', attachments: [], comments: [],
    finalDocuments: [
      { id: 'doc-013-1', title: 'طلب الأصناف', type: 'supply_request', generatedAt: '2026-02-14T15:00:00Z', url: '#', linkedOutcomeType: 'supply_items_requested' },
      { id: 'doc-013-2', title: 'التقرير النهائي', type: 'final_report', generatedAt: '2026-02-18T11:00:00Z', url: '#' },
    ],
    timeline: [
      tl('tl-013-1', 'اعتماد نهائي', 'اعتمد الطلب', TRANSPORT_DIR.name, UserRole.TRANSPORT_MAINTENANCE_DIRECTOR, '2026-02-17T10:00:00Z', RequestStatus.UNDER_FINAL_REVIEW, RequestStatus.APPROVED_FINAL),
      tl('tl-013-2', 'إغلاق الطلب', 'تم الإغلاق من مسؤول الحركة', TF.name, UserRole.TRAFFIC_OFFICER, '2026-02-18T12:00:00Z', RequestStatus.APPROVED_FINAL, RequestStatus.CLOSED),
    ],
    maintenanceExecution: { assignedOfficer: MAINT_OFF.name, startDate: '2026-02-05T09:00:00Z', actualCompletion: '2026-02-14T15:00:00Z', workDescription: 'تغيير قطع المحرك الدورية', partsUsed: ['فلتر وقود', 'مضخة وقود'] },
    maintenanceOutcome: { outcomeType: 'supply_items_requested', outcomeLabel: 'إشعار بطلب الأصناف', supplyItemsRequested: ['مضخة وقود', 'فلتر وقود احتياطي'], reportNotes: 'بعض القطع تحتاج طلباً إضافياً.' },
  },
];
