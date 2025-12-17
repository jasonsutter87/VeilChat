/**
 * TibbyTalk Web - Login Page
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../core/auth/authService';
import { useAuthStore } from '../store/authStore';
import { getUserById } from '../core/auth/authService';
import styles from './Auth.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginUser(email.trim(), password);
      setUser(user);
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError('Failed to login. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>TibbyTalk</h1>
        <p className={styles.subtitle}>End-to-End Encrypted Messaging</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            disabled={isLoading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            disabled={isLoading}
          />

          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footer}>
          <span>Don't have an account?</span>
          <Link to="/register" className={styles.link}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
