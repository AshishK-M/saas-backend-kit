import { Role, Permission, RolePermissions, DEFAULT_PERMISSIONS } from './types';

export class RBACService {
  private permissions: RolePermissions;

  constructor(permissions: RolePermissions = DEFAULT_PERMISSIONS) {
    this.permissions = permissions;
  }

  setPermissions(permissions: RolePermissions): void {
    this.permissions = permissions;
  }

  addPermission(role: Role, permission: Permission): void {
    if (!this.permissions[role]) {
      this.permissions[role] = [];
    }
    if (!this.permissions[role].includes(permission)) {
      this.permissions[role].push(permission);
    }
  }

  removePermission(role: Role, permission: Permission): void {
    if (this.permissions[role]) {
      this.permissions[role] = this.permissions[role].filter(p => p !== permission);
    }
  }

  getPermissions(role: Role): Permission[] {
    return this.permissions[role] || [];
  }

  hasPermission(role: Role, requiredPermission: Permission): boolean {
    const rolePermissions = this.getPermissions(role);
    
    if (rolePermissions.includes('*')) {
      return true;
    }

    if (rolePermissions.includes(requiredPermission)) {
      return true;
    }

    const [requiredAction, requiredScope] = requiredPermission.split(':');
    
    for (const perm of rolePermissions) {
      const [action, scope] = perm.split(':');
      
      if (action === '*' && (scope === '*' || scope === requiredScope)) {
        return true;
      }
      
      if (action === requiredAction && (scope === '*' || scope === requiredScope)) {
        return true;
      }
    }

    return false;
  }

  hasRole(userRole: Role, requiredRole: Role): boolean {
    const hierarchy: Role[] = ['guest', 'user', 'admin'];
    const userIndex = hierarchy.indexOf(userRole as any);
    const requiredIndex = hierarchy.indexOf(requiredRole as any);
    
    if (userIndex === -1 || requiredIndex === -1) {
      return userRole === requiredRole;
    }
    
    return userIndex >= requiredIndex;
  }

  authorize(permission: Permission) {
    return (role: Role): boolean => this.hasPermission(role, permission);
  }

  authorizeRole(requiredRole: Role) {
    return (role: Role): boolean => this.hasRole(role, requiredRole);
  }
}

export const rbacService = new RBACService();
