export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
console.log('🌐 API Base URL:', BASE_URL);
const API_URL = `${BASE_URL}/api`;

async function request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };
    const response = await fetch(url, config);
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro de conexão' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
}

async function uploadFile(file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`${API_URL}/admin/upload`, {
        method: 'POST',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
    });
    if (!response.ok) throw new Error('Erro no upload');
    return response.json();
}

export const publicApi = {
    getServices: () => request('/services'),
    getAvailableSlots: (date, serviceId, barberId) => {
        let url = `/available-slots/${date}?serviceId=${serviceId}`;
        if (barberId) url += `&barberId=${barberId}`;
        return request(url);
    },
    createAppointment: (data) => request('/appointments', {
        method: 'POST',
        body: JSON.stringify({
            client_name: data.client_name || data.clientName,
            client_whatsapp: data.client_whatsapp || data.clientWhatsapp,
            client_birth_date: data.client_birth_date || data.clientBirthDate,
            service_id: data.service_id || data.serviceId,
            barber_id: data.barber_id || data.barberId,
            date: data.date,
            time: data.time,
            notes: data.notes
        })
    }),
    getBarbers: () => request('/barbers'),
    getSiteConfig: () => request('/site-config'),
    checkClient: (whatsapp) => request(`/clients/check/${encodeURIComponent(whatsapp)}`),
    cancelAppointment: (id, whatsapp) => request(`/appointments/${id}/cancel`, { method: 'POST', body: JSON.stringify({ whatsapp }) }),
    getLastVisit: (whatsapp) => request(`/reviews/last-visit/${encodeURIComponent(whatsapp)}`),
    submitReview: (data) => request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
    getPublicReviews: () => request('/public-reviews'),
    getPaymentMethods: () => request('/payment-methods'),
};

export const authApi = {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    getMe: () => request('/auth/me'),
};

export const adminApi = {
    getDashboard: (params = {}) => { const q = new URLSearchParams(params).toString(); return request(`/admin/dashboard${q ? '?' + q : ''}`); },
    getAppointments: (params = {}) => { const q = new URLSearchParams(params).toString(); return request(`/admin/appointments${q ? '?' + q : ''}`); },
    updateAppointment: (id, data) => request(`/admin/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteAppointment: (id) => request(`/admin/appointments/${id}`, { method: 'DELETE' }),
    getServices: () => request('/admin/services'),
    createService: (data) => request('/admin/services', { method: 'POST', body: JSON.stringify(data) }),
    updateService: (id, data) => request(`/admin/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteService: (id) => request(`/admin/services/${id}`, { method: 'DELETE' }),
    deleteBarber: (id) => request(`/admin/barbers/${id}`, { method: 'DELETE' }),
    payCommission: (id, amount) => request(`/admin/barbers/${id}/pay-commission`, { method: 'POST', body: JSON.stringify({ amount }) }),
    getClients: (params = {}) => { const q = new URLSearchParams(params).toString(); return request(`/admin/clients${q ? '?' + q : ''}`); },
    getClient: (id) => request(`/admin/clients/${id}`),
    updateClient: (id, data) => request(`/admin/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    createClient: (data) => request('/admin/clients', { method: 'POST', body: JSON.stringify(data) }),
    importClients: (clients) => request('/admin/clients/import', { method: 'POST', body: JSON.stringify({ clients }) }),
    deleteClient: (id) => request(`/admin/clients/${id}`, { method: 'DELETE' }),

    getProducts: (params = {}) => { const q = new URLSearchParams(params).toString(); return request(`/admin/products${q ? '?' + q : ''}`); },
    createProduct: (data) => request('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id, data) => request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
    sellProduct: (id, data) => request(`/admin/products/${id}/sell`, { method: 'POST', body: JSON.stringify(data) }),
    getStockSummary: () => request('/admin/stock-summary'),

    getSiteConfig: () => request('/admin/site-config'),
    updateSiteConfig: (data) => request('/admin/site-config', { method: 'PUT', body: JSON.stringify(data) }),
    uploadImage: uploadFile,

    getSettings: () => request('/admin/settings'),
    updateSettings: (data) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),

    // Payment Methods
    getPaymentMethods: () => request('/admin/payment-methods'),
    createPaymentMethod: (data) => request('/admin/payment-methods', { method: 'POST', body: JSON.stringify(data) }),
    updatePaymentMethod: (id, data) => request(`/admin/payment-methods/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePaymentMethod: (id) => request(`/admin/payment-methods/${id}`, { method: 'DELETE' }),

    // Barbers
    getBarbers: () => request('/admin/barbers'),
    createBarber: (data) => request('/admin/barbers', { method: 'POST', body: JSON.stringify(data) }),
    updateBarber: (id, data) => request(`/admin/barbers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    // Barber Off Days
    getBarberOffDays: (barberId) => request(`/admin/barber-off-days/${barberId}`),
    saveBarberOffDays: (data) => request('/admin/barber-off-days', { method: 'POST', body: JSON.stringify(data) }),
    deleteBarberOffDay: (id) => request(`/admin/barber-off-days/${id}`, { method: 'DELETE' }),

    // Security / Roles
    getRoles: () => request('/admin/roles'),
    createRole: (data) => request('/admin/roles', { method: 'POST', body: JSON.stringify(data) }),
    updateRole: (id, data) => request(`/admin/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getRolePermissions: (id) => request(`/admin/roles/${id}/permissions`),

    getBlockedTimes: (date) => { const q = date ? `?date=${date}` : ''; return request(`/admin/blocked-times${q}`); },
    blockTime: (data) => request('/admin/blocked-times', { method: 'POST', body: JSON.stringify(data) }),
    unblockTime: (id) => request(`/admin/blocked-times/${id}`, { method: 'DELETE' }),
    getFinancial: (params = {}) => { const q = new URLSearchParams(params).toString(); return request(`/admin/financial${q ? '?' + q : ''}`); },
    changePassword: (data) => request('/admin/change-password', { method: 'PUT', body: JSON.stringify(data) }),
    createAppointmentAdmin: (data) => request('/admin/appointments', { method: 'POST', body: JSON.stringify(data) }),
    getBirthdays: (month) => request(`/admin/birthdays${month ? '?month=' + month : ''}`),
    getReviews: () => request('/admin/reviews'),
    getUnreadReviewsCount: () => request('/admin/reviews/unread-count'),
    updateReview: (id, data) => request(`/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteReview: (id) => request(`/admin/reviews/${id}`, { method: 'DELETE' }),
};
