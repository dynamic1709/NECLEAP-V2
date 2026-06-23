const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Load env vars
dotenv.config();

// Note: Supabase client is initialized when imported in controllers or routes
// so no explicit connect function is required like MongoDB.

const app = express();

// Trust proxy for Render/reverse proxies to detect HTTPS correctly
app.set('trust proxy', true);

// Security Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  frameguard: false, // Disable X-Frame-Options to allow local fallback PDF iframe embeds
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads for offline storage fallback mode
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 100, // Increase limit to 10000 in dev
  validate: { trustProxy: false }
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/pdfs', require('./routes/pdfRoutes'));
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));

// Serve static files from the React frontend app
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    // Disable caching for index.html so updates are fetched immediately
    if (path.basename(filePath) === 'index.html') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
  }
}));

// Handle React SPA routing - redirect all non-API requests to index.html
app.get('/*any', (req, res) => {
  // If the request is for an API route that wasn't matched, return 404
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.sendFile(indexPath);
  } else {
    res.send('NECLEAP API is running... (Frontend build not found)');
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
