import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the root directory (parent of backend folder)
const rootDir = path.resolve(__dirname, '..');

console.log('=================================');
console.log('Server starting...');
console.log('__dirname:', __dirname);
console.log('Root directory:', rootDir);
console.log('Current working directory:', process.cwd());
console.log('=================================');

async function startServer() {
  try {
    const app = express();
    const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000

    // Allow requests from both localhost AND your Vercel app
    app.use(cors({
      origin: [
        'http://localhost:3001',
        'http://localhost:3000',
        'https://medihealth-project.vercel.app'
      ],
      credentials: true
    }));

    app.use(express.json());

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        message: 'Server is running from backend/server.js',
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
            tests: ['Blood Test'],
            records: []
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

    app.get("/api/patients/:id/records", (req, res) => {
      res.json([]);
    });

    app.post("/api/patients/:id/records", express.json(), (req, res) => {
      res.status(201).json({ 
        id: 'new', 
        date: new Date().toISOString().split('T')[0], 
        notes: 'Added' 
      });
    });

    // Check if we're in production
    if (process.env.NODE_ENV === "production") {
      // Look for dist folder in multiple locations
      const possibleDistPaths = [
        path.join(rootDir, "dist"),           // ../dist
        path.join(__dirname, "dist"),          // ./backend/dist
        path.join(process.cwd(), "dist")       // current working directory/dist
      ];

      let distPath = null;
      for (const testPath of possibleDistPaths) {
        console.log('Checking for dist at:', testPath);
        if (fs.existsSync(testPath)) {
          distPath = testPath;
          console.log('✅ Found dist at:', distPath);
          break;
        }
      }

      if (distPath) {
        // Serve static files
        app.use(express.static(distPath));
        
        // Handle all non-API routes
        app.get("*", (req, res) => {
          if (!req.path.startsWith('/api')) {
            const indexPath = path.join(distPath, "index.html");
            if (fs.existsSync(indexPath)) {
              res.sendFile(indexPath);
            } else {
              console.log('index.html not found at:', indexPath);
              res.status(404).send('Frontend not built yet');
            }
          }
        });
        console.log('✅ Static file serving configured from:', distPath);
      } else {
        console.log('⚠️ No dist directory found. API only mode.');
      }
    } else {
      // Development mode with Vite
      console.log('Starting in development mode...');
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          fs: {
            strict: false
          }
        },
        appType: "spa",
        root: rootDir, // Point to root directory
      });
      app.use(vite.middlewares);
    }

    // Start server
    app.listen(PORT, "0.0.0.0", () => {
      console.log('=================================');
      console.log('✅ Backend server is running!');
      console.log('📡 Port:', PORT);
      console.log('📍 Server location:', __dirname);
      console.log('🔗 URL: http://localhost:' + PORT);
      console.log('🩺 Health check: http://localhost:' + PORT + '/api/health');
      console.log('=================================');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();