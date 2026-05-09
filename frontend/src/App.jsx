import { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import UploadModal from './components/UploadModal';
import { buildAnalytics, generateSampleData, parseCsvText } from './utils/analytics';

const STORAGE_KEYS = {
  dataset: 'insightFlow_dataset',
  sourceName: 'insightFlow_sourceName',
  settings: 'insightFlow_settings',
  dashboards: 'insightFlow_dashboards',
};

const defaultSettings = {
  profileName: 'InsightFlow User',
  email: 'user@insightflow.app',
  notificationsEnabled: true,
  exportFormat: 'csv',
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [rawRows, setRawRows] = useState(() => {
    const savedDataset = localStorage.getItem(STORAGE_KEYS.dataset);
    return savedDataset ? JSON.parse(savedDataset) : [];
  });
  const [sourceName, setSourceName] = useState(() => localStorage.getItem(STORAGE_KEYS.sourceName) || '');
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.settings);
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });
  const [savedDashboards, setSavedDashboards] = useState(() => {
    const savedDashboardsList = localStorage.getItem(STORAGE_KEYS.dashboards);
    return savedDashboardsList ? JSON.parse(savedDashboardsList) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.dataset, JSON.stringify(rawRows));
    localStorage.setItem(STORAGE_KEYS.sourceName, sourceName);
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    localStorage.setItem(STORAGE_KEYS.dashboards, JSON.stringify(savedDashboards));
  }, [rawRows, sourceName, settings, savedDashboards]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const analytics = useMemo(() => (rawRows.length > 0 ? buildAnalytics(rawRows) : null), [rawRows]);

  const uploadData = analytics
    ? {
        rows: analytics.cleanedRows.length,
        columns: analytics.columns.length,
        preview: analytics.preview,
        columns_list: analytics.columns,
        filename: sourceName || 'dataset.csv',
      }
    : null;

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const handleUploadSuccess = async ({ file }) => {
    setIsLoading(true);
    try {
      const text = await file.text();
      const parsedRows = parseCsvText(text);
      if (parsedRows.length === 0) {
        throw new Error('No valid rows found in CSV');
      }
      setRawRows(parsedRows);
      setSourceName(file.name);
      setActiveTab('dashboard');
      showToast('success', 'Dataset uploaded and analytics generated.');
    } catch {
      showToast('error', 'Upload failed. Please provide a valid CSV file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSampleData = () => {
    const sampleRows = generateSampleData(120);
    setRawRows(sampleRows);
    setSourceName('sample_sales_data.csv');
    setActiveTab('dashboard');
    showToast('success', 'Loaded realistic sample data with 120 rows.');
  };

  const handleExportCsv = () => {
    if (!analytics) {
      showToast('error', 'No dataset to export.');
      return;
    }
    const header = analytics.columns.join(',');
    const rows = analytics.cleanedRows.map((row) =>
      analytics.columns.map((column) => row[column]).join(',')
    );
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `insightflow_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('success', 'CSV report exported.');
  };

  const handleExportPdf = () => {
    window.print();
    showToast('success', 'Use your print dialog to save as PDF.');
  };

  const handleSettingsChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    showToast('success', 'Settings saved.');
  };

  const handleSaveDashboard = () => {
    if (!analytics) {
      showToast('error', 'Load data before saving dashboard.');
      return;
    }
    const snapshot = {
      id: Date.now(),
      name: `Dashboard ${savedDashboards.length + 1}`,
      sourceName: sourceName || 'dataset.csv',
      createdAt: new Date().toLocaleString(),
      rows: analytics.cleanedRows.length,
      totalSales: analytics.kpis.totalSales,
    };
    setSavedDashboards((prev) => [snapshot, ...prev].slice(0, 8));
    showToast('success', 'Dashboard snapshot saved.');
  };

  const handleResetData = () => {
    setRawRows([]);
    setSourceName('');
    setSavedDashboards([]);
    showToast('success', 'All dataset and dashboard snapshots reset.');
  };

  const handleExportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'insightflow_settings.json';
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('success', 'Settings exported.');
  };

  const handleDownloadTemplate = () => {
    const templateHeader = 'Date,Region,Category,Sales,Profit,Orders,Customers';
    const templateRows = [
      '2026-01-05,North,Electronics,4200,730,34,30',
      '2026-01-08,South,Furniture,3100,510,26,22',
      '2026-01-12,West,Fashion,2700,410,24,20',
    ];
    const csvContent = [templateHeader, ...templateRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'insightflow_template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('success', 'CSV template downloaded.');
  };

  const renderSettings = () => (
    <div className="card fade-in">
      <h3 className="card-title">Settings</h3>
      <div className="settings-grid">
        <label className="settings-field">
          Profile Name
          <input
            className="search-input settings-input"
            value={settings.profileName}
            onChange={(event) => handleSettingsChange('profileName', event.target.value)}
          />
        </label>
        <label className="settings-field">
          Email
          <input
            className="search-input settings-input"
            value={settings.email}
            onChange={(event) => handleSettingsChange('email', event.target.value)}
          />
        </label>
        <label className="settings-field">
          Preferred Export
          <select
            className="search-input settings-input"
            value={settings.exportFormat}
            onChange={(event) => handleSettingsChange('exportFormat', event.target.value)}
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
        </label>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(event) => handleSettingsChange('notificationsEnabled', event.target.checked)}
          />
          Enable Notifications
        </label>
      </div>

      <div className="saved-list">
        <h4>Saved Dashboards</h4>
        {savedDashboards.length === 0 ? (
          <p className="page-subtitle">No saved dashboards yet.</p>
        ) : (
          savedDashboards.map((item) => (
            <div key={item.id} className="saved-item">
              <span>{item.name} - {item.sourceName}</span>
              <span>{item.createdAt}</span>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
        <button className="btn btn-outline" onClick={handleSaveDashboard}>Save Dashboard</button>
        <button className="btn btn-secondary" onClick={handleExportSettings}>
          Export Settings JSON
        </button>
        <button className="btn btn-outline" onClick={handleResetData}>Reset Data</button>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="card fade-in">
      <h3 className="card-title">Reports</h3>
      {!analytics ? (
        <p className="page-subtitle">No data loaded. Upload or load sample data to generate reports.</p>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="card kpi-card">
              <div className="kpi-label">Total Sales</div>
              <div className="kpi-value">{analytics.kpis.totalSales.toLocaleString()}</div>
            </div>
            <div className="card kpi-card">
              <div className="kpi-label">Total Profit</div>
              <div className="kpi-value">{analytics.kpis.totalProfit.toLocaleString()}</div>
            </div>
            <div className="card kpi-card">
              <div className="kpi-label">Forecast Summary</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{analytics.forecast.summary}</div>
            </div>
          </div>
          <div className="insights-list">
            {analytics.insights.map((insight) => (
              <div className="insight-item" key={insight}>{insight}</div>
            ))}
          </div>
        </>
      )}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button className="btn btn-primary" onClick={handleExportCsv}>Export CSV Summary</button>
        <button className="btn btn-outline" onClick={handleExportPdf}>Export PDF Summary</button>
      </div>
    </div>
  );

  const renderPage = () => {
    if (isLoading) {
      return (
        <div className="empty-state fade-in" style={{ marginTop: '120px' }}>
          <div className="loader" style={{ width: '44px', height: '44px', borderWidth: '4px', marginBottom: '14px' }} />
          <p>Processing your data...</p>
        </div>
      );
    }

    if (activeTab === 'settings') return renderSettings();
    if (activeTab === 'reports') return renderReports();

    if (['dashboard', 'charts', 'insights', 'predictions'].includes(activeTab)) {
      return (
        <Dashboard
          uploadData={uploadData}
          analysisData={analytics}
          activeTab={activeTab}
        />
      );
    }

    return (
      <div className="card fade-in" style={{ padding: '60px', textAlign: 'center' }}>
        <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)} style={{ marginRight: '12px' }}>
          Upload CSV
        </button>
        <button className="btn btn-outline" onClick={handleLoadSampleData}>
          Load Sample Data
        </button>
      </div>
    );
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="main-content">
        <Navbar 
          onUploadClick={() => setIsUploadModalOpen(true)} 
          onExportClick={handleExportPdf}
          onLoadSampleClick={handleLoadSampleData}
          onSaveDashboardClick={handleSaveDashboard}
          onDownloadTemplateClick={handleDownloadTemplate}
        />
        
        <div className="dashboard-scroll">
          <div className="page-header">
            <div>
              <h1 className="page-title">
                {activeTab === 'dashboard' ? 'Overview Dashboard' : 
                 activeTab === 'upload' ? 'Upload Data' : 
                 activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <p className="page-subtitle">Welcome back! Here's what's happening with your data today.</p>
            </div>
            {uploadData && (
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Current Dataset: <b>{uploadData.filename}</b> ({uploadData.rows} rows)
              </div>
            )}
          </div>

          {renderPage()}
        </div>
      </div>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUploadSuccess={handleUploadSuccess} 
      />
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

export default App;
