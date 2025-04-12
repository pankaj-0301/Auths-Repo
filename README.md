# Authentication System

A modern authentication system built with React and Node.js, featuring JWT authentication and social login options.

## 🚀 Features

- **Authentication Methods**
  - Email/Password with JWT
  - Social Media Integration:
    - Google OAuth
    - Facebook OAuth
  - Password Reset Functionality

- **Secure Backend**
  - JWT-based Authentication
  - Protected Routes
  - Input Validation
  - Error Handling

- **Responsive Frontend**
  - Clean, Modern UI
  - Form Validation
  - Social Media Login Buttons
  - User Profile Management

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google and Facebook Developer Accounts

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/auth-system.git
   cd auth-system
   ```

2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Create `.env` files:

   Backend (.env):
   ```
   PORT=5000
   JWT_SECRET=your_jwt_secret
   
   # OAuth Credentials
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   ```

   Frontend (.env):
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

## 🚀 Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

## 📝 API Documentation

### Authentication Endpoints

#### Register User
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "name": "John Doe"
  }
  ```

#### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```

## 🔒 Security Features

- Password Hashing
- JWT Token Authentication
- Protected Routes
- Input Validation
- XSS Protection

## 📁 Project Structure

```
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── config/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── context/
│  │  └── App.tsx
│  │  └── index.tsx
│   └── public/
└── README.md
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [Passport.js](http://www.passportjs.org/)
