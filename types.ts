
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodType: string;
  email: string;
  phone: string;
  address: string;
  lastVisit: string;
  status: 'Active' | 'Stable' | 'Critical' | 'Discharged';
  records: MedicalRecord[];
  comments?: string;
  attachments?: { id: string; name: string; dataUrl: string }[];
  tests?: string[];
  archived?: boolean;
}

export interface MedicalRecord {
  id: string;
  date: string;
  doctor: string;
  diagnosis: string;
  notes: string;
  comment?: string;
  medications: string[];
  vitals?: {
    bp: string;
    heartRate: string;
    temperature: string;
  };
  archived?: boolean;
}

export interface AIAnalysis {
  summary: string;
  riskFactors: string[];
  suggestedFollowUp: string;
  confidence: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PATIENTS = 'PATIENTS',
  PATIENT_DETAIL = 'PATIENT_DETAIL',
  NEW_PATIENT = 'NEW_PATIENT',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS'
}
