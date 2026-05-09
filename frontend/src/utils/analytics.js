const REQUIRED_COLUMNS = ['Date', 'Region', 'Category', 'Sales', 'Profit', 'Orders', 'Customers'];

const REGIONS = ['North', 'South', 'East', 'West', 'Central'];
const CATEGORIES = ['Electronics', 'Furniture', 'Fashion', 'Food', 'Office Supplies'];

const toNumber = (value) => {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const toMonthKey = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const parseCsvText = (text) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim());
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });
};

export const generateSampleData = (rowsCount = 120) => {
  const rows = [];
  const startDate = new Date('2024-01-01');

  for (let i = 0; i < rowsCount; i += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i * 3);

    const region = REGIONS[i % REGIONS.length];
    const category = CATEGORIES[i % CATEGORIES.length];
    const seasonalMultiplier = 1 + ((date.getMonth() % 4) * 0.08);
    const baseline = 1500 + (i % 15) * 95;
    const sales = Math.round(baseline * seasonalMultiplier + ((i * 37) % 240));
    const profit = Math.round(sales * (0.13 + ((i % 7) * 0.01)));
    const orders = 18 + (i % 20);
    const customers = Math.max(orders - (i % 6), 10);

    rows.push({
      Date: date.toISOString().split('T')[0],
      Region: region,
      Category: category,
      Sales: sales,
      Profit: profit,
      Orders: orders,
      Customers: customers,
    });
  }

  return rows;
};

const groupSum = (data, groupBy, valueKey) => {
  const grouped = data.reduce((acc, row) => {
    const key = row[groupBy] || 'Unknown';
    acc[key] = (acc[key] || 0) + toNumber(row[valueKey]);
    return acc;
  }, {});

  return Object.entries(grouped).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2)),
  }));
};

const buildForecast = (monthlySales) => {
  if (monthlySales.length < 3) return { summary: 'Not enough monthly history for forecast.', data: [] };

  const history = [...monthlySales];
  const predicted = [];

  for (let i = 0; i < 3; i += 1) {
    const lastThree = history.slice(-3).map((item) => item.sales);
    const nextValue = Math.round(lastThree.reduce((sum, value) => sum + value, 0) / lastThree.length);
    const [year, month] = history[history.length - 1].month.split('-').map(Number);
    const nextDate = new Date(year, month - 1 + 1, 1);
    nextDate.setMonth(nextDate.getMonth() + i);
    const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    const item = { month: nextMonth, sales: 0, predicted: nextValue };
    predicted.push(item);
    history.push({ month: nextMonth, sales: nextValue });
  }

  const merged = monthlySales.map((item) => ({
    month: item.month,
    sales: item.sales,
    predicted: null,
  })).concat(predicted);

  const growth = ((predicted[predicted.length - 1].predicted - monthlySales[monthlySales.length - 1].sales) / Math.max(monthlySales[monthlySales.length - 1].sales, 1)) * 100;

  return {
    data: merged,
    summary: `Projected 3-month sales trend is ${growth >= 0 ? 'up' : 'down'} ${Math.abs(growth).toFixed(1)}%.`,
  };
};

export const buildAnalytics = (rawRows) => {
  const validRows = (rawRows || []).map((row) => ({
    Date: row.Date || row.date || '',
    Region: row.Region || row.region || 'Unknown',
    Category: row.Category || row.category || 'Unknown',
    Sales: toNumber(row.Sales ?? row.sales),
    Profit: toNumber(row.Profit ?? row.profit),
    Orders: toNumber(row.Orders ?? row.orders),
    Customers: toNumber(row.Customers ?? row.customers),
  }));

  const totalSales = validRows.reduce((sum, row) => sum + row.Sales, 0);
  const totalProfit = validRows.reduce((sum, row) => sum + row.Profit, 0);
  const totalOrders = validRows.reduce((sum, row) => sum + row.Orders, 0);
  const totalCustomers = validRows.reduce((sum, row) => sum + row.Customers, 0);

  const monthlyMap = validRows.reduce((acc, row) => {
    const month = toMonthKey(row.Date);
    if (!acc[month]) acc[month] = 0;
    acc[month] += row.Sales;
    return acc;
  }, {});

  const monthlySales = Object.entries(monthlyMap)
    .map(([month, sales]) => ({ month, sales: Number(sales.toFixed(2)) }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const regionRevenue = groupSum(validRows, 'Region', 'Sales');
  const categoryDistribution = groupSum(validRows, 'Category', 'Sales');
  const profitByRegion = groupSum(validRows, 'Region', 'Profit');
  const forecast = buildForecast(monthlySales);

  const topRegion = [...regionRevenue].sort((a, b) => b.value - a.value)[0];
  const lowRegion = [...regionRevenue].sort((a, b) => a.value - b.value)[0];
  const topCategory = [...categoryDistribution].sort((a, b) => b.value - a.value)[0];
  const growth = monthlySales.length > 1
    ? ((monthlySales[monthlySales.length - 1].sales - monthlySales[0].sales) / Math.max(monthlySales[0].sales, 1)) * 100
    : 0;

  return {
    cleanedRows: validRows,
    columns: REQUIRED_COLUMNS,
    preview: validRows.slice(0, 40),
    kpis: {
      totalSales,
      totalProfit,
      totalOrders,
      totalCustomers,
      avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
      profitMargin: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0,
    },
    charts: {
      monthlySales,
      regionRevenue,
      categoryDistribution,
      profitByRegion,
    },
    insights: [
      `Highest sales region: ${topRegion?.name || 'N/A'} (${(topRegion?.value || 0).toLocaleString()}).`,
      `Best performing category: ${topCategory?.name || 'N/A'} (${(topCategory?.value || 0).toLocaleString()}).`,
      `Overall monthly sales growth: ${growth.toFixed(1)}% across available history.`,
      `Low-performing area: ${lowRegion?.name || 'N/A'} needs attention.`,
    ],
    forecast,
  };
};
