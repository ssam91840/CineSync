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
import { AnimatePresence, motion } from 'framer-motion';

const navItems = [
  { icon: Film, label: 'Dashboard', path: '/' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: FileText, label: 'Logs', path: '/logs' },
  { icon: Info, label: 'About', path: '/about' }
];

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigation = (path: string) => {
    if (location.pathname === path) return;
    navigate(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.8,
              ease: [0.6, -0.05, 0.01, 0.99],
              delay: 0.2
            }}
          >
            <motion.img
              src="/cinesync-logo.png"
              alt="CineSync"
              className="w-96 mx-auto"
              animate={{ 
                y: [0, -8, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <motion.div
              animate={{ 
                scale: [1, 0.97, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Loader2 className="h-10 w-10 text-indigo-400 mx-auto animate-spin" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Rest of the component remains the same...
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <motion.button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-gray-900 hover:bg-gray-800"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </motion.button>

      <motion.aside 
        className={`
          fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 
          z-40
        `}
        initial={{ x: -256 }}
        animate={{ x: isSidebarOpen || window.innerWidth >= 1024 ? 0 : -256 }}
        transition={{ duration: 0.3, ease: [0.6, -0.05, 0.01, 0.99] }}
      >
        <motion.div 
          className="p-6 border-b border-gray-800"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
            <Film className="h-8 w-8" />
            CineSync
          </h1>
        </motion.div>

        <nav className="mt-6">
          {navItems.map(({ icon: Icon, label, path }, index) => (
            <motion.button
              key={path}
              onClick={() => handleNavigation(path)}
              className={`
                w-full flex items-center gap-4 px-6 py-3 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors
                ${location.pathname === path ? 'bg-gray-800 text-white border-r-4 border-indigo-500' : ''}
              `}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
              whileHover={{ x: 5 }}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </motion.button>
          ))}
        </nav>
      </motion.aside>

      <main className={`
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-64 ml-0'}
      `}>
        <div className="p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}