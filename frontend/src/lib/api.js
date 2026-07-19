import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "/api";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fv_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const publicApi = {
  getAnnouncements: () => api.get("/announcements").then((r) => r.data),
  getTopNavCategories: () => api.get("/top-nav-categories").then((r) => r.data),
  getHeroSlides: () => api.get("/hero-slides").then((r) => r.data),
  getEditorialTiles: () => api.get("/editorial-tiles").then((r) => r.data),
  getSteals: () => api.get("/steals").then((r) => r.data),
  getFeaturedCategories: () => api.get("/featured-categories").then((r) => r.data),
  getProducts: (category) => api.get("/products", { params: category ? { category } : {} }).then((r) => r.data),
  getProduct: (id) => api.get(`/products/${id}`).then((r) => r.data),
  placeOrder: (data) => api.post("/orders", data).then((r) => r.data),
  getMenuLinks: () => api.get("/menu-links").then((r) => r.data),
  getFooter: () => api.get("/footer").then((r) => r.data),
  getPromoBanner: () => api.get("/promo-banner").then((r) => r.data),
  getCategories: () => api.get("/categories").then((r) => r.data),
};

export const adminApi = {
  login: (username, password) => api.post("/admin/login", { username, password }).then((r) => r.data),
  me: () => api.get("/admin/me").then((r) => r.data),
  stats: () => api.get("/admin/stats").then((r) => r.data),
  list: (resource) => api.get(`/admin/${resource}`).then((r) => r.data),
  create: (resource, data) => api.post(`/admin/${resource}`, data).then((r) => r.data),
  update: (resource, id, data) => api.put(`/admin/${resource}/${id}`, data).then((r) => r.data),
  remove: (resource, id) => api.delete(`/admin/${resource}/${id}`).then((r) => r.data),
  getPromoBanner: () => api.get("/admin/promo-banner").then((r) => r.data),
  updatePromoBanner: (data) => api.put("/admin/promo-banner", data).then((r) => r.data),
  listFooterSections: () => api.get("/admin/footer-sections").then((r) => r.data),
  createFooterSection: (data) => api.post("/admin/footer-sections", data).then((r) => r.data),
  updateFooterSection: (id, data) => api.put(`/admin/footer-sections/${id}`, data).then((r) => r.data),
  deleteFooterSection: (id) => api.delete(`/admin/footer-sections/${id}`).then((r) => r.data),
};

export default api;

// Re-export leadsApi for convenience
export { leadsApi } from "./leadsApi";
