# EduSuccess Educational Platform

An online educational platform for K-12 students that enhances their knowledge across various subjects, serving as a comprehensive marketplace for educational content.

## Project Overview

This platform allows:
- Teachers to upload courses in diverse subjects
- Students to purchase content based on their specific needs
- Interactive learning experiences with video content
- Secure payment processing via Stripe and PayPal

## Key Features

- Authentication with role-based dashboards
- Course listing and search
- Video content playback
- Payment integration (Stripe & PayPal)
- User profiles and progress tracking
- Responsive design for all devices

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom JWT implementation
- **Payment Processing**: Stripe & PayPal integrations

## Project Structure

```
.
├── client/               # Frontend React application
│   ├── src/              # Source code
│   │   ├── components/   # UI components
│   │   ├── context/      # React context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   └── pages/        # Page components
├── server/               # Backend Express server
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database interface
│   └── paypal.ts         # PayPal integration
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema with Drizzle
├── db/                   # Database utilities
│   ├── index.ts          # Database connection
│   └── seed.ts           # Seed data scripts
├── docker-compose.yml    # Docker configuration
├── Dockerfile            # Container definition
└── package.json          # Dependencies and scripts
```

## Docker Setup

This project includes Docker configuration for easy deployment:

```bash
# Clone the repository
git clone https://github.com/iamdevopser/edusuccess.git
cd edusuccess

# Start the containers
docker-compose up -d

# Access the application
# Open http://localhost:5000 in your browser
```

## Environment Variables Required

For local development, ensure these environment variables are set:

- `DATABASE_URL`: PostgreSQL connection string
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `VITE_STRIPE_PUBLIC_KEY`: Stripe publishable key
- `PAYPAL_CLIENT_ID`: PayPal API client ID
- `PAYPAL_CLIENT_SECRET`: PayPal API client secret

## Test Accounts

For testing purposes:
- Teacher: maria@example.com / password123
- Student: john@example.com / password123
