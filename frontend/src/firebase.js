import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
} from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

if (!apiKey) {
  console.error('[Airis] Firebase apiKey is missing. Set the VITE_FIREBASE_API_KEY secret in Replit.');
}

const firebaseConfig = {
  apiKey,
  authDomain: 'studio-1742912828-cb958.firebaseapp.com',
  projectId: 'studio-1742912828-cb958',
  storageBucket: 'studio-1742912828-cb958.firebasestorage.app',
  messagingSenderId: '698656713592',
  appId: '1:698656713592:web:38f8a4c13c2ccbf5def68d',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });
githubProvider.setCustomParameters({ allow_signup: 'true' });

export default app;
