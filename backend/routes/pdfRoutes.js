const express = require('express');
const { uploadPdf, getPdfs, approvePdf, getPdfBySlug, deletePdf, getAdminPdfs } = require('../controllers/pdfController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public route to get approved PDFs
router.get('/', getPdfs);
router.get('/:slug', getPdfBySlug);

// Protected routes
router.get('/admin', protect, authorizeRoles('teacher_admin', 'super_admin'), getAdminPdfs);
router.post('/upload', protect, authorizeRoles('teacher_admin', 'super_admin'), upload.single('pdfFile'), uploadPdf);
router.delete('/:id', protect, authorizeRoles('teacher_admin', 'super_admin'), deletePdf);

module.exports = router;
