import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../firebase';

const AuthContext = createContext(null);

// Detect if we're inside an iframe (Replit preview) — use redirect in that case
const inIframe = () => {
  try { return window.self !== window.top; } catch { return true; }
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    // Handle redirect result from OAuth flow
    getRedirectResult(auth)
      .then(result => { if (result?.user) setUser(result.user); })
      .catch(e => {
        if (e.code && e.code !== 'auth/no-current-user') {
          console.error('[Auth redirect error]', e.code, e.message);
          setError(friendlyError(e.code, e.message));
        }
      });

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const clearError = () => setError('');

  const doOAuth = async (provider) => {
    if (inIframe()) {
      await signInWithRedirect(auth, provider);
      return;
    }
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/popup-closed-by-user') {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw e;
    }
  };

  const signInGoogle = async () => {
    setError('');
    try { await doOAuth(googleProvider); }
    catch (e) {
      console.error('[Google sign-in error]', e.code, e.message);
      setError(friendlyError(e.code, e.message));
      throw e;
    }
  };

  const signInGithub = async () => {
    setError('');
    try { await doOAuth(githubProvider); }
    catch (e) {
      console.error('[GitHub sign-in error]', e.code, e.message);
      setError(friendlyError(e.code, e.message));
      throw e;
    }
  };

  const signInEmail = async (email, password) => {
    setError('');
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (e) {
      console.error('[Email sign-in error]', e.code, e.message);
      setError(friendlyError(e.code, e.message));
      throw e;
    }
  };

  const signUpEmail = async (email, password) => {
    setError('');
    try { await createUserWithEmailAndPassword(auth, email, password); }
    catch (e) {
      console.error('[Email sign-up error]', e.code, e.message);
      setError(friendlyError(e.code, e.message));
      throw e;
    }
  };

  const resetPassword = async (email) => {
    setError('');
    try { await sendPasswordResetEmail(auth, email); }
    catch (e) {
      console.error('[Password reset error]', e.code, e.message);
      setError(friendlyError(e.code, e.message));
      throw e;
    }
  };

  const signInGuest = async () => {
    setError('');
    try { await signInAnonymously(auth); }
    catch (e) {
      console.error('[Guest sign-in error]', e.code, e.message);
      setError(friendlyError(e.code, e.message));
      throw e;
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{
      user, loading, error, clearError,
      signInGoogle, signInGithub, signInEmail, signUpEmail, resetPassword, signInGuest, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

function friendlyError(code = '', message = '') {
  const map = {
    // Credential errors
    'auth/user-not-found':        'No account found with this email.',
    'auth/wrong-password':        'Incorrect password. Please try again.',
    'auth/invalid-credential':    'Incorrect email or password. Please try again.',
    'auth/email-already-in-use':  'An account with this email already exists.',
    'auth/weak-password':         'Password must be at least 6 characters.',
    'auth/invalid-email':         'Please enter a valid email address.',
    // OAuth errors
    'auth/popup-closed-by-user':         'Sign-in was cancelled.',
    'auth/popup-blocked':                'Your browser blocked the sign-in popup. Allow popups for this site and try again.',
    'auth/cancelled-popup-request':      'Sign-in was cancelled.',
    'auth/account-exists-with-different-credential': 'An account already exists with a different sign-in method.',
    // Config / setup errors
    'auth/unauthorized-domain':   'This domain is not authorized in Firebase. Add it to Firebase Console → Authentication → Settings → Authorized domains.',
    'auth/invalid-api-key':       'Firebase API key is missing or invalid. Check your Replit GOOGLE_API_KEY secret.',
    'auth/configuration-not-found': 'Firebase is not configured correctly. Check your Firebase project settings.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.',
    'auth/app-not-authorized':    'This app is not authorized to use Firebase Authentication.',
    // Network / other
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/too-many-requests':      'Too many attempts. Please try again in a few minutes.',
    'auth/internal-error':         'An internal error occurred. Please try again.',
    'auth/requires-recent-login':  'Please sign in again to continue.',
    'auth/user-disabled':          'This account has been disabled.',
  };

  if (map[code]) return map[code];

  // Surface raw message for unknown codes so user can report it
  if (message) return `Sign-in error: ${message.replace('Firebase: ', '').split(' (auth/')[0]}`;
  return 'Something went wrong. Please try again.';
}
