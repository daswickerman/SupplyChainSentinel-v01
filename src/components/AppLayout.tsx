import * as React from 'react';
import { Shield, LayoutDashboard, Factory, MapPin, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AppLayout({ children, activeTab, setActiveTab }: LayoutProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'manufacturers', label: 'Manufacturers', icon: Factory },
    { id: 'locations', label: 'Supply Chain', icon: MapPin },
    { id: 'risks', label: 'Risk Analysis', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-bottom border-gray-100">
          <div className="p-2 bg-black rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-sans font-bold text-xl tracking-tight text-gray-900">Sentinel</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === item.id
                  ? "bg-black text-white shadow-lg shadow-black/10"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-100">
          <div className="p-4 bg-gray-50 rounded-2xl">
            <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-900">Operational</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h2 className="text-2xl font-sans font-bold text-gray-900 capitalize">
            {activeTab.replace('-', ' ')}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">SupplyChain Sentinel</p>
              <p className="text-xs text-gray-500">v1.0.0</p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
