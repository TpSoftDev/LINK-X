import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4zfj9OQ5BZW6JhJm9wMpvyLyyAbX4HZ4",
  authDomain: "link-x-7826d.firebaseapp.com",
  projectId: "link-x-7826d",
  storageBucket: "link-x-7826d.appspot.com",
  messagingSenderId: "165077425581",
  appId: "1:165077425581:web:1c7178bdca665221f6d524"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;