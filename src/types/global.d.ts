declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: (string | number | boolean | Record<string, unknown>)[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: (string | number | boolean | Record<string, unknown>)[]) => void) => void;
      removeListener: (event: string, callback: (...args: (string | number | boolean | Record<string, unknown>)[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export {}; 