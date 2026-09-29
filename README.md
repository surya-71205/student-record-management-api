# 🎓 Student Record Management REST API & Dashboard

> A production-ready, lightweight, full-stack Student Record Management REST API built with Node.js and Express, coupled with an interactive, Linear/Vercel-inspired frontend dashboard. Designed with strict separation of concerns, defensive input validation, atomic JSON persistence, and zero external database dependencies.

[![Node.js Version](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.21.2-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Test Suite](https://img.shields.io/badge/Tests-15%20Passed-emerald)](https://nodejs.org/api/test.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Project Overview

This project was engineered as a comprehensive technical demonstration of a modern **RESTful API** and an accompanying client interface. It provides an end-to-end student record lifecycle management solution with real-time CRUD capabilities, deterministic HTTP response structures, granular validation error diagnostics, and a border-focused responsive dashboard.

The system utilizes an in-memory cache backed by atomic local JSON file persistence (`src/data/students.json`), guaranteeing instant setup, zero external database overhead, and resilient data retention across server restarts.

---

## 🛠️ Tech Stack

### Backend
- **Node.js**: Asynchronous JavaScript runtime (v18+).
- **Express.js**: Minimalist web application framework for routing and middleware orchestration.
- **Node.js Native Crypto**: For RFC 4122 compliant UUID generation (`crypto.randomUUID()`).
- **Node.js Native Test Runner (`node:test`, `node:assert`)**: Fast integration testing with zero external test runners.
- **CORS Middleware**: Cross-Origin Resource Sharing enablement for API interoperability.

### Frontend
- **HTML5**: Semantic markup with native `<dialog>` modals for high accessibility.
- **Tailwind CSS**: Utility-first CSS engine powering a responsive Vercel/Linear dark & light design system.
- **Vanilla JavaScript (ES6+)**: Reactive DOM state management, asynchronous API service layer, and debounce controllers.
- **Lucide Icons**: Feather-weight vector iconography with dynamic runtime icon rendering.

### Storage Architecture
- **In-Memory + Atomic JSON Persistence**: File mutations execute via temporary buffer write and atomic OS-level replacement (`fs.renameSync`) to eliminate partial-write race conditions and data corruption.

---

## ✨ Key Features

1. **Full CRUD Operations**:
   - Create, retrieve (single/all), update, and soft/hard delete student records via standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).
2. **Strict Validation & Input Sanitization**:
   - Defensively trims whitespace, strips malicious inputs, and ensures case-insensitive uniqueness on roll numbers.
   - Restricts academic year to integer values in the range `[1, 4]`.
3. **Robust Error Handling & Standardized Payloads**:
   - Predictable HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).
   - Granular error diagnostics providing informative arrays of error messages (`{ error: string, details: string[] }`).
   - Middleware guard intercepting malformed JSON requests before reaching route handlers.
4. **Advanced Querying & Filtering**:
   - Dynamic multi-field search across student names, roll numbers, and academic departments.
   - Dedicated filtering by department and academic year, plus multi-criteria sorting.
   - Built-in metrics aggregation endpoint (`/api/stats`) and health check (`/api/health`).
5. **Modern, Border-Focused Dashboard**:
   - Full-width fluid responsive layout covering 100% of the display.
   - Smooth **Dark / Light theme** switcher with persistent user preference in `localStorage`.
   - Real-time client-side toast notifications with automated countdown progress bars.
   - Keyboard shortcuts (press `/` anywhere to focus the global search bar).

---

## 📡 API Endpoint Documentation

All endpoints return JSON and are prefixed with `/api`.

| Method | Endpoint | Payload / Query Parameters | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/students` | **Body (JSON)**:<br>`{ name, rollNumber, department, year }` | Creates a new validated student record. Enforces non-empty values and roll number uniqueness. | `201 Created`<br>`400 Bad Request` |
| `GET` | `/api/students` | **Query Params (Optional)**:<br>`search` (string)<br>`department` (string)<br>`year` (1-4)<br>`sortBy` (name\|rollNumber\|year\|createdAt)<br>`order` (asc\|desc) | Retrieves a list of student records matching optional filter, search, and sort criteria. | `200 OK` |
| `GET` | `/api/students/:id` | **Path Param**:<br>`id` (UUID string) | Retrieves full details of a single student by unique record identifier. | `200 OK`<br>`404 Not Found` |
| `PUT` | `/api/students/:id` | **Path Param**:<br>`id` (UUID string)<br>**Body (JSON)**:<br>Any subset of `{ name, rollNumber, department, year }` | Updates an existing student. Verifies updated roll numbers do not conflict with existing records. | `200 OK`<br>`400 Bad Request`<br>`404 Not Found` |
| `DELETE` | `/api/students/:id` | **Path Param**:<br>`id` (UUID string) | Permanently deletes a student record from storage and updates statistics. | `200 OK`<br>`404 Not Found` |
| `GET` | `/api/stats` | *None* | Returns aggregate analytics (total enrollment, department breakdown, year distribution). | `200 OK` |
| `GET` | `/api/health` | *None* | Verifies server operational status, timestamp, and active uptime. | `200 OK` |
| `POST` | `/api/students/reset-demo` | *None* | Restores the database to default pre-seeded demo records. | `200 OK` |

---

## 🛡️ Input Validation & Business Rules

Every incoming payload undergoes programmatic validation before persistence:

| Field | Type | Required | Constraints & Validation Rules |
| :--- | :--- | :---: | :--- |
| `id` | `String` | Auto | RFC 4122 v4 UUID generated server-side. Immutable. |
| `name` | `String` | **Yes** | String length between **2 and 100 characters**. Whitespace trimmed automatically. Supports initials (e.g., `S. Karthik`). |
| `rollNumber` | `String` | **Yes** | Alphanumeric string between **2 and 30 characters**. Case-insensitive uniqueness enforced across all records. Format: `year(4 digits) + dept(2 letters) + roll(4 digits)` (e.g., `2025it0318`). |
| `department` | `String` | **Yes** | Non-empty string between **2 and 100 characters**. Valid academic department selection. |
| `year` | `Number` | **Yes** | Must be an integer strictly within the range **`1` to `4`** (Year 1 to Year 4 undergraduate). |
| `createdAt` | `String` | Auto | ISO 8601 UTC timestamp. Aligns with the admission year of the student. |
| `updatedAt` | `String` | Auto | ISO 8601 UTC timestamp updated on every modification. |

### Sample Validation Error Response (`HTTP 400 Bad Request`)
```json
{
  "error": "Roll number already exists",
  "details": [
    "Roll number '2025it0318' is already registered to R. Priya"
  ]
}
```

---

## 💻 How to Run Locally

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended, tested on Node v24)
- **Git**
- **npm** (comes bundled with Node.js)

### 2. Clone the Repository
```bash
git clone https://github.com/<YOUR_USERNAME>/student-record-management-api.git
cd student-record-management-api
```

### 3. Install Dependencies
```bash
npm install
```
*(On Windows systems with PowerShell script restrictions, run `npm.cmd install`)*

### 4. Run the Automated Integration Test Suite
```bash
npm test
```
*Executes all 15 native integration tests verifying endpoints, error codes, duplicate rejection, and frontend rendering.*

### 5. Launch the Server
```bash
# Production mode
npm start

# Development mode (with live watch auto-reload)
npm run dev
```

### 6. Access the Application
Open your browser and navigate to:
- **Interactive Dashboard**: [http://localhost:3000](http://localhost:3000)
- **REST API Endpoint**: [http://localhost:3000/api/students](http://localhost:3000/api/students)
- **Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 📁 Project Structure

```
student-record-management-api/
├── .gitignore                     # Git ignore rules for node_modules, logs, and OS caches
├── package.json                   # Project metadata, scripts, and dependencies
├── README.md                      # Technical documentation and evaluation guide
├── src/
│   ├── server.js                  # Entry point: HTTP listener and process signal handling
│   ├── app.js                     # Express application configuration and middleware pipeline
│   ├── controllers/
│   │   └── studentController.js   # Route controllers handling business logic and responses
│   ├── middleware/
│   │   ├── validation.js          # Input sanitization and rule validation guards
│   │   └── errorHandler.js        # Global error boundary and JSON parser interceptor
│   ├── models/
│   │   └── studentModel.js        # Data access layer with in-memory caching and atomic writes
│   ├── routes/
│   │   └── studentRoutes.js       # RESTful API routing declarations
│   └── data/
│       └── students.json          # Persistent local JSON data store (pre-seeded)
├── public/
│   ├── index.html                 # Single-page frontend dashboard (Tailwind CSS)
│   ├── css/
│   │   └── styles.css             # Geist typography, theme transitions, animations
│   └── js/
│       └── app.js                 # Frontend API client, state, live search, and modals
└── test/
    └── api.test.js                # Integration test suite powered by node:test
```

---

## 🧪 Quick API Testing (cURL)

```bash
# 1. Fetch all student records
curl http://localhost:3000/api/students

# 2. Create a new student
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"R. Priya","rollNumber":"2025it0318","department":"Information Technology","year":1}'

# 3. Verify duplicate roll number rejection (returns 400 Bad Request)
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Duplicate Test","rollNumber":"2025it0318","department":"Information Technology","year":1}'

# 4. Fetch aggregated statistics
curl http://localhost:3000/api/stats
```

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
