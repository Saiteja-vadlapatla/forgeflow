import { Factory } from "lucide-react";

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
              <a href="#dashboard" className="text-[#1976d2] font-medium border-b-2 border-[#1976d2] pb-1">Dashboard</a>
              <a href="#production" className="text-gray-600 hover:text-[#1976d2] transition-colors">Production</a>
              <a href="#quality" className="text-gray-600 hover:text-[#1976d2] transition-colors">Quality</a>
              <a href="#inventory" className="text-gray-600 hover:text-[#1976d2] transition-colors">Inventory</a>
              <a href="#planning" className="text-gray-600 hover:text-[#1976d2] transition-colors">Planning</a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-[#388e3c] animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">{isConnected ? 'Live Data' : 'Disconnected'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">JS</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">John Smith</p>
                <p className="text-xs text-gray-500">Plant Manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
