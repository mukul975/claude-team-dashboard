export function getAuthToken() {
  return sessionStorage.getItem('dashboard-token');
}

export async function apiFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
  return res;
}
