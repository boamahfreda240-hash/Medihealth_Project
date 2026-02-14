export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4001/api';

export async function fetchPatients() {
  const res = await fetch(`${API_BASE}/patients`);
  return res.json();
}

export async function createPatient(patient) {
  const res = await fetch(`${API_BASE}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patient)
  });
  return res.json();
}

export async function archivePatient(id) {
  const res = await fetch(`${API_BASE}/patients/${id}/archive`, { method: 'PUT' });
  return res.json();
}

export async function fetchRecords(patientId) {
  const res = await fetch(`${API_BASE}/patients/${patientId}/records`);
  return res.json();
}

export async function createRecord(patientId, record) {
  const res = await fetch(`${API_BASE}/patients/${patientId}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  return res.json();
}

export async function archiveRecord(patientId, recordId) {
  const res = await fetch(`${API_BASE}/patients/${patientId}/records/${recordId}/archive`, { method: 'PUT' });
  return res.json();
}

export async function fetchAttachments(patientId) {
  const res = await fetch(`${API_BASE}/patients/${patientId}/attachments`);
  return res.json();
}

export async function deletePatient(patientId) {
  const res = await fetch(`${API_BASE}/patients/${patientId}`, { method: 'DELETE' });
  return res.json();
}

export async function updatePatient(patientId, updates) {
  const res = await fetch(`${API_BASE}/patients/${patientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return res.json();
}
