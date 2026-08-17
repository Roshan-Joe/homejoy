import api from './api';

export const roleService = {
  /**
   * Get all system roles with descriptions, user counts, and permission lists
   */
  getRoles: async () => {
    const response = await api.get('/api/roles');
    return response.data;
  },

  /**
   * Get catalog of all available permissions
   */
  getPermissionsCatalog: async () => {
    const response = await api.get('/api/roles/permissions-catalog');
    return response.data;
  },

  /**
   * Get single role details by name
   */
  getRoleByName: async (roleName) => {
    const response = await api.get(`/api/roles/${encodeURIComponent(roleName)}`);
    return response.data;
  },

  /**
   * Update permissions array assigned to a system role
   */
  updateRolePermissions: async (roleName, permissions) => {
    const response = await api.put(`/api/roles/${encodeURIComponent(roleName)}/permissions`, {
      permissions
    });
    return response.data;
  },

  /**
   * Assign or change a user's system role
   */
  assignUserRole: async (userId, newRole) => {
    const response = await api.patch(`/api/roles/assign-user/${userId}`, {
      role: newRole
    });
    return response.data;
  },

  /**
   * Get calculated effective permissions for a user
   */
  getUserPermissions: async (userId) => {
    const response = await api.get(`/api/roles/user-permissions/${userId}`);
    return response.data;
  }
};

export default roleService;
