const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const userRoutes = require('./users');
const doctorRoutes = require('./doctors');
const appointmentRoutes = require('./appointments');
const specialtyRoutes = require('./specialties');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/specialties', specialtyRoutes);

module.exports = router;
