// Mock data store
let patients = [
  {
    id: '1',
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    bloodType: 'O+',
    email: 'john@example.com',
    phone: '555-1234',
    address: '123 Main St',
    status: 'Active',
    comments: 'Regular checkup',
    tests: ['Blood Test', 'X-Ray'],
    records: []
  }
];

export async function updatePatient(patientId: string, updates: any) {
  console.log('Mock update called:', { patientId, updates });
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Find and update patient
  const index = patients.findIndex(p => p.id === patientId);
  if (index === -1) {
    throw new Error('Patient not found');
  }
  
  patients[index] = { ...patients[index], ...updates };
  
  // Simulate random failure (10% chance) for testing
  if (Math.random() < 0.1) {
    throw new Error('Random mock failure');
  }
  
  return patients[index];
}

// Add other mock functions as needed
export async function fetchPatients() {
  await new Promise(resolve => setTimeout(resolve, 300));
  return patients;
}