import type { UserRole } from "@/types";

interface RoleGuardProps {
  roles: UserRole[];
  children: React.ReactNode;
}

export default function RoleGuard({ children }: RoleGuardProps) {
  return <>{children}</>;
}
