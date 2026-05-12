import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCuZbO2DDSbnO_9hIIAFP0A8o0Wi2FzUhg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'studio-1742912828-cb958.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'studio-1742912828-cb958',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'studio-1742912828-cb958.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID || '698656713592',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:698656713592:web:2754c56495afde5ddef68d',
};

// Add Cloudflare Pages domain to authorized domains
const AUTHORIZED_DOMAINS = [
  'studio-1742912828-cb958.firebaseapp.com',
  'airis-9ox.pages.dev',
  'localhost',
];

export const isDomainAuthorized = () => {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  return AUTHORIZED_DOMAINS.some(d => host === d || host.endsWith('.' + d));
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });
githubProvider.setCustomParameters({ allow_signup: 'true' });

export default app;
