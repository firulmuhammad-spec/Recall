import { Timestamp } from 'firebase/firestore';

export type Status = 'Arsip' | 'Menunggu' | 'Urgent';

export interface RecallPackage {
  id: string;
  foto: string[]; // Base64 strings
  judul: string;
  deskripsi: string;
  kategori: string;
  klien: string;
  tags: string[];
  tanggalInput: Timestamp | Date;
  tanggalPengambilan?: string;
  lokasi?: string;
  status: Status;
  bulanTahunTarget?: string; // Format YYYY-MM
}

export interface AppSettings {
  id: 'settings';
  categories: string[];
  availableTags: string[];
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  role: 'Admin' | 'User';
  preferences: {
    viewMode: 'grid' | 'list' | 'gallery';
    sortBy: string;
  };
  createdAt: any;
}
