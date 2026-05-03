import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCuZbO2DDSbnO_9hIIAFP0A8o0Wi2FzUhg',
  authDomain: 'studio-1742912828-cb958.firebaseapp.com',
  projectId: 'studio-1742912828-cb958',
  storageBucket: 'studio-1742912828-cb958.firebasestorage.app',
  messagingSenderId: '698656713592',
  appId: '1:698656713592:web:2754c56495afde5ddef68d',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });
githubProvider.setCustomParameters({ allow_signup: 'true' });

export default app;
