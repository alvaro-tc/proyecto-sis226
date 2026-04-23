import axios from "axios";
import { getAuthToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const authApi = {
  login: (data: { identity: string; password: string }) =>
    api.post("/auth/login", data),
  registerCustomer: (data: {
    Name: string;
    Surname: string;
    CI: string;
    Email: string;
    PhoneNumber: string;
    Password: string;
  }) => api.post("/auth/register/customer", data),
  me: () => api.get("/auth/me"),
  updateProfile: (data: {
    Name?: string;
    Surname?: string;
    Email?: string;
    PhoneNumber?: string;
  }) => api.patch("/auth/me/profile", data),
};

// Movies API
export const moviesApi = {
  getAll: () => api.get("/movies"),
  getById: (id: string) => api.get(`/movies/${id}`),
  create: (data: any) => api.post("/movies", data),
  update: (id: string, data: any) => api.put(`/movies/${id}`, data),
  delete: (id: string) => api.delete(`/movies/${id}`),
};

// Sessions API
export const sessionsApi = {
  getAll: () => api.get("/sessions"),
  getById: (id: string) => api.get(`/sessions/${id}`),
  getAvailability: (id: string) => api.get(`/sessions/${id}/availability`),
  create: (data: any) => api.post("/sessions", data),
  update: (id: string, data: any) => api.put(`/sessions/${id}`, data),
  delete: (id: string) => api.delete(`/sessions/${id}`),
};

// Reservations API
export const reservationsApi = {
  getAll: () => api.get("/reservations"),
  getById: (id: string) => api.get(`/reservations/${id}`),
  create: (data: any) => api.post("/reservations", data),
  update: (id: string, data: any) => api.put(`/reservations/${id}`, data),
  delete: (id: string) => api.delete(`/reservations/${id}`),
};

// Customers API
export const customersApi = {
  getAll: () => api.get("/customers"),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post("/customers", data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

// Halls API
export const hallsApi = {
  getAll: () => api.get("/halls"),
  getById: (id: string) => api.get(`/halls/${id}`),
  create: (data: any) => api.post("/halls", data),
  update: (id: string, data: any) => api.put(`/halls/${id}`, data),
  delete: (id: string) => api.delete(`/halls/${id}`),
};

// Seats API
export const seatsApi = {
  getAll: (hallId?: string) => api.get("/seats", { params: { hallId } }),
  getById: (id: string) => api.get(`/seats/${id}`),
  create: (data: any) => api.post("/seats", data),
  update: (id: string, data: any) => api.put(`/seats/${id}`, data),
  delete: (id: string) => api.delete(`/seats/${id}`),
};

// Payments API
export const paymentsApi = {
  getAll: () => api.get("/payments"),
  getById: (id: string) => api.get(`/payments/${id}`),
  create: (data: any) => api.post("/payments", data),
  update: (id: string, data: any) => api.put(`/payments/${id}`, data),
  delete: (id: string) => api.delete(`/payments/${id}`),
};

// Tickets API
export const ticketsApi = {
  getAll: () => api.get("/tickets"),
  getById: (id: string) => api.get(`/tickets/${id}`),
  create: (data: any) => api.post("/tickets", data),
  update: (id: string, data: any) => api.put(`/tickets/${id}`, data),
  delete: (id: string) => api.delete(`/tickets/${id}`),
};

export const meApi = {
  getProfile: () => api.get("/me/profile"),
  getReservations: () => api.get("/me/reservations"),
  getReservationById: (id: string) => api.get(`/me/reservations/${id}`),
  createReservation: (data: { SessionID: string; SeatIDs: string[] }) =>
    api.post("/me/reservations", data),
  payReservation: (
    id: string,
    data: {
      PaymentMethod: "Credit Card" | "Debit Card";
      cardNumber: string;
      cardholderName: string;
      expiryDate: string;
      cvv: string;
    },
  ) => api.post(`/me/reservations/${id}/pay`, data),
  getReservationTickets: (id: string) =>
    api.get(`/me/reservations/${id}/tickets`),
  getTickets: () => api.get("/me/tickets"),
  getTicketById: (id: string) => api.get(`/me/tickets/${id}`),
};

export const reviewsApi = {
  getMovieReviews: (movieId: string) => api.get(`/reviews/movie/${movieId}`),
  getMyMovieStatus: (movieId: string) =>
    api.get(`/reviews/me/movie/${movieId}`),
  saveMovieReview: (
    movieId: string,
    data: { Score: number; Comment: string },
  ) => api.put(`/reviews/movie/${movieId}`, data),
};

export const snackCategoriesApi = {
  getAll: () => api.get("/snacks/categories"),
  create: (data: { Name: string; Description?: string; IsActive?: boolean }) =>
    api.post("/snacks/categories", data),
  update: (
    id: string,
    data: Partial<{ Name: string; Description: string; IsActive: boolean }>,
  ) => api.put(`/snacks/categories/${id}`, data),
  delete: (id: string) => api.delete(`/snacks/categories/${id}`),
};

export const snackProductsApi = {
  getAll: (params?: { category?: string; active?: boolean }) =>
    api.get("/snacks/products", { params }),
  getById: (id: string) => api.get(`/snacks/products/${id}`),
  create: (data: any) => api.post("/snacks/products", data),
  update: (id: string, data: any) => api.put(`/snacks/products/${id}`, data),
  delete: (id: string) => api.delete(`/snacks/products/${id}`),
};

export const snackSalesApi = {
  getAll: () => api.get("/snacks/sales"),
  create: (data: {
    Items: { ProductID: string; Quantity: number }[];
    PaymentMethod?: "Cash" | "Card" | "Online";
    Notes?: string;
    CustomerID?: string;
  }) => api.post("/snacks/sales", data),
};

export const posApi = {
  sellTickets: (data: {
    SessionID: string;
    SeatIDs: string[];
    PaymentMethod: string;
    CustomerID?: string;
  }) => api.post("/pos/sell-tickets", data),
};

export default api;
