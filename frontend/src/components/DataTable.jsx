import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DataTable = ({ columns, data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  
  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  if (!data || data.length === 0) {
    return <div className="empty-state">No data available. Upload a dataset to view.</div>;
  }

  return (
    <div className="card">
      <div className="table-controls">
        <h3 className="card-title" style={{ marginBottom: 0 }}>Data Preview</h3>
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search in table..." 
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      
      <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex}>{row[col]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
        </span>
        <button 
          className="pagination-btn" 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>{currentPage} / {totalPages || 1}</span>
        <button 
          className="pagination-btn" 
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default DataTable;
