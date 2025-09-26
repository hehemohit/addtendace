# MERN Employee Attendance System

A comprehensive Employee Attendance System built with the MERN stack (MongoDB, Express.js, React.js, Node.js) with Vite as the build tool.

## Features

### Core Functionalities
- **User Management**: Admin can create, view, and manage employees
- **Authentication**: Secure login with JWT tokens and role-based access control
- **Automatic Attendance Tracking**: Auto clock-in on login and clock-out on logout
- **Manual Attendance Management**: Admin can manually edit attendance records
- **Real-time Dashboard**: Live attendance overview for admins
- **Attendance History**: View and filter attendance records by date
- **Reporting**: Comprehensive attendance statistics and reports

### User Roles
- **Employee**: Can view their attendance status and history
- **Admin**: Full access to employee management and attendance oversight

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- CORS for cross-origin requests

### Frontend
- React.js with Vite
- React Router for navigation
- Axios for API calls
- Tailwind CSS for styling
- Context API for state management

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd attendace
```

### 2. Install dependencies

#### Backend dependencies
```bash
cd backend
npm install
```

#### Frontend dependencies
```bash
cd .. # Go back to root directory
npm install
```

### 3. Environment Setup

Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/attendance_system
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

### 4. Database Setup

Make sure MongoDB is running on your system. The application will automatically create the database and collections.

### 5. Create Admin User

Run the seed script to create an admin user:
```bash
cd backend
node seed.js
```

This will create an admin user with:
- Email: admin@company.com
- Password: admin123

### 6. Start the Application

#### Start the backend server
```bash
cd backend
npm run dev
```
The backend will run on http://localhost:5000

#### Start the frontend development server
```bash
# In a new terminal, from the root directory
npm run dev
```
The frontend will run on http://localhost:5173

## Usage

### Admin Login
1. Go to http://localhost:5173
2. Login with admin credentials:
   - Email: admin@company.com
   - Password: admin123

### Admin Features
- **Dashboard**: View today's attendance overview
- **Employee Management**: Create, view, and manage employees
- **Attendance Records**: View and edit all attendance records
- **Manual Corrections**: Edit clock-in/out times and status

### Employee Features
- **Dashboard**: View current attendance status and history
- **Automatic Tracking**: Attendance is automatically recorded on login/logout

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify` - Verify token

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new employee
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Attendance
- `GET /api/attendance/my-attendance` - Get current user's attendance
- `GET /api/attendance` - Get all attendance records (Admin)
- `GET /api/attendance/today-overview` - Get today's overview (Admin)
- `PUT /api/attendance/:id` - Update attendance record (Admin)
- `POST /api/attendance/manual` - Create manual attendance (Admin)

## Project Structure

```
attendace/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Attendance.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   └── attendance.js
│   ├── middleware/
│   │   └── auth.js
│   ├── config.js
│   ├── server.js
│   └── seed.js
├── src/
│   ├── components/
│   │   └── ProtectedRoute.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── EmployeeDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── Unauthorized.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   │   └── helpers.js
│   ├── App.jsx
│   └── main.jsx
└── README.md
```

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Role-based access control
- Protected routes
- Input validation
- CORS configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@company.com or create an issue in the repository.