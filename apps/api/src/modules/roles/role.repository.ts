import type { Permission } from '@redsis/contracts';

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
  userCount: number;
}

/** Contrato de acceso a roles. */
export abstract class RoleRepository {
  abstract list(): Promise<RoleWithPermissions[]>;

  abstract findById(id: string): Promise<RoleWithPermissions | null>;
}
