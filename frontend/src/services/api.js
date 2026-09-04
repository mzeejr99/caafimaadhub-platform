import syncManager from '../offline/syncManager';

const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_BASE = RAW_API_URL ? `${RAW_API_URL.replace(/\/$/, '')}/api/v1` : '/api/v1';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('caafimaad_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // If body is FormData, delete Content-Type so browser sets boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    headers
  };

  let response;
  try {
    const url = endpoint.startsWith('http') || endpoint.startsWith('/api')
      ? endpoint
      : `${API_BASE}${endpoint}`;
    response = await fetch(url, config);
  } catch (netErr) {
    // If offline and request is a field submission, store in IndexedDB
    if (!navigator.onLine && endpoint.includes('/field-data/submit') && options.method === 'POST') {
      try {
        const payload = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        const offlineSaved = await syncManager.saveOfflineSubmission(payload);
        return {
          success: true,
          message: 'Saved offline on device. Will auto-sync when online.',
          data: offlineSaved,
          offline: true
        };
      } catch (err) {
        console.error('[Offline Storage Error]', err);
      }
    }
    const networkMsg = !navigator.onLine
      ? 'Internet-ka ayaa go\'an / Device is offline'
      : 'Ma suurtagelin in lagu xirmo server-ka. Hubi in server-ku kiciyeysan yahay (Port 5000). / Unable to connect to backend server.';
    const err = new Error(networkMsg);
    err.isNetworkError = true;
    throw err;
  }

  // Handle Token Expiry
  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    localStorage.removeItem('caafimaad_token');
    localStorage.removeItem('caafimaad_refresh_token');
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (jsonErr) {
      data = null;
    }
  }

  if (!data) {
    const rawText = await response.text().catch(() => '');
    if (!response.ok) {
      const msg = (response.status === 502 || response.status === 504)
        ? 'Server-ka laguma xirmi karo (502/504 Bad Gateway). Fadlan hubi in backend-ku shaqeynayo (port 5000).'
        : rawText || `Server error (${response.status} ${response.statusText || ''})`.trim();
      const err = new Error(msg);
      err.status = response.status;
      throw err;
    }
    return { success: true, data: null };
  }

  if (!response.ok || data.success === false) {
    const error = new Error(data.message || 'API request failed');
    error.status = response.status;
    error.errorCode = data.errorCode;
    error.errors = data.errors;
    throw error;
  }

  return data;
}

export const api = {
  request,
  get: (endpoint, params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return request(url, { method: 'GET' });
  },
  post: (endpoint, body) => {
    return request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },
  put: (endpoint, body) => {
    return request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },
  patch: (endpoint, body) => {
    return request(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },
  delete: (endpoint) => {
    return request(endpoint, { method: 'DELETE' });
  }
};

export default api;
