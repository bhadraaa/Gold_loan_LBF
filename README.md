# Gold Loan Management System

A full-stack web application for managing gold loan operations across multiple branches. The system allows staff to create and manage loans, record payments, calculate interest, track loan renewals, and generate reports with secure role-based authentication.

---

## Features

- Secure JWT Authentication
- Role-Based Access Control (Owner & Staff)
- Multi-Branch Management
- Customer Management
- Gold Loan Creation
- Loan Disbursement Tracking
- Interest Calculation
- Loan Renewal
- Payment Management
- Dashboard & Reports
- Activity Logging
- Responsive React UI

---

## Tech Stack

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- Axios

### Backend
- Node.js
- Express.js
- JWT Authentication
- REST APIs

### Database
- PostgreSQL

### Tools
- Git
- GitHub
- Postman
- VS Code

---

## Project Architecture

```
React Frontend
      │
      ▼
Axios API Calls
      │
      ▼
Express REST API
      │
      ▼
JWT Authentication
      │
      ▼
Controllers
      │
      ▼
PostgreSQL Database
```

---

## Database Design

Main tables include:

- Users
- Branches
- Customers
- Loans
- Loan Disbursements
- Payments
- Activity Logs

### Highlights

- Separate Loan Disbursement table for maintaining an immutable financial history.
- Loan renewals create new loan records instead of updating existing ones.
- Branch-based access control for multi-branch operation.
- Database normalized to Third Normal Form (3NF).

---

## Authentication Flow

```
User Login
      │
      ▼
JWT Generated
      │
      ▼
Stored on Client
      │
      ▼
Axios sends JWT in Authorization Header
      │
      ▼
Express Middleware validates token
      │
      ▼
Protected APIs executed
```

---

## Loan Creation Flow

```
Create Loan
      │
      ▼
Validate Customer
      │
      ▼
Calculate Eligible Loan Amount
      │
      ▼
Calculate Interest Rate
      │
      ▼
Start PostgreSQL Transaction
      │
      ▼
Insert Loan
      │
      ▼
Insert Loan Disbursement
      │
      ▼
Write Activity Log
      │
      ▼
Commit Transaction
```

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
```

### Backend

```bash
cd backend

npm install

npm start
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

## API Examples

### Login

```
POST /login
```

### Create Loan

```
POST /loan
```

### Get Customers

```
GET /customers
```

### Record Payment

```
POST /payment
```

### Renew Loan

```
POST /loan/renew
```

---

## Security Features

- JWT Authentication
- Password Hashing
- Protected Routes
- Role-Based Authorization
- Input Validation
- Database Transactions
- SQL Injection Prevention using Parameterized Queries

---

## Future Improvements

- Service Layer Architecture
- Centralized Error Handling
- Refresh Tokens
- Rate Limiting
- Automated Unit & Integration Tests
- Docker Deployment

---

## Author

**Bhadra J**

B.Tech Computer Science Engineering

GitHub: https://github.com/<your-username>

LinkedIn: https://linkedin.com/in/<your-profile>
