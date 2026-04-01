import { UserRole, type User } from '@/types';

export const MOCK_USERS: User[] = [
  // 1. مسؤول الحركة
  {
    id: 'u1',
    name: 'محمد عبدالله الشهري',
    employeeId: 'EMP-1042',
    role: UserRole.TRAFFIC_OFFICER,
    department: 'إدارة الحركة والمواصلات',
    email: 'm.shahri@org.gov.sa',
  },
  // 2. مدير الشؤون الإدارية (notification only)
  {
    id: 'u2',
    name: 'سلمى بنت أحمد العتيبي',
    employeeId: 'EMP-2018',
    role: UserRole.ADMIN_DIRECTOR,
    department: 'إدارة الشؤون الإدارية',
    email: 's.otaibi@org.gov.sa',
  },
  // 3. مدير شعبة النقل والصيانة (initial + final review)
  {
    id: 'u3',
    name: 'خالد بن سعد القحطاني',
    employeeId: 'EMP-3055',
    role: UserRole.TRANSPORT_MAINTENANCE_DIRECTOR,
    department: 'شعبة النقل والصيانة',
    email: 'k.qahtani@org.gov.sa',
  },
  // 4. مدير الإمداد والصيانة (NEW)
  {
    id: 'u4',
    name: 'عبدالرحمن بن فهد الدوسري',
    employeeId: 'EMP-4011',
    role: UserRole.SUPPLY_MAINTENANCE_DIRECTOR,
    department: 'إدارة الإمداد والصيانة',
    email: 'a.dosari@org.gov.sa',
  },
  // 5. مدير الصيانة (was routing_director)
  {
    id: 'u5',
    name: 'سعود بن ناصر الحربي',
    employeeId: 'EMP-5033',
    role: UserRole.MAINTENANCE_DIRECTOR,
    department: 'إدارة الصيانة',
    email: 's.harbi@org.gov.sa',
  },
  // 6. مسؤول الصيانة (primary)
  {
    id: 'u6',
    name: 'فيصل بن علي الزهراني',
    employeeId: 'EMP-6099',
    role: UserRole.MAINTENANCE_OFFICER,
    department: 'قسم الصيانة الميدانية',
    email: 'f.zahrani@org.gov.sa',
  },
  // 7. مسؤول صيانة آخر مختص (same role as u6, just a different person with different specialization)
  {
    id: 'u7',
    name: 'أحمد بن سعد الغامدي',
    employeeId: 'EMP-7077',
    role: UserRole.MAINTENANCE_OFFICER,
    department: 'قسم الصيانة التخصصية',
    email: 'a.ghamdi@org.gov.sa',
  },
];

export const DEMO_CREDENTIALS: Record<string, string> = {
  'EMP-1042': '123456', // مسؤول الحركة
  'EMP-2018': '123456', // مدير الشؤون الإدارية
  'EMP-3055': '123456', // مدير شعبة النقل والصيانة
  'EMP-4011': '123456', // مدير الإمداد والصيانة
  'EMP-5033': '123456', // مدير الصيانة
  'EMP-6099': '123456', // مسؤول الصيانة
  'EMP-7077': '123456', // مسؤول صيانة آخر مختص
};

export function getUserByEmployeeId(employeeId: string): User | undefined {
  return MOCK_USERS.find((u) => u.employeeId === employeeId);
}

export function getUsersByRole(role: UserRole): User[] {
  return MOCK_USERS.filter((u) => u.role === role);
}
