/**
 * Vitest Setup File
 * Global test setup and mocks
 */

// Mock localStorage for tests
const localStorageMock = {
  getItem: (key: string): string | null => {
    return localStorageMock._store[key] || null;
  },
  setItem: (key: string, value: string): void => {
    localStorageMock._store[key] = value;
  },
  removeItem: (key: string): void => {
    delete localStorageMock._store[key];
  },
  clear(): void {
    localStorageMock._store = {};
  },
  _store: {} as Record<string, string>,
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});
