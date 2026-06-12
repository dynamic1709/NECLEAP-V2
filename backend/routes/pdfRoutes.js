const express = require('express');
const { uploadPdf, getPdfs, approvePdf, getPdfBySlug, deletePdf, getAdminPdfs, updatePdf } = require('../controllers/pdfController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public route to get approved PDFs
router.get('/', getPdfs);
router.get('/:slug', getPdfBySlug);

// Protected routes
router.get('/admin', protect, authorizeRoles('teacher_admin', 'super_admin'), getAdminPdfs);
router.post('/upload', protect, authorizeRoles('teacher_admin', 'super_admin'), upload.handleSingle('pdfFile'), uploadPdf);
router.put('/:id', protect, authorizeRoles('teacher_admin', 'super_admin'), updatePdf);
router.delete('/:id', protect, authorizeRoles('teacher_admin', 'super_admin'), deletePdf);

module.exports = router;
