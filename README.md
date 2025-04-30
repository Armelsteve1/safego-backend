# 🛡️ SafeGo – Backend API

Welcome to the official backend of **SafeGo**, a secure ride-sharing platform built with NestJS, designed for scalability, security, and seamless developer collaboration.

This repository contains the backend logic, APIs, authentication, user management, trip handling, and media uploads used by the SafeGo application.

> 🚧 This is a **private repository** maintained on GitHub: [`git@github.com:Armelsteve1/safego-backend.git`](git@github.com:Armelsteve1/safego-backend.git)

---

## ⚙️ Tech Stack

| Layer                | Tech                        |
|---------------------|-----------------------------|
| Language            | TypeScript                  |
| Framework           | NestJS                      |
| Database            | PostgreSQL (via TypeORM)    |
| Authentication      | AWS Cognito                 |
| Media Storage       | AWS S3                      |
| Containerization    | Docker + Docker Compose     |
| Validation          | Zod                         |
| Linting & Format    | ESLint + Prettier           |
| Testing             | Jest (E2E)                  |

---

## 🗂️ Project Structure

```
safego-backend/
├── src/
│   ├── auth/           → AWS Cognito-based auth
│   ├── users/          → User management
│   ├── trips/          → Trip creation & search
│   ├── s3/             → S3 image/file upload
│   ├── common/         → Guards, Interceptors, Utils
│   ├── config/         → Environment & service configs
│   └── main.ts         → Application entry point
├── test/               → End-to-end test cases
├── docker-compose.yml  → Local Docker orchestration
├── Dockerfile          → API container config
├── .env                → Env vars (excluded from repo)
```

---

## 🧪 Local Setup (Dev)

### ✅ Prerequisites

- Node.js `v18+`
- npm
- Docker & Docker Compose
- AWS account with:
  - A **Cognito User Pool**
  - A **S3 Bucket**

### 🚀 Steps

```bash
# 1. Clone the private repo
git clone git@github.com:Armelsteve1/safego-backend.git
cd safego-backend

# 2. Install dependencies
npm install

# 3. Create the .env file
cp .env.example .env
# Then update it with your own credentials

# 4. Start the backend + PostgreSQL
docker-compose up --build
```

---

## 🔐 .env Configuration

Create a `.env` file at the root with the following variables:

```env
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/safego

AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
S3_BUCKET_NAME=your-bucket-name

AWS_COGNITO_USER_POOL_ID=your-user-pool-id
AWS_COGNITO_CLIENT_ID=your-client-id
```

---

## 🐳 Docker Usage

To start the full backend environment:

```bash
docker-compose up --build
```

To stop it:

```bash
docker-compose down
```

---

## 🧹 Common Commands

```bash
npm run start:dev      # Start in development mode
npm run lint           # Run ESLint checks
npm run format         # Format code using Prettier
npm run build          # Compile the app
npm run test:e2e       # Run end-to-end tests
```

---

## 🧪 Testing

End-to-end tests are written using **Jest**.

```bash
npm run test:e2e
```

Ensure your `.env.test` is configured properly before running tests.

---

## 🤝 Contributing Guidelines

All collaborators must:

1. Work on a new branch:  
   `git checkout -b feature/your-feature-name`

2. Follow coding standards (`ESLint`, `Prettier`)
3. Document any new endpoints (Swagger coming soon)
4. Create Pull Requests with meaningful messages

---

## 📂 Future Improvements

- Swagger documentation
- CI/CD pipelines
- Unit test coverage
- Request rate limiting
- Role-based permissions

---

## 📬 Contact

If you need access or want to join the team, contact the repository owner:  
**Armel Steve** via GitHub: [`@Armelsteve1`](https://github.com/Armelsteve1)

---

## 📄 License

This project is private and not licensed for public use.
