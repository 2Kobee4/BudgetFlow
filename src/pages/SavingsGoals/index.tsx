import React, { useState } from 'react';
import { Plus, X, Edit2, Trash2, Target, Calendar, TrendingUp, PiggyBank } from 'lucide-react';
import { useGoalStore } from '../../stores/useGoalStore';
import { useIncomeStore } from '../../stores/useIncomeStore';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { SavingsGoal } from '../../types';
import { formatCurrency, formatDate, getDaysUntil } from '../../utils/formatters';
import { getCompletionPercentage, estimateCompletionMonths } from '../../utils/calculations';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';

const GOAL_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#8b5cf6', '#f97316',
];

interface GoalModalProps {
  goal?: SavingsGoal;
  onClose: () => void;
  onSave: (data: Omit<SavingsGoal, 'id'>) => void;
}

function GoalModal({ goal, onClose, onSave }: GoalModalProps) {
  const [title, setTitle] = useState(goal?.title ?? '');
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount?.toString() ?? '');
  const [currentAmount, setCurrentAmount] = useState(goal?.currentAmount?.toString() ?? '0');
  const [deadline, setDeadline] = useState(goal?.deadline ?? '');
  const [color, setColor] = useState(goal?.color ?? GOAL_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount);
    if (!title.trim() || isNaN(target) || target <= 0) return;
    onSave({
      title: title.trim(),
      targetAmount: target,
      currentAmount: Math.max(0, isNaN(current) ? 0 : current),
      deadline: deadline || undefined,
      color,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{goal ? 'Edit Goal' : 'New Savings Goal'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="input-group">
              <label className="input-label">Goal Title *</label>
              <input
                className="input"
                placeholder="e.g. Gaming PC, Vacation, New Car"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Target Amount *</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="0.000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Current Amount</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="0.000"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Deadline (optional)</label>
              <input
                className="input"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {GOAL_COLORS.map((c) => (
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
              {goal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DepositModalProps {
  goal: SavingsGoal;
  currency: string;
  onClose: () => void;
  onDeposit: (amount: number) => void;
}

function DepositModal({ goal, currency, onClose, onDeposit }: DepositModalProps) {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    onDeposit(amt);
    onClose();
  };

  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Add to "{goal.title}"</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'var(--bg-hover)',
              marginBottom: 16,
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
            }}>
              Remaining: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(remaining, currency as any)}</strong>
            </div>
            <div className="input-group">
              <label className="input-label">Amount to Add</label>
              <input
                className="input"
                type="number"
                min="0.001"
                step="0.001"
                placeholder="0.000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Funds</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SavingsGoals() {
  const { goals, addGoal, updateGoal, deleteGoal, deposit } = useGoalStore();
  const { incomes } = useIncomeStore();
  const { expenses } = useExpenseStore();
  const { settings } = useSettingsStore();
  const { user } = useAuthStore();

  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | undefined>(undefined);
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const completedGoals = goals.filter((g) => g.currentAmount >= g.targetAmount).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Savings Goals</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {completedGoals}/{goals.length} completed
            {' · '}
            Total saved: <span style={{ color: 'var(--color-success)' }}>{formatCurrency(totalSaved, settings.currency)}</span>
            {' / '}
            {formatCurrency(totalTarget, settings.currency)}
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setEditingGoal(undefined); setShowModal(true); }}
        >
          <Plus size={16} /> New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No savings goals yet"
          description="Create your first savings goal to track your progress toward big purchases, vacations, or any financial milestone."
          action={{ label: 'Create Goal', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {goals.map((goal) => {
            const pct = getCompletionPercentage(goal.currentAmount, goal.targetAmount);
            const remaining = goal.targetAmount - goal.currentAmount;
            const done = goal.currentAmount >= goal.targetAmount;
            const daysLeft = goal.deadline ? getDaysUntil(goal.deadline) : null;
            const estimatedMonths = !done
              ? estimateCompletionMonths(remaining, incomes, expenses)
              : null;

            return (
              <div
                key={goal.id}
                className="card"
                style={{
                  padding: 20,
                  borderTop: `3px solid ${goal.color ?? '#6366f1'}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {done && (
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'var(--color-success)',
                    color: 'white',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}>
                    ✓ COMPLETE
                  </div>
                )}

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {goal.title}
                    </div>
                    {goal.deadline && (
                      <div style={{ fontSize: '0.75rem', color: daysLeft !== null && daysLeft < 30 ? 'var(--color-warning)' : 'var(--text-muted)', marginTop: 2 }}>
                        <Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />
                        {daysLeft !== null && daysLeft < 0
                          ? 'Deadline passed'
                          : daysLeft !== null && daysLeft === 0
                            ? 'Due today!'
                            : `${daysLeft} days left`}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => { setEditingGoal(goal); setShowModal(true); }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: 'var(--color-danger)' }}
                      onClick={() => setConfirmDelete(goal.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: goal.color ?? '#6366f1' }}>
                      {formatCurrency(goal.currentAmount, settings.currency)}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      of {formatCurrency(goal.targetAmount, settings.currency)}
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 10 }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${pct}%`,
                        background: done ? 'var(--color-success)' : goal.color ?? 'var(--color-primary)',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {pct}% complete
                    </span>
                    {!done && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatCurrency(remaining, settings.currency)} remaining
                      </span>
                    )}
                  </div>
                </div>

                {/* Estimated completion */}
                {!done && estimatedMonths !== null && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    padding: '6px 10px',
                    background: 'var(--bg-hover)',
                    borderRadius: 6,
                    marginBottom: 12,
                  }}>
                    <TrendingUp size={11} style={{ display: 'inline', marginRight: 4, color: 'var(--color-primary)' }} />
                    Estimated: ~{estimatedMonths} month{estimatedMonths !== 1 ? 's' : ''} at current savings rate
                  </div>
                )}

                {/* Add Funds Button */}
                {!done && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setDepositGoal(goal)}
                  >
                    <PiggyBank size={14} /> Add Funds
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <GoalModal
          goal={editingGoal}
          onClose={() => { setShowModal(false); setEditingGoal(undefined); }}
          onSave={async (data) => {
            if (!user) return;
            if (editingGoal) {
              await updateGoal(editingGoal.id, data.title, data.targetAmount, data.currentAmount, data.deadline, data.color);
              toast.success('Goal updated');
            } else {
              await addGoal(user.id, data.title, data.targetAmount, data.currentAmount, data.deadline, data.color);
              toast.success('Goal created!');
            }
          }}
        />
      )}

      {depositGoal && (
        <DepositModal
          goal={depositGoal}
          currency={settings.currency}
          onClose={() => setDepositGoal(null)}
          onDeposit={async (amount) => {
            await deposit(depositGoal.id, amount);
            toast.success(`Added ${formatCurrency(amount, settings.currency)} to "${depositGoal.title}"`);
            setDepositGoal(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Goal"
        message="Are you sure you want to delete this savings goal?"
        confirmLabel="Delete"
        onConfirm={async () => {
          if (confirmDelete) {
            await deleteGoal(confirmDelete);
            toast.success('Goal deleted');
            setConfirmDelete(null);
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
