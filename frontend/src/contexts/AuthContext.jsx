import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const clearError = () => setError('');

  const signInGoogle = async () => {
    setError('');
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { setError(friendlyError(e.code)); throw e; }
  };

  const signInGithub = async () => {
    setError('');
    try { await signInWithPopup(auth, githubProvider); }
    catch (e) { setError(friendlyError(e.code)); throw e; }
  };

  const signInEmail = async (email, password) => {
    setError('');
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (e) { setError(friendlyError(e.code)); throw e; }
  };

  const signUpEmail = async (email, password) => {
    setError('');
    try { await createUserWithEmailAndPassword(auth, email, password); }
    catch (e) { setError(friendlyError(e.code)); throw e; }
  };

  const resetPassword = async (email) => {
    setError('');
    try { await sendPasswordResetEmail(auth, email); }
    catch (e) { setError(friendlyError(e.code)); throw e; }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{
      user, loading, error, clearError,
      signInGoogle, signInGithub, signInEmail, signUpEmail, resetPassword, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

function friendlyError(code) {
  const map = {
    'auth/user-not-found':       'No account found with this email.',
    'auth/wrong-password':       'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/account-exists-with-different-credential':
      'An account already exists with a different sign-in method.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/too-many-requests':    'Too many attempts. Please try again later.',
    'auth/invalid-credential':   'Invalid credentials. Please try again.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
