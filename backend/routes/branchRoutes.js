const express = require('express');
const { getBranches, addBranch, updateBranch, deleteBranch } = require('../controllers/branchController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route to get branches list
router.get('/', getBranches);

// Super Admin protected routes to manage branches
router.post('/', protect, authorizeRoles('super_admin'), addBranch);
router.put('/:id', protect, authorizeRoles('super_admin'), updateBranch);
router.delete('/:id', protect, authorizeRoles('super_admin'), deleteBranch);

module.exports = router;
