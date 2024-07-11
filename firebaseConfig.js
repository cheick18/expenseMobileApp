
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { getStorage } = require('firebase/storage');
const { addDoc, collection, doc,query,getDocs, where}=require ('firebase/firestore');
require('dotenv').config();


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {

  apiKey: process.env.FIREBASE_API_KEY,
  authDomain:process.env.FIREBASE_AUTH_DOMAIN,
  projectId:process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId:process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId:process.env.FIREBASE_APP_ID,
  storageBucket:process.env.FIREBASE_BUCKET
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const dbNode = getFirestore(app);
const storage=getStorage()

module.exports = {
    dbNode,
    storage,
    addDoc,
    collection,
    doc,
    where,
    query,
    getDocs
  };