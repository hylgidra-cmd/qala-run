/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google OAuth web client id; Google sign-in is off when it is unset. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}
