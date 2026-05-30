import React, { useState } from 'react';
import {
  Plus, X, Edit2, Trash2, ShoppingBag, Tag,
  RefreshCw, Search,
} from 'lucide-react';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Expense, Category } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getCategoryMonthlyTotal } from '../../utils/calculations';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';

// ─── Category Colors ──────────────────────────────────────────────────────────
const PALETTE = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4',
  '#ec4899', '#8b5cf6', '#f97316', '#14b8a6', '#a855f7',
];

// ─── Category Modal ───────────────────────────────────────────────────────────
interface CategoryModalProps {
  category?: Category;
  onClose: () => void;
  onSave: (data: Omit<Category, 'id'>) => void;
}

function CategoryModal({ category, onClose, onSave }: CategoryModalProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? PALETTE[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{category ? 'Edit Category' : 'New Category'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="input-group">
              <label className="input-label">Category Name *</label>
              <input
                className="input"
                placeholder="e.g. Food, Transport, Gym"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PALETTE.map((c) => (
                  <div
                    key={c}
                    className={`color-swatch ${color === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {category ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Expense Modal ────────────────────────────────────────────────────────────
interface ExpenseModalProps {
  expense?: Expense;
  onClose: () => void;
  onSave: (data: Omit<Expense, 'id'>) => void;
}

function ExpenseModal({ expense, onClose, onSave }: ExpenseModalProps) {
  const { categories } = useCategoryStore();
  const [title, setTitle] = useState(expense?.title ?? '');
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? '');
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? categories[0]?.id ?? '');
  const [date, setDate] = useState(expense?.date ?? new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(expense?.note ?? '');
  const [recurring, setRecurring] = useState(expense?.recurring ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!title.trim() || isNaN(amt) || amt <= 0 || !categoryId || !date) return;
    onSave({ title: title.trim(), amount: amt, categoryId, date, note: note.trim() || undefined, recurring });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{expense ? 'Edit Expense' : 'Add Expense'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {categories.length === 0 && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'var(--color-warning-bg)',
                color: 'var(--color-warning)',
                fontSize: '0.8rem',
                marginBottom: 16,
              }}>
                ⚠️ Create at least one category before adding expenses.
              </div>
            )}
            <div className="input-group">
              <label className="input-label">Title *</label>
              <input
                className="input"
                placeholder="e.g. Groceries, Netflix, Bus ticket"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Amount *</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="0.000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Date *</label>
                <input
                  className="input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Category *</label>
              <select
                className="select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                disabled={categories.length === 0}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Notes (optional)</label>
              <textarea
                className="input"
                placeholder="Optional notes..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                />
                <span className="toggle-track" />
              </label>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Recurring expense
              </span>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={categories.length === 0}>
              {expense ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface ExpenseSectionProps {
  onOpenModal?: (fn: () => void) => void;
}

export default function ExpenseSection({ onOpenModal }: ExpenseSectionProps) {
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenseStore();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const { settings } = useSettingsStore();
  const { user } = useAuthStore();

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [confirmDeleteExpense, setConfirmDeleteExpense] = useState<string | null>(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Register shortcut handler
  React.useEffect(() => {
    if (onOpenModal) {
      onOpenModal(() => {
        setEditingExpense(undefined);
        setShowExpenseModal(true);
      });
    }
  }, [onOpenModal]);

  const currentExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
  const filteredExpenses = currentExpenses
    .filter((e) => {
      const matchCat = selectedCategory ? e.categoryId === selectedCategory : true;
      const matchSearch = search
        ? e.title.toLowerCase().includes(search.toLowerCase())
        : true;
      return matchCat && matchSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="section-title">
          <ShoppingBag size={16} color="var(--color-danger)" />
          Expenses
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setEditingCategory(undefined); setShowCategoryModal(true); }}
          >
            <Tag size={14} /> Category
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { setEditingExpense(undefined); setShowExpenseModal(true); }}
            title="Add Expense (Ctrl+N)"
          >
            <Plus size={14} /> Expense
          </button>
        </div>
      </div>

      {/* Category Cards */}
      <div className="category-grid" style={{ marginBottom: 16 }}>
        {/* Add category card */}
        <div
          className="category-card category-add-card"
          onClick={() => { setEditingCategory(undefined); setShowCategoryModal(true); }}
        >
          <Plus size={22} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>New Category</span>
        </div>

        {categories.map((cat) => {
          const total = getCategoryMonthlyTotal(expenses, cat.id, currentMonth);
          const isSelected = selectedCategory === cat.id;
          return (
            <div
              key={cat.id}
              className="category-card"
              style={{
                borderTop: `3px solid ${cat.color}`,
                cursor: 'pointer',
                outline: isSelected ? `2px solid ${cat.color}` : undefined,
              }}
              onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${cat.color}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Tag size={14} style={{ color: cat.color }} />
                </div>
                <div style={{ display: 'flex', gap: 2 }} onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-ghost btn-icon"
                    style={{ padding: 4 }}
                    onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); }}
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    className="btn btn-ghost btn-icon"
                    style={{ padding: 4, color: 'var(--color-danger)' }}
                    onClick={() => setConfirmDeleteCategory(cat.id)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                {cat.name}
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: cat.color }}>
                {formatCurrency(total, settings.currency)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                this month
              </div>
            </div>
          );
        })}
      </div>

      {/* Expense list */}
      {categories.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div className="search-bar" style={{ flex: 1 }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {selectedCategory && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedCategory(null)}
              >
                <X size={12} /> Clear filter
              </button>
            )}
          </div>

          {filteredExpenses.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No expenses found"
              description={selectedCategory ? 'No expenses in this category this month.' : 'Add your first expense to start tracking your spending.'}
              action={{ label: 'Add Expense', onClick: () => setShowExpenseModal(true) }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredExpenses.map((expense) => {
                const cat = categories.find((c) => c.id === expense.categoryId);
                return (
                  <div
                    key={expense.id}
                    className="card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 14px',
                      gap: 12,
                      borderLeft: cat ? `3px solid ${cat.color}` : undefined,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {expense.title}
                        </span>
                        {expense.recurring && (
                          <span className="badge badge-primary" style={{ fontSize: '0.6rem' }}>
                            <RefreshCw size={8} /> Recurring
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatDate(expense.date)}
                        {cat && <span style={{ color: cat.color, marginLeft: 6 }}>• {cat.name}</span>}
                        {expense.note && <span> · {expense.note}</span>}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-danger)', whiteSpace: 'nowrap' }}>
                      -{formatCurrency(expense.amount, settings.currency)}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => { setEditingExpense(expense); setShowExpenseModal(true); }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => setConfirmDeleteExpense(expense.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showExpenseModal && (
        <ExpenseModal
          expense={editingExpense}
          onClose={() => { setShowExpenseModal(false); setEditingExpense(undefined); }}
          onSave={async (data) => {
            if (!user) return;
            if (editingExpense) {
              await updateExpense(editingExpense.id, data.title, data.amount, data.categoryId, data.date, data.note, data.recurring);
              toast.success('Expense updated');
            } else {
              await addExpense(user.id, data.title, data.amount, data.categoryId, data.date, data.note, data.recurring);
              toast.success('Expense added!');
            }
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => { setShowCategoryModal(false); setEditingCategory(undefined); }}
          onSave={async (data) => {
            if (!user) return;
            if (editingCategory) {
              await updateCategory(editingCategory.id, data.name, data.color);
              toast.success('Category updated');
            } else {
              await addCategory(user.id, data.name, data.color);
              toast.success('Category created!');
            }
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDeleteExpense}
        title="Delete Expense"
        message="Delete this expense? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (confirmDeleteExpense) {
            await deleteExpense(confirmDeleteExpense);
            toast.success('Expense deleted');
            setConfirmDeleteExpense(null);
          }
        }}
        onCancel={() => setConfirmDeleteExpense(null)}
      />

      <ConfirmDialog
        open={!!confirmDeleteCategory}
        title="Delete Category"
        message="Delete this category? All expenses in this category will lose their category association."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (confirmDeleteCategory) {
            await deleteCategory(confirmDeleteCategory);
            toast.success('Category deleted');
            setConfirmDeleteCategory(null);
          }
        }}
        onCancel={() => setConfirmDeleteCategory(null)}
      />
    </div>
  );
}
