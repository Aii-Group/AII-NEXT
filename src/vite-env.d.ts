/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME_EN?: string;
  readonly VITE_APP_NAME_ZH?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_KEYCLOAK_URL?: string;
  readonly VITE_KEYCLOAK_REALM?: string;
  readonly VITE_KEYCLOAK_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
