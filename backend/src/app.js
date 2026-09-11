const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const taskRoutes = require('./routes/taskRoutes');
const fieldDataRoutes = require('./routes/fieldDataRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const mapRoutes = require('./routes/mapRoutes');
const locationRoutes = require('./routes/locationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const auditRoutes = require('./routes/auditRoutes');
const searchRoutes = require('./routes/searchRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging in non-test mode
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiter for Auth & Public Endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.', errorCode: 'RATE_LIMITED' }
});
app.use('/api/', apiLimiter);

// Static uploads serving
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// System Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'CaafimaadHub',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes V1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/volunteers', volunteerRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/field-data', fieldDataRoutes);
app.use('/api/v1/training', trainingRoutes);
app.use('/api/v1/certificates', trainingRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/emergencies', emergencyRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/maps', mapRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/upload', uploadRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    errorCode: 'ROUTE_NOT_FOUND'
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
