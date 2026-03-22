import { Outlet, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { TrendingUp, Table2, BarChart3, LogOut, Undo2, Redo2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function Layout() {
  const { user, signOut } = useAuth();
  const { canUndo, canRedo, undo, redo } = useData();

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
              <NavLink to="/monthly" className={topNavClass}>
                <Table2 className="w-4 h-4" /> Monthly
              </NavLink>
              <NavLink to="/reports" className={topNavClass}>
                <BarChart3 className="w-4 h-4" /> Reports
              </NavLink>
            </div>
            <div className="flex items-center gap-2">
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
        <div className="grid grid-cols-2">
          <NavLink to="/monthly">
            {({ isActive }) => (
              <div className={`flex flex-col items-center justify-center gap-1 h-16 transition-colors ${
                isActive ? 'text-violet-600' : 'text-gray-400'
              }`}>
                <Table2 className="w-5 h-5" />
                <span className="text-xs font-semibold">Monthly</span>
              </div>
            )}
          </NavLink>
          <NavLink to="/reports">
            {({ isActive }) => (
              <div className={`flex flex-col items-center justify-center gap-1 h-16 transition-colors ${
                isActive ? 'text-violet-600' : 'text-gray-400'
              }`}>
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs font-semibold">Reports</span>
              </div>
            )}
          </NavLink>
        </div>
      </nav>

    </div>
  );
}
