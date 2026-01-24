[![GitHub Stars](https://img.shields.io/github/stars/Rheosta561/Automark-Backend?style=flat-square)](https://github.com/Rheosta561/Automark-Backend/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Rheosta561/Automark-Backend?style=flat-square)](https://github.com/Rheosta561/Automark-Backend/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/Rheosta561/Automark-Backend?style=flat-square)](https://github.com/Rheosta561/Automark-Backend/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---
Automark Backend
================

Automark Backend is the server-side system powering Automark, an offline-first,
secure attendance management platform designed for academic institutions.
It handles authentication, attendance orchestration, data synchronization,
and notification delivery.

This repository is written in TypeScript and uses Prisma ORM with PostgreSQL.


--------------------------------------------------
TECH STACK
--------------------------------------------------

- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma ORM
- JWT Authentication (Access & Refresh tokens)
- SMTP (Gmail) for email notifications


--------------------------------------------------
PROJECT STRUCTURE
--------------------------------------------------
```
attendance-system-backend/
│
├── prisma/
│   ├── schema.prisma          # Prisma DB schema
│   └── migrations/            # Database migrations
│
├── src/
│   ├── config/                # App & environment configuration
│   ├── controllers/           # Route business logic
│   ├── middlewares/           # Auth, error handling, guards
│   ├── routers/               # API route definitions
│   ├── types/                 # Shared TypeScript types
│   ├── utils/                 # Helpers (JWT, email, crypto, etc.)
│   ├── validators/            # Request validation logic
│   └── index.ts               # Application entry point
│
├── .env                       # Environment variables
├── prisma.config.ts           # Prisma configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies & scripts
├── package-lock.json
└── README.md
```


--------------------------------------------------
CORE FEATURES
--------------------------------------------------

1. Authentication & Authorization
   - JWT-based authentication
   - Access & Refresh tokens
   - Role-based access (Admin / Faculty / Student)
   - Faculty onboarding using secret key

2. Attendance Management
   - Class creation & scheduling
   - Secure attendance marking
   - Offline-first data sync

3. Data Synchronization
   - Reliable cloud persistence
   - Conflict-safe syncing for offline clients

4. Notifications
   - Email notifications via SMTP
   - System alerts and updates

5. Secure Backend Architecture
   - Prisma ORM
   - PostgreSQL
   - Typed APIs with validation


--------------------------------------------------
ENVIRONMENT VARIABLES
--------------------------------------------------

Create a `.env` file in the project root with the following values:

DATABASE_URL="postgresql://anubhavmishra@localhost:5432/attendance_db"

ACCESS_TOKEN_SECRET="secret"
ACCESS_TOKEN_EXPIRY="15m"

REFRESH_TOKEN_SECRET="refreshsecret"
REFRESH_TOKEN_EXPIRY="7d"

FACULTY_SECRET_KEY="facultysecretkey"

NODE_ENV="development"

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=expeetu
SMTP_PASS=jvkw
EMAIL_FROM="DTU Portal <you>"

IMPORTANT:
Prisma does NOT automatically load .env files.
Ensure this line exists in prisma.config.ts:

import "dotenv/config";


--------------------------------------------------
INSTALLATION & SETUP
--------------------------------------------------

1. Clone the repository

   git clone https://github.com/Rheosta561/Automark-Backend.git
   cd Automark-Backend

2. Install dependencies

   npm install

3. Generate Prisma client

   npx prisma generate

4. Run database migrations

   npx prisma migrate dev

5. Start development server

   npm run dev

Server runs on:
http://localhost:3000


--------------------------------------------------
AUTHENTICATION FLOW
--------------------------------------------------

- Login returns:
  - Access Token (short-lived)
  - Refresh Token (long-lived)

- Access Token:
  Used for all protected API requests

- Refresh Token:
  Used to obtain new access tokens

- Faculty registration requires FACULTY_SECRET_KEY


--------------------------------------------------
EXAMPLE LOGIN REQUEST
--------------------------------------------------
``` bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "faculty@example.com",
  "password": "password"
}


Successful Response:

{
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "faculty@example.com",
      "role": "faculty"
    },
    "accessToken": "JWT_ACCESS_TOKEN",
    "refreshToken": "JWT_REFRESH_TOKEN"
  }
}
```


--------------------------------------------------
EMAIL SYSTEM
--------------------------------------------------

The backend uses SMTP (Gmail) to send:

- Account notifications
- Attendance alerts
- System messages

Note:
Use Gmail App Passwords or allow SMTP access.


--------------------------------------------------
CONTRIBUTING
--------------------------------------------------

1. Fork the repository
2. Create a new branch
   git checkout -b feature/your-feature
3. Commit your changes
4. Open a Pull Request to the main branch

Please ensure:
- No secrets are committed
- Code follows project conventions
- Proper validation is added where needed


## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT). You are free to use, modify, and distribute this software under the terms of this license.


--------------------------------------------------
MAINTAINER
--------------------------------------------------

Anubhav Mishra
Automark Backend
