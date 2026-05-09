import { LayoutDashboard, UploadCloud, Lightbulb, PieChart, TrendingUp, FileText, Settings } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'upload', label: 'Upload Data', icon: <UploadCloud size={20} /> },
    { id: 'insights', label: 'AI Insights', icon: <Lightbulb size={20} /> },
    { id: 'charts', label: 'Charts', icon: <PieChart size={20} /> },
    { id: 'predictions', label: 'Predictions', icon: <TrendingUp size={20} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <TrendingUp size={20} />
        </div>
        InsightFlow
      </div>
      <div className="sidebar-nav">
        {navItems.map((item) => (
          <a
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
