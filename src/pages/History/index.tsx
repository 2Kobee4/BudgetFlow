import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Search, Filter, Download, FileText, FileSpreadsheet,
  File, ChevronUp, ChevronDown, Edit2, Trash2, X,
  TrendingUp, ShoppingBag, Calendar,
} from 'lucide-react';
import { useIncomeStore } from '../../stores/useIncomeStore';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { HistoryRow } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { exportPdf, exportExcel, exportHistoryJson } from '../../utils/exporters';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import { shortcutHandlers } from '../../hooks/useKeyboardShortcuts';

type SortKey = 'date' | 'amount' | 'title' | 'type';
type SortDir = 'asc' | 'desc';

export default function History() {
  const { incomes, updateIncome, deleteIncome } = useIncomeStore();
  const { expenses, updateExpense, deleteExpense } = useExpenseStore();
  const { categories } = useCategoryStore();
  const { settings } = useSettingsStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: 'income' | 'expense' } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  shortcutHandlers.focusSearch = () => searchRef.current?.focus();

  // Build combined rows
  const allRows: HistoryRow[] = useMemo(() => {
    const incomeRows: HistoryRow[] = incomes.map((i) => ({
      id: i.id,
      date: i.date,
      type: 'income',
      title: i.title,
      amount: i.amount,
      note: i.note,
    }));

    const expenseRows: HistoryRow[] = expenses.map((e) => {
      const cat = categories.find((c) => c.id === e.categoryId);
      return {
        id: e.id,
        date: e.date,
        type: 'expense',
        categoryId: e.categoryId,
        categoryName: cat?.name,
        categoryColor: cat?.color,
        title: e.title,
        amount: e.amount,
        note: e.note,
        recurring: e.recurring,
      };
    });

    return [...incomeRows, ...expenseRows];
  }, [incomes, expenses, categories]);

  // Filter + sort
  const filtered = useMemo(() => {
    let rows = allRows;

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) => r.title.toLowerCase().includes(q) || r.note?.toLowerCase().includes(q) || r.categoryName?.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'all') rows = rows.filter((r) => r.type === typeFilter);
    if (categoryFilter !== 'all') rows = rows.filter((r) => r.categoryId === categoryFilter);
    if (dateFrom) rows = rows.filter((r) => r.date >= dateFrom);
    if (dateTo) rows = rows.filter((r) => r.date <= dateTo);

    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortKey === 'amount') cmp = a.amount - b.amount;
      else if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortKey === 'type') cmp = a.type.localeCompare(b.type);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [allRows, search, typeFilter, categoryFilter, dateFrom, dateTo, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;

  const totalIncome = filtered.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const totalExpenses = filtered.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Transaction History</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
            {' · '}
            <span style={{ color: 'var(--color-success)' }}>+{formatCurrency(totalIncome, settings.currency)}</span>
            {' / '}
            <span style={{ color: 'var(--color-danger)' }}>-{formatCurrency(totalExpenses, settings.currency)}</span>
          </div>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => exportHistoryJson(filtered)}
          >
            <File size={14} /> JSON
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={async () => {
              await exportExcel(filtered, settings.currency);
              toast.success('Exported to Excel');
            }}
          >
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={async () => {
              await exportPdf(filtered, settings.currency);
              toast.success('Exported to PDF');
            }}
          >
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              ref={searchRef}
              placeholder="Search transactions... (Ctrl+F)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setSearch('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            className="select"
            style={{ width: 'auto', paddingRight: 32 }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>

          <select
            className="select"
            style={{ width: 'auto', paddingRight: 32 }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} /> Date Range
          </button>
        </div>

        {showFilters && (
          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="input-label">From</label>
              <input
                className="input"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="input-label">To</label>
              <input
                className="input"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setDateFrom(''); setDateTo(''); }}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No transactions found"
            description="Add income or expenses from the Dashboard, or adjust your filters."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('date')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      Date <SortIcon k="date" />
                    </span>
                  </th>
                  <th onClick={() => toggleSort('type')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      Type <SortIcon k="type" />
                    </span>
                  </th>
                  <th>Category</th>
                  <th onClick={() => toggleSort('title')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      Title <SortIcon k="title" />
                    </span>
                  </th>
                  <th onClick={() => toggleSort('amount')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      Amount <SortIcon k="amount" />
                    </span>
                  </th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={`${row.type}-${row.id}`}>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(row.date)}
                    </td>
                    <td>
                      <span className={`badge ${row.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                        {row.type === 'income' ? <TrendingUp size={9} /> : <ShoppingBag size={9} />}
                        {row.type}
                      </span>
                    </td>
                    <td>
                      {row.categoryName ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: row.categoryColor,
                              flexShrink: 0,
                            }}
                          />
                          {row.categoryName}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 500 }}>{row.title}</td>
                    <td style={{ fontWeight: 700, whiteSpace: 'nowrap', color: row.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {row.type === 'income' ? '+' : '-'}{formatCurrency(row.amount, settings.currency)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.note ?? '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => setConfirmDelete({ id: row.id, type: row.type })}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Transaction"
        message="Delete this transaction? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (confirmDelete) {
            if (confirmDelete.type === 'income') await deleteIncome(confirmDelete.id);
            else await deleteExpense(confirmDelete.id);
            toast.success('Transaction deleted');
            setConfirmDelete(null);
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
