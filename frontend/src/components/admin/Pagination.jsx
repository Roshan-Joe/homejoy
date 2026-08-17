import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ page, totalPages, totalItems, limit = 10, onPageChange }) => {
  if (totalPages <= 1 && totalItems <= limit) {
    return (
      <div style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>
        Showing total {totalItems} user{totalItems !== 1 ? 's' : ''}
      </div>
    );
  }

  const startIdx = (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, totalItems);

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      borderTop: '1px solid var(--border-light)',
      fontSize: '0.88rem'
    }}>
      <div style={{ color: 'var(--text-muted)' }}>
        Showing <strong>{totalItems > 0 ? startIdx : 0}</strong> - <strong>{endIdx}</strong> of <strong>{totalItems}</strong> users (10 per page)
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <span style={{ fontWeight: 600, padding: '0 8px', color: 'var(--primary)' }}>
          Page {page} of {totalPages}
        </span>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
