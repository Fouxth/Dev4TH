export function getSocketUrl() {
  return import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://127.0.0.1:2004' : undefined);
}
