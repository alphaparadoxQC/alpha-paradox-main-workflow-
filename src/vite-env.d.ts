/// <reference types="vite/client" />

interface Window {
  assistantContext: {
    currentPage: string;
    pageData: Record<string, any>;
  };
}
