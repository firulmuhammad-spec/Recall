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
