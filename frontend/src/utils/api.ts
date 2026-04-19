const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthToken = () => {
  return localStorage.getItem('zh_token');
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('zh_current_user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setAuthData = (token: string, user: any) => {
  localStorage.setItem('zh_token', token);
  localStorage.setItem('zh_current_user', JSON.stringify(user));
};

export const clearAuthData = () => {
  localStorage.removeItem('zh_token');
  localStorage.removeItem('zh_current_user');
};

export const api = {
  get: async (endpoint: string) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  },

  post: async (endpoint: string, data: any) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  },

  patch: async (endpoint: string, data?: any) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: data ? JSON.stringify(data) : undefined
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  },

  delete: async (endpoint: string) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  }
};

export const auth = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    const data = await response.json();
    setAuthData(data.token, data.user);
    return data;
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    address: string;
    phone?: string;
    role: 'PROVIDER' | 'CONSUMER';
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    const data = await response.json();
    setAuthData(data.token, data.user);
    return data;
  },

  me: async () => {
    return api.get('/auth/me');
  },

  logout: () => {
    clearAuthData();
  },

  updateProfile: async (userData: {
    name?: string;
    address?: string;
    phone?: string;
    lat?: number;
    lng?: number;
  }) => {
    return api.patch('/auth/profile', userData);
  }
};

export const listings = {
  getAll: async (role?: string, sector?: string) => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (sector) params.append('sector', sector);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/listings${query}`);
  },

  get: async (id: string) => {
    return api.get(`/listings/${id}`);
  },

  create: async (listingData: {
    description: string;
    servings: number;
    foodType: string;
    location: string;
    lat?: number;
    lng?: number;
    pickupEnd: string;
  }) => {
    return api.post('/listings', listingData);
  },

  update: async (id: string, data: {
    description?: string;
    servings?: number;
    foodType?: string;
    location?: string;
    pickupEnd?: string;
  }) => {
    return api.patch(`/listings/${id}`, data);
  },

  claim: async (id: string) => {
    return api.patch(`/listings/${id}/claim`);
  },

  complete: async (id: string) => {
    return api.patch(`/listings/${id}/complete`);
  },

  delete: async (id: string) => {
    return api.delete(`/listings/${id}`);
  }
};

export const users = {
  getAll: async (status?: string, role?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (role) params.append('role', role);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/admin/users${query}`);
  },

  approve: async (id: string) => {
    return api.patch(`/admin/users/${id}/approve`);
  },

  reject: async (id: string) => {
    return api.patch(`/admin/users/${id}/reject`);
  },

  getStats: async () => {
    return api.get('/admin/users/stats');
  }
};

export const geocode = {
  getCoords: async (address: string) => {
    const response = await fetch(`${API_BASE_URL}/geocode/geocode?address=${encodeURIComponent(address)}`);
    if (!response.ok) {
      return { lat: 33.6844, lng: 73.0479 };
    }
    return response.json();
  }
};

export const rides = {
  start: async (listingId: string) => {
    return api.post('/rides', { listingId });
  },

  arrive: async (rideId: string) => {
    return api.patch(`/rides/${rideId}/arrive`);
  },

  complete: async (rideId: string) => {
    return api.patch(`/rides/${rideId}/complete`);
  },

  getMyRides: async () => {
    return api.get('/rides/my-rides');
  }
};

export { API_BASE_URL };
export { getAuthToken, getCurrentUser };