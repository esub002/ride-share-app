import axios from 'axios';

const API_BASE = 'http://localhost:3000/api'; // Update as needed

export const getLiveRideRequests = () => axios.get(`${API_BASE}/analytics/rides`);
export const getActiveDrivers = () => axios.get(`${API_BASE}/admin/drivers?status=active`);
export const getActiveRiders = () => axios.get(`${API_BASE}/admin/users?status=active`);
export const getSOSAlerts = () => axios.get(`${API_BASE}/analytics/safety`);
export const getEarnings = () => axios.get(`${API_BASE}/analytics/revenue`);
export const getOverview = () => axios.get(`${API_BASE}/analytics/overview`);