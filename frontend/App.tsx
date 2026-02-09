import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import { Page, User } from './types';

const USER_STORAGE_KEY = 'curabot_user';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // On mount, restore user from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
        setCurrentPage(Page.DASHBOARD);
      }
    } catch (error) {
      console.error('Failed to restore user session:', error);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    setIsInitialized(true);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Persist user to localStorage
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
    setCurrentPage(Page.DASHBOARD);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    setCurrentPage(Page.HOME);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
  };

  // Show loading while checking localStorage
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-cyan-400 text-lg">Loading...</div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case Page.HOME:
        return <Home onNavigate={setCurrentPage} />;
      case Page.LOGIN:
        return <Login onLogin={handleLogin} onNavigate={setCurrentPage} />;
      case Page.DASHBOARD:
        return user ? <Dashboard user={user} onNavigate={setCurrentPage} /> : <Login onLogin={handleLogin} onNavigate={setCurrentPage} />;
      case Page.CHAT:
        return user ? <Chat user={user} /> : <Login onLogin={handleLogin} onNavigate={setCurrentPage} />;
      case Page.PROGRESS:
        return user ? <Progress onNavigate={setCurrentPage} /> : <Login onLogin={handleLogin} onNavigate={setCurrentPage} />;
      case Page.SETTINGS:
        return user ? <Settings user={user} onNavigate={setCurrentPage} onLogout={handleLogout} onUpdateUser={handleUpdateUser} /> : <Login onLogin={handleLogin} onNavigate={setCurrentPage} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="font-sans text-slate-800 antialiased selection:bg-cyan-500/30">
      {renderPage()}

      {/* Floating Navbar is always visible except on Login page for aesthetic focus */}
      {currentPage !== Page.LOGIN && (
        <Navbar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          isLoggedIn={!!user}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;
