/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_YOUTUBE_API_KEY: string;
  readonly VITE_YOUTUBE_BASE_URL: string;
  readonly VITE_MOCK_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
