const express = require('express');
const { getTeachers, createTeacher, deleteTeacher } = require('../controllers/teacherController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, authorizeRoles('super_admin'), getTeachers);
router.post('/', protect, authorizeRoles('super_admin'), createTeacher);
router.delete('/:id', protect, authorizeRoles('super_admin'), deleteTeacher);

module.exports = router;
