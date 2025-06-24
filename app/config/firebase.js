// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCPhbvVvo-nDPdPcLTqaJzQO9E0JnI7pQY",
  authDomain: "rehearsal-scheduler-e3b5b.firebaseapp.com",
  projectId: "rehearsal-scheduler-e3b5b",
  storageBucket: "rehearsal-scheduler-e3b5b.firebasestorage.app",
  messagingSenderId: "956424445012",
  appId: "1:956424445012:web:06cc3f8681b7e6edb761c1",
  measurementId: "G-WGG5LEPMJ8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
