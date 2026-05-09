import { useState, useRef } from 'react';
import { X, UploadCloud, File, CheckCircle } from 'lucide-react';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.name.match(/\.csv$/i)) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a valid CSV file.');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.match(/\.csv$/i)) {
        setError('Please upload a CSV file.');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const data = { file };
      setIsUploading(false);
      onUploadSuccess(data);
      onClose();
      setFile(null);
    } catch (err) {
      setIsUploading(false);
      setError(err.response?.data?.error || 'Failed to upload file.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', marginBottom: '8px' }}>Upload Dataset</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Upload your CSV or Excel file to get started with insights.</p>
        
        {!file ? (
          <div 
            className="upload-area" 
            onDragOver={handleDragOver} 
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <UploadCloud className="upload-icon" />
            <div className="upload-text">Click or drag file to this area to upload</div>
            <div className="upload-hint">Upload a CSV file with Date, Region, Category, Sales, Profit, Orders, Customers.</div>
            <input 
              type="file" 
              className="hidden-input" 
              ref={fileInputRef} 
              onChange={handleFileSelect}
              accept=".csv"
            />
          </div>
        ) : (
          <div className="file-preview">
            <File size={32} color="var(--primary)" />
            <div className="file-info">
              <div className="file-name">{file.name}</div>
              <div className="file-size">{(file.size / 1024).toFixed(2)} KB</div>
            </div>
            <CheckCircle size={24} color="#10B981" />
          </div>
        )}

        {error && <div style={{ color: '#EF4444', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => { setFile(null); onClose(); }} disabled={isUploading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? <div className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div> : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
