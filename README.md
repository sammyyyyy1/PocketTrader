# 🎮 Pokemon Trading (Milestone 0)

A full-stack web application for Pokemon trading built with Flask, MySQL, and Next.js.

## 🏗️ Architecture

- **Backend**: Flask (Python) with MySQL database
- **Frontend**: Next.js (React)
- **Database**: MySQL with simple users table
- **Deployment**: Docker Compose for easy setup

## 🚀 Quick Start

### Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose installed
- OR individual tools: Python 3.9+, Node.js 18+, MySQL 5.7+

### Option 1: Docker Compose (Recommended)

1. **Clone and navigate to the project**:
   ```bash
   cd c:\Users\Samuel\Projects\PocketTrader\app
   ```

2. **Start all services**:
   ```bash
   docker-compose up --build
   ```

3. **Wait for initialization** (first run takes 2-3 minutes):
   - MySQL database will be created and populated
   - Backend will connect to database
   - Frontend will start development server

4. **Access the application**:
   - 🌐 **Frontend**: http://localhost:3000
   - 🔧 **Backend API**: http://localhost:5000
   - ❤️ **Health Check**: http://localhost:5000/api/health
   - 👥 **Users API**: http://localhost:5000/api/users

### Option 2: Manual Setup

#### 1. Database Setup
```bash
# Start MySQL (if not using Docker)
mysql -u root -p -e "CREATE DATABASE app_db;"
mysql -u root -p app_db < database/schema.sql
mysql -u root -p app_db < database/migrations/init.sql
```

#### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Set environment variables (Windows PowerShell)
$env:MYSQL_HOST="localhost"
$env:MYSQL_USER="root"
$env:MYSQL_PASSWORD="your_mysql_password"
$env:MYSQL_DATABASE="app_db"

python app.py
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🎯 Features

### Current Features (Hello World)
- ✅ Database connection and health check
- ✅ User management (display Pokemon trainers)
- ✅ REST API endpoints
- ✅ Responsive frontend interface
- ✅ Docker containerization


## 🐛 Troubleshooting

### Common Issues

**1. Services not starting**
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs db
docker-compose logs frontend
```

**2. Database connection failed**
```bash
# Restart with fresh database
docker-compose down -v
docker-compose up --build
```

**3. Port already in use**
```bash
# Stop other services using ports 3000, 5000, or 3306
netstat -ano | findstr :3000
```

### Reset Everything
```bash
# Complete reset (removes all data)
docker-compose down -v --remove-orphans
docker-compose up --build
```

## 📝 Development Logs

Access logs for debugging:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

## 🚀 Next Steps

Future enhancements for the Pokemon Trading App:
- [ ] User registration and authentication
- [ ] Pokemon inventory system
- [ ] Trading functionality
- [ ] Pokemon card database
- [ ] User profiles and stats
- [ ] Real-time trading interface

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `docker-compose up --build`
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy Pokemon Trading! 🎮✨**

For issues or questions, please check the troubleshooting section above.
