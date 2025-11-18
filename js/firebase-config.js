// Configuración de Firebase - REEMPLAZA con tus credenciales
const firebaseConfig = {
  apiKey: "AIzaSyA_ALDeR_KSULslruAoePdNUZAqfBWvPHU",
  authDomain: "gestion-de-documentos-bc274.firebaseapp.com",
  projectId: "gestion-de-documentos-bc274",
  storageBucket: "gestion-de-documentos-bc274.firebasestorage.app",
  messagingSenderId: "102437387960",
  appId: "1:102437387960:web:6f75fd210dd8917604be4d",
  measurementId: "G-HM1L17D8ZY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);