import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useEventStore } from '../../stores/useEventStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { CalendarEvent } from '../../types';
import { toast } from 'sonner';
import ConfirmDialog from '../common/ConfirmDialog';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EVENT_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#8b5cf6', '#f97316',
];

interface EventModalProps {
  event?: CalendarEvent;
  defaultDate?: string;
  onClose: () => void;
  onSave: (data: Omit<CalendarEvent, 'id'>) => void;
}

function EventModal({ event, defaultDate, onClose, onSave }: EventModalProps) {
  const [title, setTitle] = useState(event?.title ?? '');
  const [date, setDate] = useState(event?.date ?? defaultDate ?? '');
  const [color, setColor] = useState(event?.color ?? EVENT_COLORS[0]);
  const [description, setDescription] = useState(event?.description ?? '');
  const [reminderDays, setReminderDays] = useState(event?.reminderDays ?? 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    onSave({ title: title.trim(), date, color, description: description.trim() || undefined, reminderDays });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{event ? 'Edit Event' : 'Add Event'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="input-group">
              <label className="input-label">Event Title *</label>
              <input
                className="input"
                placeholder="e.g. Birthday, Rent Due, Vacation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
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
              <label className="input-label">Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {EVENT_COLORS.map((c) => (
                  <div
                    key={c}
                    className={`color-swatch ${color === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Description (optional)</label>
              <textarea
                className="input"
                placeholder="Notes about this event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Remind me (days before)</label>
              <select
                className="select"
                value={reminderDays}
                onChange={(e) => setReminderDays(Number(e.target.value))}
              >
                <option value={1}>1 day before</option>
                <option value={3}>3 days before</option>
                <option value={7}>7 days before</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {event ? 'Update' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CalendarWidget() {
  const { events, addEvent, updateEvent, deleteEvent } = useEventStore();
  const { user } = useAuthStore();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ day: string; x: number; y: number } | null>(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { date: string; day: number; isCurrentMonth: boolean }[] = [];

  // Prev month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({ date: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      day: d,
      isCurrentMonth: true,
    });
  }

  // Next month leading days
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    cells.push({ date: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false });
  }

  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const selectedEvents = selectedDay ? (eventsByDate[selectedDay] ?? []) : [];

  return (
    <div className="calendar">
      {/* Calendar Header */}
      <div className="calendar-header">
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={prevMonth}>
            <ChevronLeft size={16} />
          </button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={nextMonth}>
            <ChevronRight size={16} />
          </button>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginLeft: 4 }}
            onClick={() => { setEditingEvent(undefined); setShowEventModal(true); }}
          >
            <Plus size={14} /> Event
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="calendar-grid">
        {DAY_NAMES.map((d) => (
          <div key={d} className="calendar-day-name">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="calendar-grid" style={{ padding: '4px' }}>
        {cells.map((cell, i) => {
          const dayEvents = eventsByDate[cell.date] ?? [];
          const isToday = cell.date === todayStr;
          const isSelected = cell.date === selectedDay;

          return (
            <div
              key={i}
              className={`calendar-day ${isToday ? 'today' : ''} ${!cell.isCurrentMonth ? 'other-month' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
              style={isSelected ? { background: 'var(--bg-hover)', outline: `2px solid var(--color-primary)` } : undefined}
              onClick={() => setSelectedDay(cell.date === selectedDay ? null : cell.date)}
            >
              <span style={{ fontSize: '0.8rem' }}>{cell.day}</span>
              {dayEvents.length > 0 && (
                <div className="event-dots">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div key={ev.id} className="event-dot" style={{ background: ev.color }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day events panel */}
      {selectedDay && (
        <div style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {selectedDay}
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setEditingEvent(undefined); setShowEventModal(true); }}
            >
              <Plus size={12} /> Add
            </button>
          </div>
          {selectedEvents.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No events this day</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selectedEvents.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: 'var(--bg-hover)',
                    borderLeft: `3px solid ${ev.color}`,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{ev.title}</div>
                    {ev.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ev.description}</div>
                    )}
                  </div>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => { setEditingEvent(ev); setShowEventModal(true); }}
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    style={{ color: 'var(--color-danger)' }}
                    onClick={() => setConfirmDelete(ev.id)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showEventModal && (
        <EventModal
          event={editingEvent}
          defaultDate={selectedDay ?? todayStr}
          onClose={() => { setShowEventModal(false); setEditingEvent(undefined); }}
          onSave={async (data) => {
            if (!user) return;
            if (editingEvent) {
              await updateEvent(editingEvent.id, data.title, data.date, data.color, data.description, data.reminderDays);
              toast.success('Event updated');
            } else {
              await addEvent(user.id, data.title, data.date, data.color, data.description, data.reminderDays);
              toast.success('Event added');
            }
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (confirmDelete) {
            await deleteEvent(confirmDelete);
            toast.success('Event deleted');
            setConfirmDelete(null);
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
