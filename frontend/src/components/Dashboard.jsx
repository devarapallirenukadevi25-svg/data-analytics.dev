import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Database, FileDigit, BarChart2, CheckCircle2, TrendingUp } from 'lucide-react';
import DataTable from './DataTable';

const COLORS = ['#7AB8FF', '#A5D1FF', '#4A90E2', '#8CC1FF', '#CDE4FF', '#2A69AC'];

const Dashboard = ({ uploadData, analysisData, activeTab }) => {
  const [activeChart, setActiveChart] = useState('monthly');

  if (!uploadData || !analysisData) {
    return (
      <div className="empty-state" style={{ marginTop: '100px' }}>
        <Database size={64} style={{ opacity: 0.5 }} />
        <h2>No Data Available</h2>
        <p>Please upload a dataset to view the dashboard and insights.</p>
      </div>
    );
  }

  const { preview, columns_list } = uploadData;
  const { kpis, insights, charts, forecast } = analysisData;

  const chartConfigs = {
    monthly: { title: 'Monthly Sales Trend', data: charts.monthlySales, xKey: 'month', yKey: 'sales' },
    region: { title: 'Revenue by Region', data: charts.regionRevenue, xKey: 'name', yKey: 'value' },
    category: { title: 'Category Distribution', data: charts.categoryDistribution, xKey: 'name', yKey: 'value' },
    profit: { title: 'Profit Analysis', data: charts.profitByRegion, xKey: 'name', yKey: 'value' },
  };

  const activeConfig = chartConfigs[activeChart];

  const chartsSection = (
    <div className="card fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 className="card-title"><BarChart2 size={20} /> {activeConfig.title}</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className={`btn ${activeChart === 'monthly' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveChart('monthly')}>Monthly</button>
          <button className={`btn ${activeChart === 'region' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveChart('region')}>Region</button>
          <button className={`btn ${activeChart === 'category' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveChart('category')}>Category</button>
          <button className={`btn ${activeChart === 'profit' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveChart('profit')}>Profit</button>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          {activeChart === 'category' ? (
            <PieChart>
              <Pie data={activeConfig.data} dataKey={activeConfig.yKey} nameKey={activeConfig.xKey} cx="50%" cy="50%" outerRadius={110}>
                {activeConfig.data.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={activeConfig.data} margin={{ top: 8, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey={activeConfig.xKey} tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey={activeConfig.yKey} fill="var(--primary)" radius={[5, 5, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );

  const insightsSection = (
    <div className="card fade-in">
      <h3 className="card-title"><CheckCircle2 size={20} /> AI Insights</h3>
      <div className="insights-list">
        {insights.map((insight, idx) => (
          <div className="insight-item" key={`${insight}-${idx}`}>
            <CheckCircle2 size={16} className="insight-icon" />
            <div className="insight-text">{insight}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const predictionsSection = (
    <div className="card fade-in">
      <h3 className="card-title"><TrendingUp size={20} /> Sales Forecast</h3>
      {forecast.data.length === 0 ? (
        <p className="page-subtitle">Need at least 3 months of data to forecast.</p>
      ) : (
        <>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast.data} margin={{ top: 8, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#4A90E2" strokeWidth={3} name="Historical Sales" connectNulls />
                <Line type="monotone" dataKey="predicted" stroke="#7AB8FF" strokeWidth={3} strokeDasharray="6 4" name="Predicted Sales" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="page-subtitle" style={{ marginTop: '12px' }}>{forecast.summary}</p>
        </>
      )}
    </div>
  );

  return (
    <div className="dashboard">
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-icon-wrapper"><Database size={24} /></div>
          <div className="kpi-label">Total Sales</div>
          <div className="kpi-value">{kpis.totalSales.toLocaleString()}</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon-wrapper"><FileDigit size={24} /></div>
          <div className="kpi-label">Total Profit</div>
          <div className="kpi-value">{kpis.totalProfit.toLocaleString()}</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: '#10B981' }}><CheckCircle2 size={24} /></div>
          <div className="kpi-label">Orders</div>
          <div className="kpi-value">{kpis.totalOrders.toLocaleString()}</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon-wrapper"><TrendingUp size={24} /></div>
          <div className="kpi-label">Profit Margin</div>
          <div className="kpi-value">{kpis.profitMargin.toFixed(1)}%</div>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div className="charts-grid">
            {chartsSection}
            {insightsSection}
          </div>
          {predictionsSection}
        </>
      )}
      {activeTab === 'charts' && chartsSection}
      {activeTab === 'insights' && insightsSection}
      {activeTab === 'predictions' && predictionsSection}

      <DataTable columns={columns_list} data={preview} />
    </div>
  );
};

export default Dashboard;
