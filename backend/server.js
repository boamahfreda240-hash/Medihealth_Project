const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4001;  // Use Render's port or fallback to 4001

// Allow requests from both localhost AND your Vercel app
app.use(cors({
  origin: [
    'http://localhost:3001',
    'https://medihealth-project.vercel.app'  // Add your Vercel URL here
  ],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    time: new Date().toISOString()
  });
});

// Get all patients
app.get('/api/patients', (req, res) => {
  res.json({
    success: true,
    data: [
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
        comments: 'Test patient',
        tests: ['Blood Test']
      }
    ]
  });
});

// Update patient
app.put('/api/patients/:id', (req, res) => {
  console.log('Updating patient:', req.params.id);
  console.log('Update data:', req.body);
  
  res.json({
    success: true,
    data: {
      id: req.params.id,
      ...req.body
    },
    message: 'Patient updated successfully'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('=================================');
  console.log('Backend server is running!');
  console.log('URL: http://localhost:' + PORT);
  console.log('Health check: http://localhost:' + PORT + '/api/health');
  console.log('=================================');
});