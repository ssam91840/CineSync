import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Film, 
  Settings, 
  FileText, 
  Info,
  Menu,
  X,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { icon: Film, label: 'Dashboard', path: '/' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: FileText, label: 'Logs', path: '/logs' },
  { icon: Info, label: 'About', path: '/about' }
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Initial app load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handle navigation with loading state
  const handleNavigation = (path: string) => {
    if (location.pathname === path) return;
    setIsTransitioning(true);
    navigate(path);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <Film className="h-16 w-16 text-indigo-400 mx-auto animate-pulse" />
          <h1 className="text-2xl font-bold text-white">CineSync</h1>
          <Loader2 className="h-8 w-8 text-indigo-400 mx-auto animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Mobile menu button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-gray-900 hover:bg-gray-800"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 
        transform transition-transform duration-200 ease-in-out z-40
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
            <Film className="h-8 w-8" />
            CineSync
          </h1>
        </div>

        <nav className="mt-6">
          {navItems.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => handleNavigation(path)}
              className={`
                w-full flex items-center gap-4 px-6 py-3 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors
                ${location.pathname === path ? 'bg-gray-800 text-white border-r-4 border-indigo-500' : ''}
              `}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className={`
        transition-all duration-200 ease-in-out
        ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-64 ml-0'}
      `}>
        <div className="p-6 lg:p-8">
          <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {children}
          </div>
        </div>
      </main>

      {/* Loading overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
        </div>
      )}
    </div>
  );
}