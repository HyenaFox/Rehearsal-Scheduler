# 🎭 Rehearsal Scheduler

**A comprehensive theater production management app for Brandeis University Boris' Kitchen**  
*by Seth Haycock-Poller for CS153a Brandeis University*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-rehearsal--scheduler.onrender.com-blue?style=for-the-badge&logo=globe)](https://rehearsal-scheduler.onrender.com)

## 🌟 Overview

Rehearsal Scheduler is a React Native application with direct MongoDB integration designed to streamline theater production management. Built specifically for Brandeis University's Boris' Kitchen theater group, it helps directors, actors, and production staff coordinate rehearsals, manage actor availability, and organize scene assignments efficiently.

### 🎯 **Serverless Architecture**
This app uses a modern serverless architecture with direct MongoDB integration, eliminating the need for a backend server while maintaining full functionality.

## ✨ Key Features

### 👥 **Actor Management**
- **Profile Creation**: Actors can create detailed profiles with contact information
- **Availability Tracking**: Set and update time slot availability for rehearsals (5:00 PM - 11:00 PM, excluding Fridays)
- **Scene Assignment**: Manage which scenes each actor is involved in
- **Role Management**: Local user management with actor/admin roles

### 📅 **Rehearsal Scheduling**
- **Smart Scheduling**: Create rehearsals with automatic actor availability checking
- **Segment-Based Selection**: 30-minute time segments for precise scheduling
- **Conflict Detection**: Visual indicators for scheduling conflicts
- **Multiple Scenes**: Schedule rehearsals with multiple scenes and actors
- **Drag & Drop**: Intuitive drag-and-drop interface for schedule management

### 🔐 **Authentication & Authorization**
- **Local Authentication**: Simple email-based user registration and login
- **Role-Based Access**: Different permissions for actors, directors, and admins
- **Guest Mode**: Browse functionality without account creation
- **Session Persistence**: Stay logged in across app sessions

### 🎨 **Modern User Interface**
- **Cross-Platform**: Works on web browsers, tablets, and mobile devices
- **Responsive Design**: Optimized for all screen sizes with modern color palette
- **Intuitive Navigation**: Tab-based navigation with clear visual hierarchy
- **Real-Time Updates**: Direct database access for immediate data synchronization

### 🔧 **Administrative Tools**
- **Scene Management**: Create, edit, and organize production scenes (globally accessible)
- **Time Slot Configuration**: Client-side generated time slots (5:00 PM - 11:00 PM, no Fridays)
- **Actor Administration**: Manage actor profiles and assignments
- **Production Overview**: Dashboard with scheduling insights

## 🚀 Getting Started

### 💻 **Local Development Setup**

#### Prerequisites
- **Node.js** (≥18.0.0)
- **npm** (≥8.0.0)
- **MongoDB Atlas Account** (for database)
- **Expo CLI** (for development)

#### Setup Instructions
```bash
# Clone the repository
git clone <repository-url>
cd Rehearsal-Scheduler

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string

# Start the development server
npm start
```

#### Environment Variables
Create a `.env` file in the root directory:
```env
# MongoDB Configuration
EXPO_PUBLIC_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rehearsal-scheduler?retryWrites=true&w=majority

# Google OAuth (optional, for future features)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
```

#### MongoDB Setup
1. Create a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
2. Create a new cluster
3. Get your connection string
4. Replace the placeholder in your `.env` file
5. The app will automatically create collections and fallback to local storage if needed

## 📱 Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| **Web Browser** | ✅ Full Support | Primary deployment target |
| **Mobile Web** | ✅ Full Support | Responsive design optimized |
| **Android App** | ✅ Full Support | Expo build available |
| **iOS App** | ✅ Full Support | Expo build available |
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
- **AsyncStorage** for local data persistence and offline support

### **Database**
- **MongoDB** with direct client integration
- **AsyncStorage** for local fallback and offline functionality
- **Client-side data generation** for timeslots and system data

### **Architecture**
- **Serverless**: Direct MongoDB integration from React Native
- **Offline Support**: AsyncStorage fallback for all operations
- **No Backend Server**: Eliminated server complexity
- **Cross-Platform**: Single codebase for web, iOS, and Android

### **Deployment**
- **Frontend**: Expo web build or native app stores
- **Database**: MongoDB Atlas cloud database
- **No Server Required**: Direct client-to-database architecture

## 📂 Project Structure

```
Rehearsal-Scheduler/
├── app/                    # React Native app with direct MongoDB
│   ├── (tabs)/            # Tab-based navigation screens
│   ├── components/        # Reusable UI components  
│   ├── contexts/          # React Context providers
│   ├── screens/           # Main application screens
│   ├── services/          # Direct MongoDB and utility services
│   │   ├── api.ts         # Refactored API service
│   │   └── directMongo.js # Direct MongoDB integration
│   └── styles/            # Shared styling and design system
├── assets/                # Static assets (images, fonts)
├── __tests__/             # Test files and configurations
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
