# Smart Expense Tracker — Backend

Node.js + Express API with MongoDB (Mongoose) and JWT authentication.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment file and edit values:

   ```bash
   cp .env.example .env
   ```

   On Windows (PowerShell):

   ```powershell
   Copy-Item .env.example .env
   ```

3. Set `MONGODB_URI`, `JWT_SECRET`, and optionally `PORT` in `.env`.

4. Start MongoDB locally (or use Atlas) and run the server:

   ```bash
   npm start
   ```

   Development with auto-restart:

   ```bash
   npm run dev
   ```

## API

Protected routes require header: `Authorization: Bearer <token>`

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | No |
| POST | `/api/auth/login` | No |
| POST | `/api/expenses` | Yes |
| GET | `/api/expenses` | Yes |
| PUT | `/api/expenses/:id` | Yes |
| DELETE | `/api/expenses/:id` | Yes |
| POST | `/api/income` | Yes |
| GET | `/api/income` | Yes |

Health check: `GET /api/health`
