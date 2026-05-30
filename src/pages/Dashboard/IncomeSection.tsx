import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { useIncomeStore } from '../../stores/useIncomeStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Income } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getMonthlyIncome } from '../../utils/calculations';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';

interface IncomeModalProps {
  income?: Income;
  onClose: () => void;
  onSave: (data: Omit<Income, 'id'>) => void;
}

function IncomeModal({ income, onClose, onSave }: IncomeModalProps) {
  const [title, setTitle] = useState(income?.title ?? '');
  const [amount, setAmount] = useState(income?.amount?.toString() ?? '');
  const [date, setDate] = useState(income?.date ?? new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(income?.note ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!title.trim() || isNaN(amt) || amt <= 0 || !date) return;
    onSave({ title: title.trim(), amount: amt, date, note: note.trim() || undefined });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{income ? 'Edit Income' : 'Add Income'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="input-group">
              <label className="input-label">Source / Title *</label>
              <input
                className="input"
                placeholder="e.g. Salary, Freelance, Bonus"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>
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
            <div className="input-group">
              <label className="input-label">Notes (optional)</label>
              <textarea
                className="input"
                placeholder="Optional notes..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {income ? 'Update' : 'Add Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface IncomeSectionProps {
  onOpenModal?: (fn: () => void) => void;
}

export default function IncomeSection({ onOpenModal }: IncomeSectionProps) {
  const { incomes, addIncome, updateIncome, deleteIncome } = useIncomeStore();
  const { settings } = useSettingsStore();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Register handler for keyboard shortcut
  useEffect(() => {
    if (onOpenModal) {
      onOpenModal(() => {
        setEditingIncome(undefined);
        setShowModal(true);
      });
    }
  }, [onOpenModal]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthIncomes = incomes
    .filter((i) => i.date.startsWith(currentMonth))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="section-title">
          <TrendingUp size={16} color="var(--color-success)" />
          Income Sources
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setEditingIncome(undefined); setShowModal(true); }}
          title="Add Income (Ctrl+Shift+N)"
        >
          <Plus size={14} /> Add Income
        </button>
      </div>

      {currentMonthIncomes.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No income this month"
          description="Add your salary, freelance work, or any other income source to get started."
          action={{ label: 'Add Income', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {currentMonthIncomes.map((income) => (
            <div
              key={income.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--color-success-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <TrendingUp size={16} color="var(--color-success)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {income.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formatDate(income.date)}
                  {income.note && ` · ${income.note}`}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-success)', whiteSpace: 'nowrap' }}>
                +{formatCurrency(income.amount, settings.currency)}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => { setEditingIncome(income); setShowModal(true); }}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  style={{ color: 'var(--color-danger)' }}
                  onClick={() => setConfirmDelete(income.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <IncomeModal
          income={editingIncome}
          onClose={() => { setShowModal(false); setEditingIncome(undefined); }}
          onSave={async (data) => {
            if (!user) return;
            if (editingIncome) {
              await updateIncome(editingIncome.id, data.title, data.amount, data.date, data.note);
              toast.success('Income updated');
            } else {
              await addIncome(user.id, data.title, data.amount, data.date, data.note);
              toast.success('Income added!');
            }
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Income"
        message="Are you sure you want to delete this income entry? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (confirmDelete) {
            await deleteIncome(confirmDelete);
            toast.success('Income deleted');
            setConfirmDelete(null);
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
