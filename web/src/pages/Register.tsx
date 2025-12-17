/**
 * TibbyTalk Web - Register Page
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, getPasswordRequirementsText } from '../core/auth/authService';
import { useAuthStore } from '../store/authStore';
import styles from './Auth.module.css';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const requirements = getPasswordRequirementsText();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const user = await registerUser(email.trim(), password, displayName.trim());
      setUser(user);
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>TibbyTalk</h1>
        <p className={styles.subtitle}>Create Your Account</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <input
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={styles.input}
            disabled={isLoading}
          />

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
            onFocus={() => setShowRequirements(true)}
            className={styles.input}
            disabled={isLoading}
          />

          {showRequirements && (
            <div className={styles.requirements}>
              <div className={styles.requirementsTitle}>Password must have:</div>
              {requirements.map((req, i) => (
                <div key={i} className={styles.requirementItem}>• {req}</div>
              ))}
            </div>
          )}

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
            disabled={isLoading}
          />

          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className={styles.notice}>
            Your encryption keys will be generated and stored in this browser.
            Make sure to backup your keys!
          </div>
        </form>

        <div className={styles.footer}>
          <span>Already have an account?</span>
          <Link to="/login" className={styles.link}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
