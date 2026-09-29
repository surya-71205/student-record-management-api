const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const {
  validateCreateStudent,
  validateUpdateStudent
} = require('../middleware/validation');

// Specific resource / utility routes first
router.get('/stats', studentController.getStats);
router.post('/reset-demo', studentController.resetDemo);

// Core CRUD API Endpoints
router.get('/', studentController.getAllStudents);
router.post('/', validateCreateStudent, studentController.createStudent);
router.get('/:id', studentController.getStudentById);
router.put('/:id', validateUpdateStudent, studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

module.exports = router;
