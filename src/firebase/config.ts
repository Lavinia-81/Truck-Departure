// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDhfcxEB0zImt9K8ddFKoz3zrQX9Swp01Y",
  authDomain: "truck-app-project.firebaseapp.com",
  databaseURL: "https://truck-app-project-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "truck-app-project",
  storageBucket: "truck-app-project.appspot.com",
  messagingSenderId: "559055709371",
  appId: "1:559055709371:web:c3e397b63454aca95c359e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const firestore = getFirestore(app);
export const auth = getAuth(app);
