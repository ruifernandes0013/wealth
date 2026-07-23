import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TrendingUp, Table2, BarChart3, GitCompare, LogOut, Undo2, Redo2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function Layout() {
  const { user, signOut } = useAuth();
  const { canUndo, canRedo, undo, redo, reload, pendingYear, discardPendingYear } = useData();
  const navigate = useNavigate();
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const guardedNav = (to: string) => (e: React.MouseEvent) => {
    if (pendingYear !== null) {
      e.preventDefault();
      setPendingNav(to);
    }
  };

  const topNavClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Mobile top header ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-200 safe-area-top">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-base">Wealth</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={reload}
              title="Reload data"
              className="p-2 rounded-lg transition-colors text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
              className="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
              className="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              onClick={signOut}
              className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Desktop top navbar ── */}
      <nav className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-lg">Wealth Manager</span>
            </div>
            <div className="flex items-center gap-1">
              <NavLink to="/monthly" className={topNavClass} onClick={guardedNav('/monthly')}>
                <Table2 className="w-4 h-4" /> Monthly
              </NavLink>
              <NavLink to="/reports" className={topNavClass} onClick={guardedNav('/reports')}>
                <BarChart3 className="w-4 h-4" /> Reports
              </NavLink>
              <NavLink to="/compare" className={topNavClass} onClick={guardedNav('/compare')}>
                <GitCompare className="w-4 h-4" /> Compare
              </NavLink>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={reload}
                title="Reload data"
                className="p-2 rounded-lg transition-colors text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                className="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-400 hidden sm:block ml-1">{user?.email}</span>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Page content ── */}
      <main className="pt-14 pb-24 md:pt-0 md:pb-0">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid grid-cols-3">
          <NavLink to="/monthly" onClick={guardedNav('/monthly')}>
            {({ isActive }) => (
              <div className={`flex flex-col items-center justify-center gap-1 h-16 transition-colors ${
                isActive ? 'text-violet-600' : 'text-gray-400'
              }`}>
                <Table2 className="w-5 h-5" />
                <span className="text-xs font-semibold">Monthly</span>
              </div>
            )}
          </NavLink>
          <NavLink to="/reports" onClick={guardedNav('/reports')}>
            {({ isActive }) => (
              <div className={`flex flex-col items-center justify-center gap-1 h-16 transition-colors ${
                isActive ? 'text-violet-600' : 'text-gray-400'
              }`}>
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs font-semibold">Reports</span>
              </div>
            )}
          </NavLink>
          <NavLink to="/compare" onClick={guardedNav('/compare')}>
            {({ isActive }) => (
              <div className={`flex flex-col items-center justify-center gap-1 h-16 transition-colors ${isActive ? 'text-violet-600' : 'text-gray-400'}`}>
                <GitCompare className="w-5 h-5" />
                <span className="text-xs font-semibold">Compare</span>
              </div>
            )}
          </NavLink>
        </div>
      </nav>

      {pendingNav !== null && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" />
          <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-80">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Discard new year?</h3>
            <p className="text-sm text-gray-500 mb-5">Year {pendingYear} has no data yet. If you leave, it will be deleted.</p>
            <div className="flex gap-2">
              <button onClick={() => setPendingNav(null)} className="flex-1 py-2 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">Stay</button>
              <button onClick={async () => { await discardPendingYear(); const dest = pendingNav; setPendingNav(null); navigate(dest); }} className="flex-1 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">Discard & Leave</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
