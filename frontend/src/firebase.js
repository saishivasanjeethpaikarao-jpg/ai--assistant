import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
} from 'firebase/auth';

// __GOOGLE_API_KEY__ is injected at build time via vite.config.js define
const apiKey = typeof __GOOGLE_API_KEY__ !== 'undefined' ? __GOOGLE_API_KEY__ : '';

const firebaseConfig = {
  apiKey,
  authDomain: 'studio-1742912828-cb958.firebaseapp.com',
  projectId: 'studio-1742912828-cb958',
  storageBucket: 'studio-1742912828-cb958.firebasestorage.app',
  messagingSenderId: '698656713592',
  appId: '1:698656713592:web:38f8a4c13c2ccbf5def68d',
};

if (!apiKey) {
  console.error('[Airis] Firebase apiKey is missing. Set the GOOGLE_API_KEY secret in Replit.');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });
githubProvider.setCustomParameters({ allow_signup: 'true' });

export default app;
