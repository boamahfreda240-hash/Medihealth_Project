// test-backend.js
async function testBackend() {
  const API_BASE = 'http://localhost:4001/api';
  
  try {
    // Test GET request
    console.log('Testing GET /patients...');
    const getRes = await fetch(`${API_BASE}/patients`);
    console.log('GET Status:', getRes.status);
    
    if (getRes.ok) {
      const data = await getRes.json();
      console.log('GET Response:', data);
    } else {
      console.log('GET failed:', await getRes.text());
    }
    
    // If you have a specific patient ID, test PUT
    const testPatientId = 'some-patient-id'; // Replace with actual ID
    console.log(`\nTesting PUT /patients/${testPatientId}...`);
    const putRes = await fetch(`${API_BASE}/patients/${testPatientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Update' })
    });
    console.log('PUT Status:', putRes.status);
    
    if (!putRes.ok) {
      const errorText = await putRes.text();
      console.log('PUT failed:', errorText);
    } else {
      const data = await putRes.json();
      console.log('PUT Response:', data);
    }
    
  } catch (error) {
    console.error('Network Error - Is your backend running?', error.message);
  }
}

testBackend();