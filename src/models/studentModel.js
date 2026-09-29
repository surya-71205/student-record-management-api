const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, '..', 'data', 'students.json');

// Default seed data for initial setup or reset with authentic Tamil student names
// Roll number format: year(4digits) + dept(2letters) + random numbers(4digits) e.g. 2025it0318
// Created dates coincide with student admission year (Year 1 = 2025, Year 2 = 2024, Year 3 = 2023, Year 4 = 2022)
const SEED_DATA = [
  {
    id: "e4a1c6a2-9b2a-4a21-8f1a-1d2a3b4c5e01",
    name: "S. Karthik",
    rollNumber: "2022cs0014",
    department: "Computer Science",
    year: 4,
    createdAt: "2022-08-10T09:30:00.000Z",
    updatedAt: "2022-08-10T09:30:00.000Z"
  },
  {
    id: "f5b2d7b3-0c3b-4b32-9a2b-2e3b4c5d6f02",
    name: "K. Ananya",
    rollNumber: "2023ec0088",
    department: "Electronics & Communication",
    year: 3,
    createdAt: "2023-09-01T11:15:00.000Z",
    updatedAt: "2023-09-01T11:15:00.000Z"
  },
  {
    id: "a6c3e8c4-1d4c-4c43-ab3c-3f4c5d6e7a03",
    name: "M. Vignesh",
    rollNumber: "2024ai0205",
    department: "Artificial Intelligence",
    year: 2,
    createdAt: "2024-07-20T14:45:00.000Z",
    updatedAt: "2024-07-20T14:45:00.000Z"
  },
  {
    id: "b7d4f9d5-2e5d-4d54-bc4d-4a5d6e7f8b04",
    name: "R. Priya",
    rollNumber: "2025it0318",
    department: "Information Technology",
    year: 1,
    createdAt: "2025-10-05T08:20:00.000Z",
    updatedAt: "2025-10-05T08:20:00.000Z"
  },
  {
    id: "c8e5a0e6-3f6e-4e65-cd5e-5b6e7f8a9c05",
    name: "T. Saravanan",
    rollNumber: "2023me0199",
    department: "Mechanical Engineering",
    year: 3,
    createdAt: "2023-08-22T16:00:00.000Z",
    updatedAt: "2023-08-22T16:00:00.000Z"
  },
  {
    id: "d9f6b1f7-4a7f-5f76-de6f-6c7f8a9b0d06",
    name: "A. Kaviya",
    rollNumber: "2024cs0047",
    department: "Computer Science",
    year: 2,
    createdAt: "2024-09-12T10:00:00.000Z",
    updatedAt: "2024-09-12T10:00:00.000Z"
  },
  {
    id: "ea07c2a8-5b8a-6a87-ef7a-7d8a9b0c1e07",
    name: "P. Dinesh Kumar",
    rollNumber: "2022ec0125",
    department: "Electronics & Communication",
    year: 4,
    createdAt: "2022-07-18T13:20:00.000Z",
    updatedAt: "2022-07-18T13:20:00.000Z"
  },
  {
    id: "fb18d3b9-6c9b-7b98-f08b-8e9b0c1d2f08",
    name: "V. Abirami",
    rollNumber: "2025cs0142",
    department: "Computer Science",
    year: 1,
    createdAt: "2025-10-02T15:40:00.000Z",
    updatedAt: "2025-10-02T15:40:00.000Z"
  }
];

class StudentModel {
  constructor() {
    this.students = [];
    this.initStorage();
  }

  /**
   * Initialize local JSON storage and load data into memory
   */
  initStorage() {
    try {
      const dataDir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (!fs.existsSync(DATA_FILE)) {
        this.saveToFile(SEED_DATA);
        this.students = [...SEED_DATA];
      } else {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        this.students = JSON.parse(fileContent);
      }
    } catch (err) {
      console.warn('[StudentModel] File storage warning, falling back to in-memory store:', err.message);
      this.students = [...SEED_DATA];
    }
  }

  /**
   * Persist current in-memory records to the local JSON file
   */
  saveToFile(data) {
    try {
      const tempFile = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DATA_FILE);
    } catch (err) {
      // Fallback direct write
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }
  }

  /**
   * Fetch all students with optional search, filtering, and sorting
   * @param {Object} queryParams
   * @returns {Array} List of students
   */
  getAll({ search, department, year, sortBy = 'createdAt', order = 'desc' } = {}) {
    let result = [...this.students];

    // Search filter across name, rollNumber, department
    if (search && search.trim() !== '') {
      const term = search.trim().toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.rollNumber.toLowerCase().includes(term) ||
        s.department.toLowerCase().includes(term)
      );
    }

    // Department filter
    if (department && department.trim() !== '') {
      result = result.filter(s =>
        s.department.toLowerCase() === department.trim().toLowerCase()
      );
    }

    // Year filter (1 - 4)
    if (year !== undefined && year !== null && year !== '') {
      const numericYear = Number(year);
      if (!isNaN(numericYear)) {
        result = result.filter(s => s.year === numericYear);
      }
    }

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }

  /**
   * Get single student by ID
   * @param {string} id
   * @returns {Object|null}
   */
  getById(id) {
    return this.students.find(s => s.id === id) || null;
  }

  /**
   * Get student by Roll Number (case-insensitive check)
   * @param {string} rollNumber
   * @returns {Object|null}
   */
  getByRollNumber(rollNumber) {
    if (!rollNumber) return null;
    const normalized = rollNumber.trim().toLowerCase();
    return this.students.find(s => s.rollNumber.toLowerCase() === normalized) || null;
  }

  /**
   * Create a new student record
   * @param {Object} data - { name, rollNumber, department, year }
   * @returns {Object} Newly created student
   */
  create({ name, rollNumber, department, year }) {
    const now = new Date().toISOString();
    const newStudent = {
      id: crypto.randomUUID(),
      name: name.trim(),
      rollNumber: rollNumber.trim(),
      department: department.trim(),
      year: Number(year),
      createdAt: now,
      updatedAt: now
    };

    this.students.unshift(newStudent);
    this.saveToFile(this.students);
    return newStudent;
  }

  /**
   * Update student details by ID
   * @param {string} id
   * @param {Object} updates
   * @returns {Object|null} Updated student or null if not found
   */
  update(id, { name, rollNumber, department, year }) {
    const index = this.students.findIndex(s => s.id === id);
    if (index === -1) return null;

    const current = this.students[index];
    const updatedStudent = {
      ...current,
      name: name !== undefined ? name.trim() : current.name,
      rollNumber: rollNumber !== undefined ? rollNumber.trim() : current.rollNumber,
      department: department !== undefined ? department.trim() : current.department,
      year: year !== undefined ? Number(year) : current.year,
      updatedAt: new Date().toISOString()
    };

    this.students[index] = updatedStudent;
    this.saveToFile(this.students);
    return updatedStudent;
  }

  /**
   * Delete student record by ID
   * @param {string} id
   * @returns {Object|null} Deleted student or null if not found
   */
  delete(id) {
    const index = this.students.findIndex(s => s.id === id);
    if (index === -1) return null;

    const [deletedStudent] = this.students.splice(index, 1);
    this.saveToFile(this.students);
    return deletedStudent;
  }

  /**
   * Aggregate statistics for dashboard summary cards
   */
  getStats() {
    const total = this.students.length;
    const departmentCounts = {};
    const yearCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };

    this.students.forEach(s => {
      departmentCounts[s.department] = (departmentCounts[s.department] || 0) + 1;
      if (yearCounts[s.year] !== undefined) {
        yearCounts[s.year] += 1;
      }
    });

    return {
      total,
      departments: Object.keys(departmentCounts).length,
      departmentCounts,
      yearCounts
    };
  }

  /**
   * Reset store back to initial seed data
   */
  resetToDemo() {
    this.students = JSON.parse(JSON.stringify(SEED_DATA));
    this.saveToFile(this.students);
    return this.students;
  }
}

module.exports = new StudentModel();
