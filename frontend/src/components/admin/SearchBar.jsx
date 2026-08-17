import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchBar = ({ searchTerm, setSearchTerm, onSearch, placeholder = "Search by Name, Email, or Phone..." }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch();
  };

  const handleClear = () => {
    setSearchTerm('');
    if (onSearch) onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ flex: '1 1 260px', display: 'flex', gap: '8px' }}>
      <div style={{ position: 'relative', width: '100%' }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }}
        />
        <input
          type="text"
          className="form-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '38px', paddingRight: searchTerm ? '34px' : '12px' }}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>
      <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
        Search
      </button>
    </form>
  );
};

export default SearchBar;
