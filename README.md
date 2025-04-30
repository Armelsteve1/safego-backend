# 🛡️ SafeGo – Backend

**SafeGo** is a backend application built with **NestJS**, designed to offer a secure and scalable API. It handles authentication via AWS Cognito, file storage via AWS S3, and data persistence using PostgreSQL.

---

## 🚀 Main Technologies

- **NestJS** (TypeScript)
- **PostgreSQL** (via TypeORM)
- **AWS Cognito** (Authentication)
- **AWS S3** (File Uploads)
- **Docker & Docker Compose**
- **Zod** (Schema validation)
- **Prettier / ESLint** (Code formatting & linting)
- **Jest** (e2e testing)

---

## ⚙️ Requirements

- Node.js (v18+ recommended)
- Docker & Docker Compose
- AWS account (Cognito & S3 access)
- PostgreSQL (locally or via Docker)
- `.env` file with all required environment variables

---

## 📦 Installation

```bash
# 1. Clone the repository (private access required)
git clone git@github.com:<your-org>/safego-backend.git

# 2. Navigate into the project folder
cd safego-backend

# 3. Install dependencies
npm install

# 4. Start the services using Docker
docker-compose up --build


## 🔐 Environment Variables (`.env`)

Create a `.env` file at the root of the project with the following variables:

```
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/safego
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_COGNITO_USER_POOL_ID=...
AWS_COGNITO_CLIENT_ID=...
S3_BUCKET_NAME=...
```

---

## 🧪 Run Tests

```bash
npm run test:e2e
```

---

## 🧹 Useful Scripts

```bash
npm run start:dev     # Start the app in development mode
npm run lint          # Run linter
npm run format        # Format code using Prettier
npm run build         # Build the app
```

---

## 🐳 Docker

The project includes a working Docker and Docker Compose setup. It automatically sets up the API and a PostgreSQL database.

```bash
docker-compose up --build
```

---

## 🧠 Project Structure

```
src/
├── auth/            # Authentication via AWS Cognito
├── users/           # User management
├── trips/           # Trip management
├── s3/              # AWS S3 upload handling
├── common/          # Middlewares, Guards, Interceptors
├── config/          # App configurations
main.ts              # Application entry point
```

---

## 🤝 Contributing

1. Fork this repo (if permitted)
2. Create a new branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to your branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📬 Contact

For access requests or questions, please reach out to the project administrator.
```

---

Let me know if you'd like this inserted into your actual project files.
