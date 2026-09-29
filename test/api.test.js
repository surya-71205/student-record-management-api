const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

let server;
let baseUrl;
let createdStudentId = null;

describe('Student Record Management REST API', () => {
  before(() => {
    return new Promise((resolve) => {
      // Start server on port 0 to choose an open ephemeral port
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(() => {
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  test('GET / serves the sleek frontend dashboard', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('Student Registry'));
    assert.ok(text.includes('studentTableBody'));
  });

  test('GET /api/health returns healthy status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'healthy');
    assert.ok(body.uptime);
  });

  test('GET /api/students returns an array of initial students', async () => {
    const res = await fetch(`${baseUrl}/api/students`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
  });

  test('POST /api/students successfully creates a new student with status 201', async () => {
    const newStudent = {
      name: 'Maya Lin',
      rollNumber: 'CS-2024-TEST-99',
      department: 'Computer Science',
      year: 2
    };

    const res = await fetch(`${baseUrl}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent)
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.id);
    assert.equal(body.data.name, 'Maya Lin');
    assert.equal(body.data.rollNumber, 'CS-2024-TEST-99');
    assert.equal(body.data.department, 'Computer Science');
    assert.equal(body.data.year, 2);

    createdStudentId = body.data.id;
  });

  test('POST /api/students rejects duplicate rollNumber with status 400', async () => {
    const duplicateStudent = {
      name: 'Duplicate Person',
      rollNumber: 'CS-2024-TEST-99', // Already created
      department: 'Civil Engineering',
      year: 1
    };

    const res = await fetch(`${baseUrl}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duplicateStudent)
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'Roll number already exists');
  });

  test('POST /api/students rejects missing required fields with status 400', async () => {
    const incomplete = {
      name: 'Test Incomplete'
      // missing rollNumber, department, year
    };

    const res = await fetch(`${baseUrl}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incomplete)
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'Validation failed');
    assert.ok(Array.isArray(body.details));
  });

  test('POST /api/students rejects year outside 1-4 with status 400', async () => {
    const invalidYearStudent = {
      name: 'Invalid Year',
      rollNumber: 'CS-2024-BAD-YEAR',
      department: 'Computer Science',
      year: 5
    };

    const res = await fetch(`${baseUrl}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidYearStudent)
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'Validation failed');
    assert.ok(body.details.some(d => d.includes('integer between 1 and 4')));
  });

  test('GET /api/students/:id returns single student record', async () => {
    assert.ok(createdStudentId, 'createdStudentId must exist');
    const res = await fetch(`${baseUrl}/api/students/${createdStudentId}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.id, createdStudentId);
    assert.equal(body.data.name, 'Maya Lin');
  });

  test('GET /api/students/:id returns 404 for nonexistent id', async () => {
    const res = await fetch(`${baseUrl}/api/students/non-existent-uuid-12345`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, 'Student not found');
  });

  test('PUT /api/students/:id updates student record with status 200', async () => {
    assert.ok(createdStudentId);
    const updatePayload = {
      name: 'Maya Lin Updated',
      year: 3
    };

    const res = await fetch(`${baseUrl}/api/students/${createdStudentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.name, 'Maya Lin Updated');
    assert.equal(body.data.year, 3);
    assert.equal(body.data.rollNumber, 'CS-2024-TEST-99'); // preserved
  });

  test('PUT /api/students/:id returns 404 for nonexistent id', async () => {
    const res = await fetch(`${baseUrl}/api/students/non-existent-uuid-12345`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Someone' })
    });

    assert.equal(res.status, 404);
  });

  test('GET /api/stats returns statistics metrics', async () => {
    const res = await fetch(`${baseUrl}/api/stats`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(typeof body.data.total === 'number');
    assert.ok(typeof body.data.departments === 'number');
    assert.ok(body.data.yearCounts);
  });

  test('DELETE /api/students/:id deletes student with status 200', async () => {
    assert.ok(createdStudentId);
    const res = await fetch(`${baseUrl}/api/students/${createdStudentId}`, {
      method: 'DELETE'
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.id, createdStudentId);

    // Verify it is no longer retrievable
    const checkRes = await fetch(`${baseUrl}/api/students/${createdStudentId}`);
    assert.equal(checkRes.status, 404);
  });

  test('DELETE /api/students/:id returns 404 for nonexistent id', async () => {
    const res = await fetch(`${baseUrl}/api/students/non-existent-uuid-12345`, {
      method: 'DELETE'
    });
    assert.equal(res.status, 404);
  });

  test('GET /api/nonexistent-route returns 404 Not Found', async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent-route`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, 'Endpoint not found');
  });
});
