export interface Movie {
  _id: string;
  MovieName: string;
  Genre: string;
  Duration: number;
  AgeLimit: number;
  Description: string;
  PosterURL: string;
  Director: string;
  Cast: string[];
  Rating: number;
  UserRatingAverage?: number;
  UserRatingCount?: number;
  TrailerURL?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Hall {
  _id: string;
  HallName: string;
  Capacity: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  _id: string;
  Name: string;
  Surname: string;
  CI: string;                                     // Añadido
  Gender: 'Male' | 'Female' | 'Other';            // Añadido
  Age: number;                                    // Añadido
  Email: string;
  PhoneNumber: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Seat {
  _id: string;
  HallID: string | Hall;
  RowNumber: string;
  SeatNumber: number;
  ScreenViewInfo: 'Excellent' | 'Good' | 'Average' | 'Poor';
  AcousticProfile: 'Excellent' | 'Good' | 'Average' | 'Poor';
  createdAt?: string;
  updatedAt?: string;
}

export interface MovieSession {
  _id: string;
  MovieID: string | Movie;
  HallID: string | Hall;
  SessionDateTime: string;
  Price: number;
  Language: string;
  SubtitleInfo: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Reservation {
  _id: string;
  CustomerID: string | Customer;
  SessionID: string | MovieSession;
  SeatIDs?: Array<string | Seat>;
  CreationTime: string;
  Status: 'CREATED' | 'PAID' | 'CANCELLED';
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  _id: string;
  ReservationID: string | Reservation;
  PaymentMethod: 'Credit Card' | 'Debit Card' | 'Cash' | 'Online';
  Amount: number;
  PaymentStatus: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  ProcessingTime: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ticket {
  _id: string;
  ReservationID: string | Reservation;
  SeatID: string | Seat;
  TicketCode: string;
  QRCode: string;
  CheckInStatus: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  _id: string;
  CustomerID: string | Customer;
  MovieID: string | Movie;
  ReservationID: string | Reservation;
  Score: number;
  Comment: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  _id: string;
  Username: string;
  Role: 'admin' | 'cajero' | 'cliente';
}
