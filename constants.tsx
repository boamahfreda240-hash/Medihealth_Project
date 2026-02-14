
import React from 'react';

export const Icons = {
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
  ),
  Patients: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  ),
  Share: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
  ),
  Stethoscope: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
  ),
  Brain: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 .98 4.96 2.5 2.5 0 0 0 0 5 2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 1 1 0 2.5 2.5 0 0 0 4.96.46 2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 0 .98-4.96 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5Z"/><path d="M9 10c0-2.5 3-2.5 3-5"/><path d="M15 10c0-2.5-3-2.5-3-5"/><path d="M12 17V12"/></svg>
  )
};

export const SAMPLE_PATIENTS: any[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    age: 42,
    gender: 'Female',
    bloodType: 'O+',
    email: 'sarah.j@example.com',
    phone: '+1 555-0123',
    address: '123 Pine St, Seattle, WA',
    lastVisit: '2023-11-24',
    status: 'Stable',
    records: [
      {
        id: 'r1',
        date: '2023-11-24',
        doctor: 'Dr. Michael Chen',
        diagnosis: 'Seasonal Influenza',
        notes: 'Patient presented with high fever, body aches, and persistent cough. Prescribed rest and fluids.',
        medications: ['Oseltamivir', 'Acetaminophen'],
        vitals: { bp: '120/80', heartRate: '72 bpm', temperature: '101.2°F' }
      }
    ]
  },
  {
    id: '2',
    name: 'Robert Miller',
    age: 65,
    gender: 'Male',
    bloodType: 'A-',
    email: 'rob.miller@example.com',
    phone: '+1 555-0456',
    address: '456 Oak Ln, Portland, OR',
    lastVisit: '2023-12-01',
    status: 'Active',
    records: [
      {
        id: 'r2',
        date: '2023-12-01',
        doctor: 'Dr. Sarah Wilson',
        diagnosis: 'Hypertension Management',
        notes: 'Regular checkup. BP is slightly elevated compared to last visit. Patient advised to reduce salt intake.',
        medications: ['Lisinopril'],
        vitals: { bp: '145/95', heartRate: '68 bpm', temperature: '98.6°F' }
      }
    ]
  }
];

export const HOSPITAL_TESTS = [
  { id: 'blood-test', name: 'Blood Test', icon: '🩸' },
  { id: 'urinal-test', name: 'Urine Test', icon: '🧪' },
  { id: 'xray', name: 'X-Ray', icon: '📋' },
  { id: 'ultrasound', name: 'Ultrasound', icon: '📡' },
  { id: 'ct-scan', name: 'CT Scan', icon: '🔬' },
  { id: 'mri', name: 'MRI Scan', icon: '📡' },
  { id: 'ecg', name: 'ECG (Heart)', icon: '💓' },
  { id: 'eeg', name: 'EEG (Brain)', icon: '🧠' },
  { id: 'endoscopy', name: 'Endoscopy', icon: '🔭' },
  { id: 'biopsy', name: 'Biopsy', icon: '🧬' },
  { id: 'allergy-test', name: 'Allergy Test', icon: '🤧' },
  { id: 'covid-test', name: 'COVID-19 Test', icon: '🦠' },
  { id: 'hepatitis-test', name: 'Hepatitis Test', icon: '⚕️' },
  { id: 'thyroid-test', name: 'Thyroid Test', icon: '🗽' },
  { id: 'glucose-test', name: 'Blood Glucose Test', icon: '📈' },
  { id: 'cholesterol-test', name: 'Cholesterol Test', icon: '❤️' }
];

