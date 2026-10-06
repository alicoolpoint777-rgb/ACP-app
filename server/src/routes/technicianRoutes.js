const express = require('express');
const router = express.Router();
const {
  listTechnicians,
  createTechnician,
  updateTechnician,
  deleteTechnician,
  myTechnicianProfile,
  technicianProfile,
  updateMyStatus,
} = require('../controllers/technicianController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Tech can see their own profile and update status
router.get('/me', authorize('technician'), myTechnicianProfile);
router.patch('/me/status', authorize('technician'), updateMyStatus);

// Admin only routes
router.use(authorize('admin'));
router.get('/', listTechnicians);
router.post('/', createTechnician);
router.put('/:id', updateTechnician);
router.delete('/:id', deleteTechnician);
router.get('/:id/profile', technicianProfile);

module.exports = router;
