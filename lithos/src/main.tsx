import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import App from "./App";

// Feel free to replace the clientID with your actual Google Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = "727641175261-ujm31gpn7djtksisoco4dqimr2biejhb.apps.googleusercontent.com";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
