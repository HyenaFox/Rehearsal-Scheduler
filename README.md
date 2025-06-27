# 🎭 Rehearsal Scheduler

**A comprehensive theater production management app for Brandeis University Boris' Kitchen**  
*by Seth Haycock-Poller for CS153a Brandeis University*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-rehearsal--scheduler.onrender.com-blue?style=for-the-badge&logo=globe)](https://rehearsal-scheduler.onrender.com)

## 🌟 Overview

Rehearsal Scheduler is a full-stack web and mobile application designed to streamline theater production management. Built specifically for Brandeis University's Boris' Kitchen theater group, it helps directors, actors, and production staff coordinate rehearsals, manage actor availability, and organize scene assignments efficiently.

### 🎯 **Live Application**
**Visit: [rehearsal-scheduler.onrender.com](https://rehearsal-scheduler.onrender.com)**

The app is deployed and ready to use! No installation required for the web version.

## ✨ Key Features

### 👥 **Actor Management**
- **Profile Creation**: Actors can create detailed profiles with contact information
- **Availability Tracking**: Set and update time slot availability for rehearsals
- **Scene Assignment**: Manage which scenes each actor is involved in
- **Role Management**: Distinguish between actors, directors, and administrators

### 📅 **Rehearsal Scheduling**
- **Smart Scheduling**: Create rehearsals with automatic actor availability checking
- **Conflict Detection**: Visual indicators for scheduling conflicts
- **Multiple Scenes**: Schedule rehearsals with multiple scenes and actors
- **Time Management**: Organize rehearsals by time slots and dates

### 🔐 **Authentication & Authorization**
- **Google OAuth**: Secure login with Google accounts
- **Role-Based Access**: Different permissions for actors, directors, and admins
- **Guest Mode**: Browse functionality without account creation
- **Session Persistence**: Stay logged in across browser sessions

### 🎨 **Modern User Interface**
- **Cross-Platform**: Works on web browsers, tablets, and mobile devices
- **Responsive Design**: Optimized for all screen sizes
- **Intuitive Navigation**: Tab-based navigation with clear visual hierarchy
- **Real-Time Updates**: Live data synchronization across devices

### 🔧 **Administrative Tools**
- **Scene Management**: Create, edit, and organize production scenes
- **Time Slot Configuration**: Set up rehearsal time blocks
- **Actor Administration**: Manage actor profiles and assignments
- **Production Overview**: Dashboard with scheduling insights

## 🚀 Getting Started

### 🌐 **Use the Live App (Recommended)**
1. **Visit**: [rehearsal-scheduler.onrender.com](https://rehearsal-scheduler.onrender.com)
2. **Sign In**: Use Google OAuth or browse as a guest
3. **Set Up Profile**: Complete your actor/director profile
4. **Start Scheduling**: Begin creating and managing rehearsals!

### 💻 **Local Development Setup**

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
- **MongoDB** with Mongoose ODM
- **JWT** for secure authentication
- **Google OAuth 2.0** for user authentication
- **CORS** enabled for cross-origin requests

### **Deployment**
- **Frontend**: Deployed on Render with static web build
- **Backend**: Node.js API deployed on Render
- **Database**: MongoDB Atlas cloud database
- **Domain**: Custom domain at rehearsal-scheduler.onrender.com

## 📂 Project Structure

```
Rehearsal-Scheduler/
├── app/                    # Frontend React Native app
│   ├── (tabs)/            # Tab-based navigation screens
│   ├── components/        # Reusable UI components  
│   ├── contexts/          # React Context providers
│   ├── screens/           # Main application screens
│   ├── services/          # API and utility services
│   └── styles/            # Shared styling
├── backend/               # Backend API server
│   ├── src/
│   │   ├── models/        # MongoDB data models
│   │   ├── routes/        # Express API routes
│   │   ├── middleware/    # Authentication & validation
│   │   └── app.js         # Main server application
│   └── package.json
├── dist/                  # Built web application
└── README.md
```

## 🤝 Contributing

This project was created as part of CS153a at Brandeis University. While primarily an academic project, contributions and feedback are welcome.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is created for educational purposes as part of CS153a at Brandeis University.

## 🎓 Academic Context

**Course**: CS153a - Mobile Application Development  
**Institution**: Brandeis University  
**Instructor**: [Course Instructor Name]  
**Student**: Seth Haycock-Poller  
**Semester**: [Current Semester]

---

**🎭 Built with ❤️ for the Brandeis University Boris' Kitchen theater community**
