# Loan Origination System (LOS) – MVP

A frontend MVP of a **Loan Origination System (LOS)** designed to demonstrate the end-to-end lending workflow from customer onboarding to loan disbursement.

## 🚀 Tech Stack

* React
* TypeScript
* Vite
* React Router
* Axios
* TanStack Query
* JSON Server
* CSS

## 🔄 Loan Flow

```text
Customer
   ↓
Loan Application
   ↓
Eligibility Check
   ↓
Credit Check
   ↓
Underwriting
   ↓
Approve / Reject
   ↓
Sanction
   ↓
Ready for Disbursement
   ↓
Disbursement
```

## 👥 Roles

| Role                 | Responsibility                                       |
| -------------------- | ---------------------------------------------------- |
| SALES                | Customer and loan application creation               |
| CREDIT_OFFICER       | Eligibility, credit check, underwriting and sanction |
| DISBURSEMENT_OFFICER | Final loan disbursement                              |

## 🏗️ Architecture

```text
React UI
   ↓
TanStack Query
   ↓
Service Layer
   ↓
Axios
   ↓
JSON Server
   ↓
db.json
```

The application is structured to allow the mock JSON Server API to be replaced later with a **Spring Boot REST API and relational database**.

## ▶️ Running Locally

Install dependencies:

```bash
npm install
```

Start the mock API:

```bash
npm run mock-api
```

Start the frontend in another terminal:

```bash
npm run dev
```

The mock API runs on:

```text
http://localhost:8000
```

## 📁 Main Structure

```text
src/
├── components/
├── pages/
├── hooks/
├── services/
├── types/
└── utils/

db.json
```

## 🎯 Project Goal

This project is an MVP/demo implementation intended to understand **LOS workflow, lending terminology, role-based permissions, frontend architecture, API integration, and the transition from a mock API to a production Spring Boot backend**.
