import api from './api';

export const userService = {
  /**
   * Fetch paginated list of users with search, role filter, status filter, sorting, and pagination
   */
  getUsers: async ({ search = '', role = 'all', status = 'all', sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = {}) => {
    const params = { page, limit, sort_by: sortBy, sort_order: sortOrder };
    if (search && search.trim()) params.search = search.trim();
    if (role && role !== 'all') params.role = role;
    if (status && status !== 'all') params.status = status;

    const response = await api.get('/api/users', { params });
    return response.data;
  },

  /**
   * Dedicated search endpoint for users by name, email, or phone
   */
  searchUsers: async (query, page = 1, limit = 10) => {
    const response = await api.get('/api/users/search', {
      params: { q: query, page, limit }
    });
    return response.data;
  },

  /**
   * Get single user profile by ID
   */
  getUserById: async (userId) => {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  },

  /**
   * Create a new user account
   */
  createUser: async (userData) => {
    const response = await api.post('/api/users', userData);
    return response.data;
  },

  /**
   * Update user profile information
   */
  updateUser: async (userId, updateData) => {
    const response = await api.put(`/api/users/${userId}`, updateData);
    return response.data;
  },

  /**
   * Toggle or update user account status (Activate / Deactivate)
   */
  updateUserStatus: async (userId, is_active) => {
    const response = await api.patch(`/api/users/${userId}/status`, {
      is_active,
      status: is_active ? 'active' : 'inactive'
    });
    return response.data;
  },

  /**
   * Delete user permanently
   */
  deleteUser: async (userId) => {
    const response = await api.delete(`/api/users/${userId}`);
    return response.data;
  }
};

export default userService;
