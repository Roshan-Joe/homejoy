import React from 'react';
import { Filter, ArrowUpDown } from 'lucide-react';
import RoleDropdown from './RoleDropdown';

export const FilterPanel = ({
  selectedRole,
  setSelectedRole,
  selectedStatus,
  setSelectedStatus,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder
}) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
      {/* Role Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Filter size={16} style={{ color: 'var(--text-muted)' }} />
        <RoleDropdown
          value={selectedRole}
          onChange={setSelectedRole}
          includeAllOption={true}
        />
      </div>

      {/* Status Filter */}
      <div>
        <select
          className="form-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ padding: '8px 12px', fontSize: '0.88rem', borderRadius: '8px' }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Sort By Field */}
      {sortBy !== undefined && setSortBy && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowUpDown size={16} style={{ color: 'var(--text-muted)' }} />
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.88rem', borderRadius: '8px' }}
          >
            <option value="createdAt">Date Created</option>
            <option value="name">Name</option>
            <option value="role">Role</option>
            <option value="status">Status</option>
          </select>
          {sortOrder !== undefined && setSortOrder && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              title={`Sorting: ${sortOrder.toUpperCase()}`}
            >
              {sortOrder.toUpperCase()}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
