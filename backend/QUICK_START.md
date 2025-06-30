# Backend Quick Start Guide

## 🚀 Quick Start (Recommended)

The easiest way to start the backend is using the mock database mode:

```bash
# Navigate to backend directory
cd backend

# Start with mock database (no PostgreSQL required)
npm run dev:mock

# Or with auto-restart on file changes
npm run dev:mock:watch
```

This will start the server on `http://localhost:3000` with a mock database, so you don't need to set up PostgreSQL.

## 🔧 Alternative Start Methods

### 1. Standard Development Mode
```bash
npm run dev
```
*Note: This requires PostgreSQL to be running*

### 2. Production Mode
```bash
npm start
```
*Note: This requires PostgreSQL to be running*

## 📊 Database Options

### Option 1: Mock Database (Recommended for Development)
- ✅ No setup required
- ✅ Works immediately
- ✅ Good for testing and development
- ❌ Data is not persistent (resets on restart)

### Option 2: PostgreSQL with Docker
```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Start the backend
npm run dev
```

### Option 3: Local PostgreSQL
1. Install PostgreSQL
2. Create database: `createdb ride_share`
3. Set up environment variables
4. Run: `npm run dev`

## 🌐 API Endpoints

Once started, you can access:

- **Health Check**: http://localhost:3000/health
- **API Documentation**: http://localhost:3000/api-docs
- **Mock Data**: http://localhost:3000/api/dev/mock-data (development only)

## 🔍 Troubleshooting

### Database Connection Issues
If you see "PostgreSQL connection failed" errors:

1. **Use Mock Database** (Recommended):
   ```bash
   npm run dev:mock
   ```

2. **Or set up PostgreSQL**:
   ```bash
   # Start PostgreSQL with Docker
   docker-compose up -d postgres
   
   # Wait a few seconds, then start backend
   npm run dev
   ```

### Port Already in Use
If port 3000 is already in use:
```bash
# Kill the process using port 3000
npx kill-port 3000

# Or use a different port
PORT=3001 npm run dev:mock
```

### Permission Issues
```bash
# Make the start script executable
chmod +x start-dev.js
```

## 📝 Environment Variables

The backend will work with default settings, but you can customize:

```bash
# Set environment variables
export NODE_ENV=development
export PORT=3000
export JWT_SECRET=your_secret_key
export USE_REAL_DB=true  # Only if you want to use PostgreSQL
```

## 🧪 Testing the Backend

1. **Health Check**:
   ```bash
   curl http://localhost:3000/health
   ```

2. **Mock Data**:
   ```bash
   curl http://localhost:3000/api/dev/mock-data
   ```

3. **API Documentation**:
   Open http://localhost:3000/api-docs in your browser

## 🔄 Development Workflow

1. Start the backend: `npm run dev:mock`
2. Make changes to your code
3. Server will auto-restart (if using watch mode)
4. Test your changes via API endpoints

## 📚 Next Steps

- Check out the main [README.md](README.md) for detailed documentation
- Review the [BACKEND_FIXES_SUMMARY.md](BACKEND_FIXES_SUMMARY.md) for recent improvements
- Explore the API documentation at http://localhost:3000/api-docs

The backend is now ready to work with your driver app! 🎉 