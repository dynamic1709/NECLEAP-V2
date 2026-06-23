const express = require('express');
const { uploadPdf, getPdfs, approvePdf, getPdfBySlug, deletePdf, getAdminPdfs, updatePdf } = require('../controllers/pdfController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public routes
router.get('/', getPdfs);

// Protected routes
router.get('/admin', protect, authorizeRoles('teacher_admin', 'super_admin'), getAdminPdfs);
router.post('/upload', protect, authorizeRoles('teacher_admin', 'super_admin'), upload.handleSingle('pdfFile'), uploadPdf);
router.put('/:id', protect, authorizeRoles('teacher_admin', 'super_admin'), updatePdf);
router.delete('/:id', protect, authorizeRoles('teacher_admin', 'super_admin'), deletePdf);

// Public dynamic routes (parameterized routes should be defined last)
router.get('/:slug', getPdfBySlug);

module.exports = router;
