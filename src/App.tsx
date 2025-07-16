import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { dataManager } from './utils/dataManager';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (username: string, password: string): boolean => {
    const success = dataManager.authenticateUser(username, password);
    if (success) {
      setIsAuthenticated(true);
    }
    return success;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;