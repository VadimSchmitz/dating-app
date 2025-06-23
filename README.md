# Co-Creation Dating App

A unique dating app that matches people based on their collaborative potential and co-creation compatibility.

## Features

- **Co-Creation Matching Algorithm**: Matches users based on:
  - Shared interests
  - Collaboration style
  - Contribution scores
  - Activity alignment
  - Geographic proximity

- **User Profiles**: Create profiles with interests and co-creation preferences
- **Contribution Tracking**: Users can log contributions to increase their co-creation score
- **Match Breakdown**: See detailed compatibility analysis for each match

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL, Sequelize
- **Frontend**: React, TypeScript
- **Authentication**: JWT

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- PostgreSQL
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd dating-app/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create PostgreSQL database:
   ```sql
   CREATE DATABASE dating_app;
   ```

4. Update `.env` file with your database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=dating_app
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your_secret_key
   ```

5. Run the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd dating-app/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Usage

1. Register a new account with your email, name, age, bio, and interests
2. Browse potential matches based on co-creation compatibility
3. View detailed match breakdowns showing compatibility factors
4. Update your profile and add contributions to increase your co-creation score
5. Connect with matches who share your collaborative interests

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/matches/potential` - Get potential matches
- `POST /api/matches/contribute` - Add contribution

## Co-Creation Matching Algorithm

The algorithm evaluates compatibility based on:
- **Shared Interests (25%)**: Common interests between users
- **Collaboration Style (25%)**: Based on contribution history patterns
- **Contribution Score (20%)**: Overall co-creation activity level
- **Activity Alignment (15%)**: Types of activities users engage in
- **Proximity Score (15%)**: Geographic distance between users