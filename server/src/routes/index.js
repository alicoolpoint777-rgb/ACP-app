const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const bookingRoutes = require('./bookingRoutes');
const productRoutes = require('./productRoutes');
const purchaseRoutes = require('./purchaseRoutes');
const serviceRoutes = require('./serviceRoutes');
const technicianRoutes = require('./technicianRoutes');
const taskRoutes = require('./taskRoutes');

router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/products', productRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/services', serviceRoutes);
router.use('/technicians', technicianRoutes);
router.use('/tasks', taskRoutes);

module.exports = router;
