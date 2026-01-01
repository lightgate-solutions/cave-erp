export type User = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string | null;
  department: string | null;
  managerId: string | null;
  isManager: boolean;
  authId: string;
  userId: string;
  staffNumber: string | null;
};
