const express = require('express');
const { getSubjects, addSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', getSubjects);
router.post('/', protect, authorizeRoles('super_admin', 'teacher_admin'), upload.handleArray('pdfFiles', 10), addSubject);
router.put('/:id', protect, authorizeRoles('super_admin', 'teacher_admin'), upload.handleArray('pdfFiles', 10), updateSubject);
router.delete('/:id', protect, authorizeRoles('super_admin', 'teacher_admin'), deleteSubject);

module.exports = router;
