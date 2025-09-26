# 🎮 PocketTrader App

A full-stack web application for Pokemon trading built with Flask, MySQL, and Next.js.

## 🏗️ Architecture

- **Backend**: Flask (Python) with MySQL database
- **Frontend**: Next.js (React)
- **Database**: MySQL with simple users table
- **Deployment**: Docker Compose for easy setup

## 📁 Project Structure

```
app/
├── backend/
│   ├── app.py                 # Flask application
│   ├── routes/                # API routes
│   ├── models/                # Database models
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile            # Backend Docker config
├── frontend/
│   ├── pages/                # Next.js pages
│   ├── components/           # React components
│   ├── package.json          # Node.js dependencies
│   └── Dockerfile           # Frontend Docker config
├── database/
│   ├── schema.sql           # Database schema
│   └── migrations/          # Database migrations
├── docker-compose.yml       # Multi-service Docker setup
└── README.md               # This file
```

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

### Sample Data
The app comes with sample Pokemon trainer users:
- `ash_ketchum`
- `misty_waterflower`  
- `brock_harrison`
- `pikachu_lover`
- `team_rocket_jessie`

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Hello World message |
| GET | `/api/health` | Database connection status |
| GET | `/api/users` | List all Pokemon trainers |

### Example API Response

**GET /api/users**
```json
{
  "status": "success",
  "users": [
    {
      "id": 1,
      "username": "ash_ketchum",
      "created_at": "2025-09-25 10:30:00"
    }
  ]
}
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🛠️ Development

### Adding New Features

1. **Backend**: Add routes in `backend/routes/`
2. **Frontend**: Add components in `frontend/components/`
3. **Database**: Add migrations in `database/migrations/`

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_HOST` | MySQL host | `localhost` |
| `MYSQL_USER` | MySQL username | `user` |
| `MYSQL_PASSWORD` | MySQL password | `password` |
| `MYSQL_DATABASE` | Database name | `app_db` |

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
