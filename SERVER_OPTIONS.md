# Server Storage Implementation Guide

## Option 2: Supabase (PostgreSQL-based)

Supabase is an excellent Firebase alternative with PostgreSQL:

```bash
npm install @supabase/supabase-js
```

### Setup:
```javascript
// app/config/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Database Schema:
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Timeslots table
CREATE TABLE timeslots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  label TEXT NOT NULL,
  day TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- Scenes table
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT
);

-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  contact_info TEXT,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User availability
CREATE TABLE user_availability (
  user_id UUID REFERENCES users(id),
  timeslot_id UUID REFERENCES timeslots(id),
  project_id UUID REFERENCES projects(id),
  available BOOLEAN DEFAULT true,
  PRIMARY KEY (user_id, timeslot_id, project_id)
);

-- User scenes
CREATE TABLE user_scenes (
  user_id UUID REFERENCES users(id),
  scene_id UUID REFERENCES scenes(id),
  project_id UUID REFERENCES projects(id),
  PRIMARY KEY (user_id, scene_id, project_id)
);

-- Rehearsals
CREATE TABLE rehearsals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  scene_id UUID REFERENCES scenes(id),
  timeslot_id UUID REFERENCES timeslots(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rehearsal participants
CREATE TABLE rehearsal_participants (
  rehearsal_id UUID REFERENCES rehearsals(id),
  user_id UUID REFERENCES users(id),
  PRIMARY KEY (rehearsal_id, user_id)
);
```

## Option 3: Custom Node.js/Express API

For full control, create your own backend:

### Backend Structure:
```
backend/
├── server.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── projects.js
│   ├── rehearsals.js
├── models/
│   ├── User.js
│   ├── Project.js
│   ├── Rehearsal.js
├── middleware/
│   ├── auth.js
└── config/
    └── database.js
```

### Example API Endpoints:
```javascript
// Authentication
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout

// Users
GET /api/users/profile
PUT /api/users/profile
GET /api/users/availability
PUT /api/users/availability

// Projects
GET /api/projects
POST /api/projects
GET /api/projects/:id
PUT /api/projects/:id

// Rehearsals
GET /api/rehearsals
POST /api/rehearsals
PUT /api/rehearsals/:id
DELETE /api/rehearsals/:id

// Scenes & Timeslots
GET /api/scenes
POST /api/scenes
GET /api/timeslots
POST /api/timeslots
```
