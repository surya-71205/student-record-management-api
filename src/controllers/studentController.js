const studentModel = require('../models/studentModel');

/**
 * GET /api/students
 * Fetch all students with optional search, department/year filter, and sorting
 */
function getAllStudents(req, res, next) {
  try {
    const { search, department, year, sortBy, order } = req.query;
    const students = studentModel.getAll({ search, department, year, sortBy, order });
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/students/:id
 * Fetch a single student by UUID
 */
function getStudentById(req, res, next) {
  try {
    const { id } = req.params;
    const student = studentModel.getById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        message: `Student with ID '${id}' does not exist`
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/students
 * Create a new student record
 */
function createStudent(req, res, next) {
  try {
    const newStudent = studentModel.create(req.sanitizedBody);
    res.status(201).json({
      success: true,
      message: 'Student record created successfully',
      data: newStudent
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/students/:id
 * Update an existing student record
 */
function updateStudent(req, res, next) {
  try {
    const { id } = req.params;
    const updatedStudent = studentModel.update(id, req.sanitizedBody);

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        message: `Student with ID '${id}' does not exist`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student record updated successfully',
      data: updatedStudent
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/students/:id
 * Delete a student record
 */
function deleteStudent(req, res, next) {
  try {
    const { id } = req.params;
    const deletedStudent = studentModel.delete(id);

    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        message: `Student with ID '${id}' does not exist`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student record deleted successfully',
      data: deletedStudent
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/stats
 * Get student metrics & breakdown
 */
function getStats(req, res, next) {
  try {
    const stats = studentModel.getStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/students/reset-demo
 * Reset data back to default demo records
 */
function resetDemo(req, res, next) {
  try {
    const demoData = studentModel.resetToDemo();
    res.status(200).json({
      success: true,
      message: 'Database reset to default demo records',
      count: demoData.length,
      data: demoData
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStats,
  resetDemo
};
