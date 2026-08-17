import React, { useState, useEffect } from 'react';
import { X, Lock, Shield, Check, AlertCircle } from 'lucide-react';

export const RolePermissionsModal = ({
  isOpen,
  onClose,
  role = null,
  catalog = [],
  onSavePermissions,
  loading = false
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    if (role) {
      setSelectedPermissions(role.permissions || []);
    } else {
      setSelectedPermissions([]);
    }
  }, [role, isOpen]);

  if (!isOpen || !role) return null;

  // Group permissions by category
  const categories = {};
  catalog.forEach((item) => {
    const cat = item.category || 'General';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(item);
  });

  const handleTogglePermission = (key) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectCategoryAll = (categoryItems) => {
    const keys = categoryItems.map((c) => c.key);
    const allSelected = keys.every((k) => selectedPermissions.includes(k));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((k) => !keys.includes(k)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...keys])));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSavePermissions(role.role_name, selectedPermissions);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: '0',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} color="var(--primary)" />
              <span>Role Permissions: {role.role_name}</span>
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Configure future-ready RBAC permission matrix
            </span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.86rem',
              color: '#0369a1',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>
                Changes made here immediately update effective access rights for all users assigned to the <strong>{role.role_name}</strong> role.
              </span>
            </div>

            {Object.keys(categories).map((catName) => {
              const items = categories[catName];
              const allCatSelected = items.every((item) => selectedPermissions.includes(item.key));

              return (
                <div key={catName} style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  backgroundColor: '#f8fafc'
                }}>
                  <div style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--primary)' }}>
                      {catName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectCategoryAll(items)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {allCatSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                    {items.map((item) => {
                      const isChecked = selectedPermissions.includes(item.key);
                      return (
                        <label
                          key={item.key}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            backgroundColor: isChecked ? '#ffffff' : 'transparent',
                            border: isChecked ? '1px solid var(--primary-light)' : '1px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(item.key)}
                            style={{ marginTop: '2px', cursor: 'pointer' }}
                          />
                          <div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', color: 'var(--text-main)' }}>
                              {item.label}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {item.key}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Selected <strong>{selectedPermissions.length}</strong> permissions
            </span>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RolePermissionsModal;
