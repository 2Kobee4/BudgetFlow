import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';
import { useIncomeStore } from '../../stores/useIncomeStore';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import {
  getAllMonthKeys,
  getMonthlyIncome,
  getMonthlyExpenses,
  getMonthlyBalance,
  getCategoryMonthlyTotal,
} from '../../utils/calculations';
import { formatMonthYear, formatCurrency } from '../../utils/formatters';
import { ChartType, DatasetKey } from '../../types';
import EmptyState from '../../components/common/EmptyState';

const CHART_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#8b5cf6', '#f97316',
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  currency: string;
}

function CustomTooltip({ active, payload, label, currency }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-color)',
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: 'var(--shadow-md)',
    }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{entry.name}:</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatCurrency(entry.value, currency as any)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { incomes } = useIncomeStore();
  const { expenses } = useExpenseStore();
  const { categories } = useCategoryStore();
  const { settings } = useSettingsStore();

  const [chartType, setChartType] = useState<ChartType>('area');
  const [selectedDatasets, setSelectedDatasets] = useState<DatasetKey[]>(['income', 'expenses', 'savings']);

  const monthKeys = useMemo(() => getAllMonthKeys(incomes, expenses), [incomes, expenses]);

  // Build chart data
  const chartData = useMemo(() =>
    monthKeys.map((mk) => {
      const point: Record<string, any> = {
        month: formatMonthYear(`${mk}-01`),
      };
      if (selectedDatasets.includes('income')) {
        point['Income'] = getMonthlyIncome(incomes, mk);
      }
      if (selectedDatasets.includes('expenses')) {
        point['Expenses'] = getMonthlyExpenses(expenses, mk);
      }
      if (selectedDatasets.includes('savings')) {
        point['Savings'] = Math.max(0, getMonthlyBalance(incomes, expenses, mk));
      }
      categories.forEach((cat) => {
        const key: DatasetKey = `category_${cat.id}`;
        if (selectedDatasets.includes(key)) {
          point[cat.name] = getCategoryMonthlyTotal(expenses, cat.id, mk);
        }
      });
      return point;
    }),
  [monthKeys, incomes, expenses, categories, selectedDatasets]);

  // Dataset keys
  const datasetOptions: { key: DatasetKey; label: string; color: string }[] = [
    { key: 'income', label: 'Income', color: '#10b981' },
    { key: 'expenses', label: 'Expenses', color: '#ef4444' },
    { key: 'savings', label: 'Savings', color: '#6366f1' },
    ...categories.map((cat, i) => ({
      key: `category_${cat.id}` as DatasetKey,
      label: cat.name,
      color: cat.color ?? CHART_COLORS[i % CHART_COLORS.length],
    })),
  ];

  const activeDatasets = datasetOptions.filter((d) => selectedDatasets.includes(d.key));

  const toggleDataset = (key: DatasetKey) => {
    setSelectedDatasets((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 20, left: 10, bottom: 0 },
    };

    const axes = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip content={<CustomTooltip currency={settings.currency} />} />
        <Legend
          wrapperStyle={{ paddingTop: 16, fontSize: 12, color: 'var(--text-secondary)' }}
        />
      </>
    );

    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          {axes}
          {activeDatasets.map((ds) => (
            <Line
              key={ds.key}
              type="monotone"
              dataKey={ds.label}
              stroke={ds.color}
              strokeWidth={2.5}
              dot={{ fill: ds.color, r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      );
    }

    if (chartType === 'bar') {
      return (
        <BarChart {...commonProps}>
          {axes}
          {activeDatasets.map((ds) => (
            <Bar
              key={ds.key}
              dataKey={ds.label}
              fill={ds.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </BarChart>
      );
    }

    // Area (default)
    return (
      <AreaChart {...commonProps}>
        <defs>
          {activeDatasets.map((ds) => (
            <linearGradient key={ds.key} id={`grad-${ds.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={ds.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={ds.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {axes}
        {activeDatasets.map((ds) => (
          <Area
            key={ds.key}
            type="monotone"
            dataKey={ds.label}
            stroke={ds.color}
            strokeWidth={2.5}
            fill={`url(#grad-${ds.key})`}
          />
        ))}
      </AreaChart>
    );
  };

  const hasData = incomes.length > 0 || expenses.length > 0;

  // Summary stats
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalSavings = totalIncome - totalExpenses;
  const avgMonthlyIncome = monthKeys.length > 0 ? totalIncome / monthKeys.length : 0;
  const avgMonthlyExpenses = monthKeys.length > 0 ? totalExpenses / monthKeys.length : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Analytics</div>
      </div>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Income', value: totalIncome, color: 'var(--color-success)' },
          { label: 'Total Expenses', value: totalExpenses, color: 'var(--color-danger)' },
          { label: 'Net Savings', value: totalSavings, color: totalSavings >= 0 ? 'var(--color-primary)' : 'var(--color-warning)' },
          { label: `Avg Monthly Expenses`, value: avgMonthlyExpenses, color: 'var(--text-primary)' },
        ].map((tile) => (
          <div key={tile.label} className="stat-card" style={{ padding: 16 }}>
            <div className="stat-card-label">{tile.label}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: tile.color, marginTop: 4 }}>
              {formatCurrency(tile.value, settings.currency)}
            </div>
          </div>
        ))}
      </div>

      {/* Chart Card */}
      <div className="card" style={{ padding: 24 }}>
        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>
            <BarChart3 size={16} color="var(--color-primary)" />
            Spending Trends
          </div>

          {/* Chart Type Toggle */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-input)', padding: 3, borderRadius: 8 }}>
            {([
              { type: 'area', icon: Activity, label: 'Area' },
              { type: 'line', icon: TrendingUp, label: 'Line' },
              { type: 'bar', icon: BarChart3, label: 'Bar' },
            ] as const).map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                className={`btn btn-sm ${chartType === type ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setChartType(type)}
                style={{ padding: '5px 12px' }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Dataset Selectors */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {datasetOptions.map((ds) => {
            const active = selectedDatasets.includes(ds.key);
            return (
              <button
                key={ds.key}
                onClick={() => toggleDataset(ds.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: `1px solid ${active ? ds.color : 'var(--border-color)'}`,
                  background: active ? `${ds.color}1a` : 'transparent',
                  color: active ? ds.color : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: active ? ds.color : 'var(--text-muted)' }} />
                {ds.label}
              </button>
            );
          })}
        </div>

        {/* Chart */}
        {!hasData ? (
          <EmptyState
            icon={BarChart3}
            title="No data yet"
            description="Add income and expenses on the Dashboard to see your trends here."
          />
        ) : activeDatasets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            Select at least one dataset above to display the chart.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={380}>
            {renderChart() as any}
          </ResponsiveContainer>
        )}
      </div>

      {/* Category Breakdown */}
      {categories.length > 0 && (
        <div className="card" style={{ padding: 24, marginTop: 16 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>
            Category Breakdown (All Time)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {categories.map((cat) => {
              const total = expenses
                .filter((e) => e.categoryId === cat.id)
                .reduce((s, e) => s + e.amount, 0);
              const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
              return (
                <div key={cat.id} className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{cat.name}</span>
                    <span style={{ fontSize: '0.8rem', color: cat.color, fontWeight: 700 }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div
                      className="progress-fill"
                      style={{ width: `${pct}%`, background: cat.color }}
                    />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    {formatCurrency(total, settings.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
