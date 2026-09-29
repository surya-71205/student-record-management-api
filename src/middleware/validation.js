const studentModel = require('../models/studentModel');

/**
 * Validates and sanitizes payload for creating a new student
 */
function validateCreateStudent(req, res, next) {
  let { name, rollNumber, department, year } = req.body || {};
  const errors = [];

  // Sanitize strings
  name = typeof name === 'string' ? name.trim() : '';
  rollNumber = typeof rollNumber === 'string' ? rollNumber.trim() : '';
  department = typeof department === 'string' ? department.trim() : '';

  // Required checks
  if (!name) {
    errors.push('Name is required');
  } else if (name.length < 2 || name.length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }

  if (!rollNumber) {
    errors.push('Roll number is required');
  } else if (!/^[A-Za-z0-9_-]{2,30}$/.test(rollNumber)) {
    errors.push('Roll number must be between 2 and 30 characters (letters, numbers, hyphens, underscores only)');
  }

  if (!department) {
    errors.push('Department is required');
  } else if (department.length < 2 || department.length > 100) {
    errors.push('Department must be between 2 and 100 characters');
  }

  // Year validation (1 - 4)
  if (year === undefined || year === null || year === '') {
    errors.push('Year is required');
  } else {
    const numYear = Number(year);
    if (!Number.isInteger(numYear) || numYear < 1 || numYear > 4) {
      errors.push('Year must be an integer between 1 and 4');
    }
  }

  // If initial field validation fails, return 400 immediately
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  // Uniqueness check for rollNumber
  const existingStudent = studentModel.getByRollNumber(rollNumber);
  if (existingStudent) {
    return res.status(400).json({
      error: 'Roll number already exists',
      details: [`Roll number '${rollNumber}' is already registered to ${existingStudent.name}`]
    });
  }

  // Attach clean sanitized payload
  req.sanitizedBody = {
    name,
    rollNumber,
    department,
    year: Number(year)
  };

  next();
}

/**
 * Validates and sanitizes payload for updating an existing student
 */
function validateUpdateStudent(req, res, next) {
  const { id } = req.params;
  let { name, rollNumber, department, year } = req.body || {};
  const errors = [];
  const sanitized = {};

  const existingStudent = studentModel.getById(id);
  if (!existingStudent) {
    return res.status(404).json({
      error: 'Student not found',
      details: [`No student found with ID '${id}'`]
    });
  }

  // Check if at least one field is provided
  const hasName = name !== undefined;
  const hasRoll = rollNumber !== undefined;
  const hasDept = department !== undefined;
  const hasYear = year !== undefined;

  if (!hasName && !hasRoll && !hasDept && !hasYear) {
    return res.status(400).json({
      error: 'Validation failed',
      details: ['At least one field (name, rollNumber, department, year) must be provided to update']
    });
  }

  if (hasName) {
    name = typeof name === 'string' ? name.trim() : '';
    if (!name) {
      errors.push('Name cannot be empty');
    } else if (name.length < 2 || name.length > 100) {
      errors.push('Name must be between 2 and 100 characters');
    }
    sanitized.name = name;
  }

  if (hasRoll) {
    rollNumber = typeof rollNumber === 'string' ? rollNumber.trim() : '';
    if (!rollNumber) {
      errors.push('Roll number cannot be empty');
    } else if (!/^[A-Za-z0-9_-]{2,30}$/.test(rollNumber)) {
      errors.push('Roll number must be between 2 and 30 characters (letters, numbers, hyphens, underscores only)');
    } else {
      // Check collision with another student
      const duplicateStudent = studentModel.getByRollNumber(rollNumber);
      if (duplicateStudent && duplicateStudent.id !== id) {
        errors.push(`Roll number '${rollNumber}' is already registered to another student (${duplicateStudent.name})`);
      }
    }
    sanitized.rollNumber = rollNumber;
  }

  if (hasDept) {
    department = typeof department === 'string' ? department.trim() : '';
    if (!department) {
      errors.push('Department cannot be empty');
    } else if (department.length < 2 || department.length > 100) {
      errors.push('Department must be between 2 and 100 characters');
    }
    sanitized.department = department;
  }

  if (hasYear) {
    const numYear = Number(year);
    if (!Number.isInteger(numYear) || numYear < 1 || numYear > 4) {
      errors.push('Year must be an integer between 1 and 4');
    }
    sanitized.year = numYear;
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: errors.some(e => e.includes('already registered')) ? 'Roll number already exists' : 'Validation failed',
      details: errors
    });
  }

  req.sanitizedBody = sanitized;
  next();
}

module.exports = {
  validateCreateStudent,
  validateUpdateStudent
};
