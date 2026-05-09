import { Upload, Download } from 'lucide-react';

const Navbar = ({ onUploadClick, onExportClick, onLoadSampleClick, onSaveDashboardClick, onDownloadTemplateClick }) => {
  return (
    <div className="navbar">
      <div style={{ flex: 1 }}></div>
      <div className="nav-actions">
        <button className="btn btn-secondary" onClick={onLoadSampleClick}>
          Load Sample Data
        </button>
        <button className="btn btn-outline" onClick={onDownloadTemplateClick}>
          Template CSV
        </button>
        <button className="btn btn-outline" onClick={onUploadClick}>
          <Upload size={16} />
          Upload Data
        </button>
        <button className="btn btn-outline" onClick={onSaveDashboardClick}>
          Save Dashboard
        </button>
        <button className="btn btn-primary" onClick={onExportClick}>
          <Download size={16} />
          Export PDF
        </button>
        <div className="avatar">IF</div>
      </div>
    </div>
  );
};

export default Navbar;
