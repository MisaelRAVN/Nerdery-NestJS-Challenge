# Nerdery-NestJS-Challenge: T-Shirt Store

This is a backend API for a small online **T-shirt store**, built using **NestJS** and **GraphQL**. The application simulates a small online store and provides features for both managers and clients. It supports user authentication, product management, shopping cart functionality, Stripe payment integration, and more.

## Features
- Authentication (sign up, log in, log out, password reset)
- Product listing with pagination and category search
- Role-based access: Manager & Client
- Manager capabilities:
  - Create, update, delete, disable products
  - View client orders
  - Upload product images
- Client capabilities:
  - Browse and search products (even when not logged in)
  - Add products to cart
  - Like, and purchase products
- Stripe integration for payments
- Security via Helmet, and CORS

## Installation

1. Clone the repository

```
git clone https://github.com/MisaelRAVN/Nerdery-NestJS-Challenge
cd Nerdery-NestJS-Challenge
```

2. Install dependencies

```
npm install
```

3. Configure environment variables

Refer to the [Configuration](#configuration) section for more instructions on how to set up the environment variables.

4. Set up a database

Generate the Prisma client and migrate the database:

```
npx prisma generate
npx prisma migrate dev --name init
```

5. Start the development server

```
npm run dev:start
```

A GraphQL playground will be available at `http://localhost:3000/graphql` by default, unless specified different by the environment variables.

## Configuration

The application relies on several environment variables for database access, authentication, third-party services, and more. Create a `.env` file in the root directory or use the provided `.env.example` and define the following:

```
# App
PORT=3000

# Database
DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database>

# JWT Access Tokens
ACCESS_TOKEN_SECRET=your-access-token-secret
ACCESS_TOKEN_EXPIRES_IN=30s

# JWT Refresh Tokens (optional)
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=3h

# Password Reset Tokens
PASSWORD_RESET_TOKEN_SECRET=your-password-reset-token-secret
PASSWORD_RESET_TOKEN_EXPIRES_IN=10m

# Frontend (used for password reset links, etc.)
FRONTEND_URL=https://your-frontend-url.com

# Stripe
STRIPE_API_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email (for password reset, stock alerts, etc.)
MAIL_HOST=smtp.your-email-provider.com
MAIL_USER=your@email.com
MAIL_PASS=your-email-password
MAIL_FROM='T-Shirt Store <no-reply@yourdomain.com>'
```
