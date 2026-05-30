# BudgetFlow 💰

A modern, production-ready personal finance and salary management desktop application built with **Tauri v2**, **React**, **TypeScript**, and **TailwindCSS**.

![BudgetFlow Dashboard](./docs/preview.png)

---

## ✨ Features

- **📊 Dashboard** — Income cards, remaining budget, monthly savings, category expense grid
- **📅 Calendar** — Event-driven calendar with colored event dots, add/edit/delete events
- **📜 History** — Full transaction table with search, sort, filter, and export (PDF/Excel/JSON)
- **📈 Analytics** — Dynamic Recharts graphs — Line, Bar, Area — with multi-dataset comparison
- **🎯 Savings Goals** — Track progress toward financial milestones with deadlines and estimated completion
- **🔔 Notifications** — Native OS reminders for upcoming events
- **🎨 6 Themes** — Dark, Light, Midnight, Ocean, Emerald, Sunset — all fully customizable
- **💾 Local Storage** — All data stored in JSON files on your PC. No cloud, no database, no auth.

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| [Node.js](https://nodejs.org/) | 18+ |
| [Rust](https://rustup.rs/) | stable |
| [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) | (Windows) |

> **Note:** If you don't have Rust, run:
> ```powershell
> winget install Rustlang.Rustup
> ```

### Install & Run

```bash
# 1. Clone / open the project
cd BudgetFlow

# 2. Install frontend dependencies
npm install

# 3. Start in development mode
npm run tauri dev
```

### Production Build

```bash
npm run tauri build
```

The compiled `.exe` installer will be in `src-tauri/target/release/bundle/`.

---

## 🗂️ Project Structure

```
BudgetFlow/
├── src/
│   ├── types/         # TypeScript interfaces (Income, Expense, Category, etc.)
│   ├── stores/        # Zustand state stores (6 domains, auto-persist to JSON)
│   ├── services/      # Storage layer (Tauri FS API wrappers)
│   ├── hooks/         # useNotifications, useKeyboardShortcuts
│   ├── utils/         # formatters, calculations, exporters
│   ├── components/
│   │   ├── layout/    # AppShell, Sidebar, Header
│   │   ├── common/    # ConfirmDialog, EmptyState
│   │   └── calendar/  # CalendarWidget
│   ├── pages/
│   │   ├── Dashboard/ # Income, Expenses, Stat Cards, Calendar
│   │   ├── History/   # Transaction table + exports
│   │   ├── Analytics/ # Recharts dashboard
│   │   ├── SavingsGoals/
│   │   └── Settings/
│   ├── App.tsx        # Root component, router, theme application
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles + all 6 themes as CSS variables
│
└── src-tauri/
    ├── src/lib.rs     # Tauri plugins registration
    ├── Cargo.toml     # Rust dependencies
    └── tauri.conf.json # App config (name, window, FS permissions)
```

---

## 🎨 Themes

Switch themes in **Settings → Appearance**. Available themes:

| Theme | Primary Color |
|-------|-------------|
| 🌑 Dark | Indigo (#6366f1) |
| ☀️ Light | Indigo (#6366f1) |
| 🌌 Midnight | Purple (#7c3aed) |
| 🌊 Ocean | Sky Blue (#0ea5e9) |
| 🌿 Emerald | Green (#10b981) |
| 🌅 Sunset | Orange (#f97316) |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | Add Expense |
| `Ctrl + Shift + N` | Add Income |
| `Ctrl + F` | Focus Search (History page) |
| `Ctrl + S` | Export Backup (JSON) |

---

## 💾 Data Storage

All data is stored locally in your app's data directory under `/data/`:

```
%LOCALAPPDATA%\com.budgetflow.app\data\
├── incomes.json
├── expenses.json
├── categories.json
├── goals.json
├── events.json
└── settings.json
```

Data is **auto-saved** after every change. Use **Settings → Export Backup** to create a full JSON backup at any time.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop Shell | Tauri v2 |
| UI Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | TailwindCSS v4 |
| State Management | Zustand |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | Tauri Plugin Notification |
| File System | Tauri Plugin FS |
| Toast | Sonner |
| Export | jsPDF + jspdf-autotable + xlsx |

---

## 📄 License

MIT — Use freely for personal and commercial projects.
