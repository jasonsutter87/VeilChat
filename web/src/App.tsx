/**
 * TibbyTalk Web - Main App
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { onAuthStateChanged, getUserById } from './core/auth/authService';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return <div className="loading">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { setUser, setInitialized } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await getUserById(firebaseUser.uid);
          setUser(userData);
        } catch (err) {
          console.error('Failed to get user data:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setInitialized(true);
    });

    return () => unsubscribe();
  }, [setUser, setInitialized]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
