# 🎭 Rehearsal Scheduler

**A comprehensive theater production management app with Google Calendar integration**  
*by Seth Haycock-Poller for CS153a Brandeis University*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-rehearsal--scheduler.onrender.com-blue?style=for-the-badge&logo=globe)](https://rehearsal-scheduler.onrender.com)

## 🌟 Overview

Rehearsal Scheduler is a full-stack web and mobile application designed to streamline theater production management. Built specifically for Brandeis University's Boris' Kitchen theater group, it helps directors, actors, and production staff coordinate rehearsals, manage actor availability, and organize scene assignments efficiently.

### 🆕 **Recent Major Updates**

- **Enhanced Error Handling**: Professional error modals with detailed feedback
- **Google Calendar Integration**: Import availability from personal calendars
- **Improved Authentication**: Better error messages and Google OAuth setup
- **Database Optimization**: Fixed schema issues and improved performance
- **UI Polish**: Removed debug information and improved user experience

### 🎯 **Live Application**

**Visit: [rehearsal-scheduler.onrender.com](https://rehearsal-scheduler.onrender.com)**

The app is deployed and ready to use! No installation required for the web version.

## ✨ Key Features

### 👥 **Actor Management**

- **Profile Creation**: Actors can create detailed profiles with contact information
- **Availability Tracking**: Set and update time slot availability for rehearsals
- **Google Calendar Sync**: Import your availability directly from Google Calendar
- **Scene Assignment**: Manage which scenes each actor is involved in
- **Role Management**: Distinguish between actors, directors, and administrators

### 📅 **Rehearsal Scheduling**

- **Smart Scheduling**: Create rehearsals with automatic actor availability checking
- **Conflict Detection**: Visual indicators for scheduling conflicts
- **Multiple Scenes**: Schedule rehearsals with multiple scenes and actors
- **Time Management**: Organize rehearsals by time slots and dates
- **Calendar Integration**: View and manage rehearsals alongside personal events

### 🔐 **Authentication & Authorization**

- **Google OAuth**: Secure login with Google accounts (with proper error handling)
- **Email/Password Login**: Traditional authentication with detailed error messages
- **Role-Based Access**: Different permissions for actors, directors, and admins
- **Professional Error Handling**: Clear feedback on login failures
- **Session Persistence**: Stay logged in across browser sessions

### 🎨 **Modern User Interface**

- **Cross-Platform**: Works on web browsers, tablets, and mobile devices
- **Responsive Design**: Optimized for all screen sizes
- **Professional Error Modals**: Custom error dialogs instead of basic alerts
- **Intuitive Navigation**: Tab-based navigation with clear visual hierarchy
- **Real-Time Updates**: Live data synchronization across devices

### 🔧 **Administrative Tools**

- **Scene Management**: Create, edit, and organize production scenes
- **Time Slot Configuration**: Set up rehearsal time blocks
- **Actor Administration**: Manage actor profiles and assignments
- **Production Overview**: Dashboard with scheduling insights
- **System Health**: Monitoring and error tracking

## 🚀 Getting Started

### 🌐 **Use the Live App (Recommended)**

1. **Visit**: [rehearsal-scheduler.onrender.com](https://rehearsal-scheduler.onrender.com)
2. **Sign In**: Use Google OAuth or email/password authentication
3. **Set Up Profile**: Complete your actor/director profile
4. **Start Scheduling**: Begin creating and managing rehearsals!

### � **Google OAuth Setup**

For Google Sign-In to work, you may need to be added as a test user while the app is in development mode:

1. **Quick Access**: If you get an "Access blocked" error, contact the administrator to be added as a test user
2. **Setup Guide**: See `GOOGLE_OAUTH_SETUP.md` for detailed instructions
3. **Alternative**: Use email/password authentication which works immediately

### �💻 **Local Development Setup**

#### Prerequisites

- **Node.js** (≥18.0.0)
- **npm** (≥8.0.0)
- **MongoDB** (for backend database)
- **Google OAuth Credentials** (for authentication)

#### Frontend Setup

```bash
# Clone the repository
git clone <repository-url>
cd Rehearsal-Scheduler

# Install dependencies
npm install

# Start the Expo development server
npm start
```

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Create .env file with required variables
cp .env.example .env
# Edit .env with your MongoDB URI and Google OAuth credentials

# Start the backend server
npm run dev
```

#### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/rehearsal-scheduler

# Authentication
JWT_SECRET=your-jwt-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# API Configuration
NODE_ENV=development
PORT=3000
```

## 📱 Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| **Web Browser** | ✅ Full Support | Primary deployment target |
| **Mobile Web** | ✅ Full Support | Responsive design optimized |
| **Android App** | 🔄 Development | Expo build available |
| **iOS App** | 🔄 Development | Expo build available |
| **Desktop** | ✅ Full Support | Works in all modern browsers |

## 🎭 How to Use

### **For Actors**
1. **Create Profile**: Sign in and complete your actor profile
2. **Set Availability**: Mark which time slots you're available for rehearsals
3. **Join Scenes**: Indicate which scenes you're cast in
4. **View Schedule**: Check your upcoming rehearsals and commitments

### **For Directors**
1. **Manage Cast**: Add and organize actor profiles
2. **Schedule Rehearsals**: Create rehearsals with scene and actor assignments
3. **Track Availability**: See actor availability for optimal scheduling
4. **Resolve Conflicts**: Identify and resolve scheduling conflicts

### **For Administrators**
1. **System Setup**: Configure time slots and production scenes
2. **User Management**: Manage user roles and permissions
3. **Data Overview**: Access comprehensive production scheduling data
4. **System Maintenance**: Monitor app performance and user activity

## 🛠 Technical Stack

### **Frontend**
- **React Native** with Expo for cross-platform development
- **TypeScript** for type safety and better development experience
- **Expo Router** for navigation and routing
- **AsyncStorage** for local data persistence

### **Backend**

- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM for data persistence
- **JWT** for secure authentication
- **Google OAuth 2.0** with enhanced error handling
- **Google Calendar API** for availability import
- **CORS** enabled for cross-origin requests
- **Professional Error Handling** with detailed error messages

### **Deployment**

- **Frontend**: Deployed on Render with static web build
- **Backend**: Node.js API deployed on Render with health monitoring
- **Database**: MongoDB Atlas cloud database with optimized schema
- **Domain**: Custom domain at rehearsal-scheduler.onrender.com

## 🔧 Recent Technical Improvements

### **Error Handling & User Experience**

- **Professional Error Modals**: Custom `ErrorModal` component replaces basic alerts
- **Detailed Error Messages**: Backend API errors are captured and displayed clearly
- **Google OAuth Error Handling**: Specific messaging for authentication failures
- **Authentication Context**: Enhanced with error state management

### **Google Calendar Integration**

- **Availability Import**: Import personal calendar events to set availability
- **Conflict Detection**: Automatic detection of scheduling conflicts
- **Database Schema**: Optimized `WeeklyAvailability` collection structure
- **API Endpoints**: Dedicated calendar routes for sync functionality

### **Database & Performance**

- **Schema Migration**: Updated from legacy field names to current structure
- **Data Validation**: Proper field validation and error handling
- **Query Optimization**: Improved database queries for better performance
- **Cleanup Scripts**: Automated data migration and cleanup tools

## 🚨 Troubleshooting

### **Google OAuth Issues**

If you see "Access blocked: Rehearsal Scheduler has not completed the Google verification process":

1. **Quick Fix**: Contact admin to be added as a test user
2. **Alternative**: Use email/password login instead
3. **Setup Guide**: See `GOOGLE_OAUTH_SETUP.md` for detailed instructions

### **Common Issues**

- **Login Failures**: Check for detailed error messages in the error modal
- **Calendar Import**: Ensure Google Calendar API is enabled and authenticated
- **Database Errors**: Check MongoDB connection and schema validation
- **Port Conflicts**: Kill existing Node.js processes before starting development server

### **Development Setup Issues**

```bash
# Fix Node.js process conflicts
taskkill /F /IM node.exe  # Windows
# or
pkill node  # macOS/Linux

# Clean reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset database (if needed)
npm run db:cleanup
```

## 📂 Project Structure

```text
Rehearsal-Scheduler/
├── app/                    # Frontend React Native app
│   ├── (tabs)/            # Tab-based navigation screens
│   ├── components/        # Reusable UI components
│   │   ├── ErrorModal.tsx # Professional error handling modal
│   │   ├── GoogleCalendarIntegration.tsx # Calendar sync
│   │   └── AuthWrapper.tsx # Authentication wrapper
│   ├── contexts/          # React Context providers
│   │   └── AuthContext.tsx # Enhanced auth with error handling
│   ├── screens/           # Main application screens
│   │   ├── LoginScreen.tsx # Login with enhanced error handling
│   │   ├── ProfileScreen.tsx # User profile management
│   │   └── ScenesScreen.js # Scene management
│   ├── services/          # API and utility services
│   │   ├── api.ts         # Backend API communication
│   │   ├── googleAuthService.ts # Google OAuth integration
│   │   └── googleAuthNew.ts # Enhanced Google auth
│   └── styles/            # Shared styling
├── backend/               # Backend API server
│   ├── src/
│   │   ├── models/        # MongoDB data models
│   │   │   └── WeeklyAvailability.js # Updated schema
│   │   ├── routes/        # Express API routes
│   │   │   ├── auth.js    # Authentication with error handling
│   │   │   └── calendar.js # Google Calendar integration
│   │   ├── middleware/    # Authentication & validation
│   │   └── app.js         # Main server application
│   ├── fix-weekly-availability-data.js # Database migration script
│   └── package.json
├── dist/                  # Built web application
├── GOOGLE_OAUTH_SETUP.md  # Google OAuth setup instructions
└── README.md              # This file
```

## 🤝 Contributing

This project was created as part of CS153a at Brandeis University. While primarily an academic project, contributions and feedback are welcome.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (including error scenarios)
5. Submit a pull request

### Code Standards

- **Error Handling**: Use professional error modals instead of alerts
- **TypeScript**: Maintain type safety throughout the codebase
- **Database**: Follow the current schema patterns
- **Authentication**: Handle all auth error cases gracefully

## 📝 License

This project is created for educational purposes as part of CS153a at Brandeis University.

## 🎓 Academic Context

**Course**: CS153a - Mobile Application Development  
**Institution**: Brandeis University  
**Student**: Seth Haycock-Poller  
**Semester**: Fall 2024

## 🔗 Additional Resources

- **Google OAuth Setup**: See `GOOGLE_OAUTH_SETUP.md` for detailed configuration
- **API Documentation**: Backend routes documented in code comments
- **Database Schema**: Models defined in `backend/src/models/`
- **Error Handling**: Examples in `app/components/ErrorModal.tsx`

---

## 🎭 Built for Brandeis University Boris' Kitchen Theater Community

*Connecting actors, directors, and production staff with modern scheduling technology*
