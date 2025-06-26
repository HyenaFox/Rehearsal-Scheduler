# MongoDB Migration Guide

## Why MongoDB Instead of PostgreSQL?

✅ **Better for JSON/Document Storage** - User profiles with arrays (timeslots, scenes) fit naturally
✅ **Easier Schema Evolution** - Add new fields without migrations  
✅ **Better Performance** - For read-heavy mobile apps
✅ **Free Tier Available** - MongoDB Atlas has generous free tier
✅ **Simpler Queries** - No complex joins needed for user data

## Migration Steps

### 1. Set Up MongoDB Atlas (Free)

1. **Go to [MongoDB Atlas](https://cloud.mongodb.com)**
2. **Create free account** and new project
3. **Create cluster** (Choose free M0 tier)
4. **Create database user:**
   - Username: `rehearsal-user` 
   - Password: Generate strong password
5. **Whitelist IP addresses:** Add `0.0.0.0/0` for Render.com
6. **Get connection string:** Should look like:
   ```
   mongodb+srv://rehearsal-user:password@cluster0.xxxxx.mongodb.net/rehearsal-scheduler?retryWrites=true&w=majority
   ```

### 2. Replace Backend Files

**Option A: Use New MongoDB Files**
```bash
# Backup current files
mv src/app.js src/app.postgres.js
mv src/models/database.js src/models/database.postgres.js  
mv src/models/User.js src/models/User.postgres.js
mv src/routes/auth.js src/routes/auth.postgres.js

# Use MongoDB files
mv src/app.mongodb.js src/app.js
mv src/models/database.mongodb.js src/models/database.js
mv src/models/User.mongodb.js src/models/User.js
mv src/routes/auth.mongodb.js src/routes/auth.js
```

**Option B: Manual Replace**
- Replace contents of existing files with MongoDB versions

### 3. Update package.json

Already updated to use `mongoose` instead of `pg`

### 4. Update Environment Variables

**For Local Development (.env):**
```bash
NODE_ENV=development
MONGODB_URI=mongodb+srv://rehearsal-user:password@cluster0.xxxxx.mongodb.net/rehearsal-scheduler?retryWrites=true&w=majority
JWT_SECRET=05173863acda0d0d12d31c43bda699b64d913e16d1e4b29da14c1355ec7b57d0
```

**For Render.com Deployment:**
- Remove `DATABASE_URL` variable
- Add `MONGODB_URI` with your MongoDB Atlas connection string

### 5. Test Migration

```bash
# Install dependencies
cd backend
npm install

# Test locally
npm run dev

# Check health endpoint
curl http://localhost:3000/health
```

### 6. Deploy to Render.com

1. **Update environment variables** in Render dashboard
2. **Deploy** - Render will automatically use new dependencies
3. **Test** your deployed API

## Key Differences

### Data Structure
**PostgreSQL (Before):**
```sql
users table + user_timeslots table + user_scenes table
```

**MongoDB (After):**
```javascript
{
  _id: ObjectId,
  email: "user@example.com",
  name: "John Doe", 
  phone: "555-1234",
  isActor: true,
  availableTimeslots: ["morning", "afternoon"],
  scenes: ["scene1", "scene2"],
  createdAt: Date,
  updatedAt: Date
}
```

### Benefits of New Structure
- ✅ **Single document** per user (faster queries)
- ✅ **No joins required** (simpler code)
- ✅ **Atomic updates** (no data consistency issues)
- ✅ **Schema flexibility** (easy to add new fields)

### Authentication Improvements
- ✅ **Password hashing** handled by schema middleware
- ✅ **Better validation** with Mongoose validators  
- ✅ **Automatic timestamps** (createdAt/updatedAt)
- ✅ **Index optimization** for faster lookups

## Free Tier Comparison

| Feature | PostgreSQL (Render) | MongoDB (Atlas) |
|---------|-------------------|-----------------|
| Storage | 1GB | 512MB |
| Connections | 97 | 500 |
| Sleep Policy | 15 min inactivity | No sleep |
| Bandwidth | Shared | 10GB/month |
| **Winner** | Good for development | **Better for production** |

## Testing Your Migration

```bash
# 1. Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# 2. Test login  
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 3. Test profile update (use token from login)
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"Updated Name","isActor":true,"availableTimeslots":["morning"]}'
```

## Rollback Plan

If you need to rollback to PostgreSQL:

```bash
# Restore PostgreSQL files
mv src/app.postgres.js src/app.js
mv src/models/database.postgres.js src/models/database.js  
mv src/models/User.postgres.js src/models/User.js
mv src/routes/auth.postgres.js src/routes/auth.js

# Restore package.json dependencies
# Change "mongoose" back to "pg" in package.json

# Update environment variables back to DATABASE_URL
```

## Next Steps After Migration

1. **Test thoroughly** with your React Native app
2. **Update API URLs** if needed
3. **Monitor performance** and connection limits
4. **Consider upgrading** MongoDB Atlas plan for production use

The MongoDB implementation provides better structure for your user data and will scale better as your app grows!
