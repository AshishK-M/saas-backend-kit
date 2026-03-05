describe('RBAC Module', () => {
  test('should create RBAC service', () => {
    const { RBACService } = require('../dist/auth/rbac');
    const rbac = new RBACService();
    
    expect(rbac).toBeDefined();
    expect(rbac.hasPermission).toBeDefined();
    expect(rbac.hasRole).toBeDefined();
  });

  test('should check permissions with wildcard', () => {
    const { RBACService } = require('../dist/auth/rbac');
    const rbac = new RBACService({
      admin: ['*'],
      user: ['read']
    });
    
    expect(rbac.hasPermission('admin', 'anything')).toBe(true);
    expect(rbac.hasPermission('admin', 'read')).toBe(true);
    expect(rbac.hasPermission('admin', 'write')).toBe(true);
  });

  test('should check specific permissions', () => {
    const { RBACService } = require('../dist/auth/rbac');
    const rbac = new RBACService({
      user: ['read', 'write:own']
    });
    
    expect(rbac.hasPermission('user', 'read')).toBe(true);
    expect(rbac.hasPermission('user', 'write:own')).toBe(true);
    expect(rbac.hasPermission('user', 'delete')).toBe(false);
  });

  test('should check role hierarchy', () => {
    const { RBACService } = require('../dist/auth/rbac');
    const rbac = new RBACService();
    
    expect(rbac.hasRole('admin', 'admin')).toBe(true);
    expect(rbac.hasRole('admin', 'user')).toBe(true);
    expect(rbac.hasRole('user', 'admin')).toBe(false);
    expect(rbac.hasRole('guest', 'user')).toBe(false);
  });

  test('should get permissions for role', () => {
    const { RBACService } = require('../dist/auth/rbac');
    const rbac = new RBACService({
      manager: ['read', 'write', 'delete']
    });
    
    const perms = rbac.getPermissions('manager');
    expect(perms).toContain('read');
    expect(perms).toContain('write');
    expect(perms).toContain('delete');
  });

  test('should add permission to role', () => {
    const { RBACService } = require('../dist/auth/rbac');
    const rbac = new RBACService({ user: ['read'] });
    
    rbac.addPermission('user', 'write');
    
    expect(rbac.hasPermission('user', 'write')).toBe(true);
  });

  test('should remove permission from role', () => {
    const { RBACService } = require('../dist/auth/rbac');
    const rbac = new RBACService({ user: ['read', 'write'] });
    
    rbac.removePermission('user', 'write');
    
    expect(rbac.hasPermission('user', 'write')).toBe(false);
    expect(rbac.hasPermission('user', 'read')).toBe(true);
  });
});
