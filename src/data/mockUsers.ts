import { UserRole, type User } from '@/types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'محمد عبدالله الشهري',
    employeeId: 'EMP-1042',
    role: UserRole.TRAFFIC_OFFICER,
    department: 'إدارة الحركة والمواصلات',
    email: 'm.shahri@org.gov.sa',
  },
  {
    id: 'u2',
    name: 'سلمى بنت أحمد العتيبي',
    employeeId: 'EMP-2018',
    role: UserRole.ADMIN_DIRECTOR,
    department: 'إدارة الشؤون الإدارية',
    email: 's.otaibi@org.gov.sa',
  },
  {
    id: 'u3',
    name: 'خالد بن سعد القحطاني',
    employeeId: 'EMP-3055',
    role: UserRole.TRANSPORT_MAINTENANCE_DIRECTOR,
    department: 'شعبة النقل والصيانة',
    email: 'k.qahtani@org.gov.sa',
  },
  {
    id: 'u4',
    name: 'عبدالرحمن بن فهد الدوسري',
    employeeId: 'EMP-4011',
    role: UserRole.ROUTING_DIRECTOR,
    department: 'إدارة النقل والورش',
    email: 'a.dosari@org.gov.sa',
  },
  {
    id: 'u5',
    name: 'فيصل بن علي الزهراني',
    employeeId: 'EMP-5099',
    role: UserRole.MAINTENANCE_OFFICER,
    department: 'قسم الصيانة الميدانية',
    email: 'f.zahrani@org.gov.sa',
  },
];

export const DEMO_CREDENTIALS: Record<string, string> = {
  'EMP-1042': '123456',
  'EMP-2018': '123456',
  'EMP-3055': '123456',
  'EMP-4011': '123456',
  'EMP-5099': '123456',
};

export function getUserByEmployeeId(employeeId: string): User | undefined {
  return MOCK_USERS.find((u) => u.employeeId === employeeId);
}
