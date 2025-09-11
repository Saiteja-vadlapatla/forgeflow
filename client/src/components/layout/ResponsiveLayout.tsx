import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "./AppHeader";
import { SideNavigation } from "./SideNavigation";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  isConnected: boolean;
}

export function ResponsiveLayout({ children, isConnected }: ResponsiveLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

  // Check screen size and set mobile state
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false); // Close mobile sidebar on desktop
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-['Roboto']">
      <AppHeader isConnected={isConnected} />
      
      <div className="flex h-[calc(100vh-4rem)] relative">
        {/* Mobile sidebar backdrop */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          ${isMobile 
            ? `fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 transform transition-transform duration-300 ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'relative'
          }
        `}>
          <SideNavigation />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile hamburger menu */}
          {isMobile && (
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2 flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="mr-2"
                data-testid="button-toggle-sidebar"
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Toggle navigation</span>
              </Button>
              <span className="text-sm font-medium text-gray-600">
                Navigation
              </span>
            </div>
          )}

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}