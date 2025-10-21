import { Factory } from "lucide-react";
import { Link } from "wouter";

interface AppHeaderProps {
  isConnected: boolean;
}

export function AppHeader({ isConnected }: AppHeaderProps) {
  return (
    <header className="bg-white shadow-md border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Factory className="h-8 w-8 text-[#1976d2]" />
              <h1 className="text-2xl font-bold text-[#1976d2]">Aether MES</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link href="/dashboard">
                <span className="text-[#1976d2] font-medium border-b-2 border-[#1976d2] pb-1">
                  Dashboard
                </span>
              </Link>
              <Link href="/machine-operations">
                <span className="text-gray-600 hover:text-[#1976d2] transition-colors">
                  Production
                </span>
              </Link>
              <Link href="/quality-control">
                <span className="text-gray-600 hover:text-[#1976d2] transition-colors">
                  Quality
                </span>
              </Link>
              <Link href="/inventory">
                <span className="text-gray-600 hover:text-[#1976d2] transition-colors">
                  Inventory
                </span>
              </Link>
              <Link href="/production-planning">
                <span className="text-gray-600 hover:text-[#1976d2] transition-colors">
                  Planning
                </span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-[#388e3c] animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-gray-600">
                {isConnected ? "Live Data" : "Disconnected"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">C</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">Core</p>
                <p className="text-xs text-gray-500">Plant Manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
