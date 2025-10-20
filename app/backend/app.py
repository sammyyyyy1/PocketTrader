from flask import Flask, jsonify
from flask_cors import CORS
import os

# Optional import: only required when not running in mock mode
USE_MOCK = os.environ.get('MOCK_DB', '0') == '1'
if not USE_MOCK:
    from flask_mysqldb import MySQL

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Database configuration - using environment variables for Docker or local
app.config['MYSQL_HOST'] = os.environ.get('MYSQL_HOST', 'db')
app.config['MYSQL_USER'] = os.environ.get('MYSQL_USER', 'user')
app.config['MYSQL_PASSWORD'] = os.environ.get('MYSQL_PASSWORD', 'password')
app.config['MYSQL_DB'] = os.environ.get('MYSQL_DATABASE', 'app_db')

if not USE_MOCK:
    mysql = MySQL(app)
else:
    # Sample data to emulate DB for a very basic demo
    SAMPLE_USERS = [
        {"id": 1, "username": "ash_ketchum", "created_at": "2025-01-01T00:00:00"},
        {"id": 2, "username": "misty_waterflower", "created_at": "2025-01-02T00:00:00"},
        {"id": 3, "username": "brock_harrison", "created_at": "2025-01-03T00:00:00"},
        {"id": 4, "username": "pikachu_lover", "created_at": "2025-01-04T00:00:00"},
        {"id": 5, "username": "team_rocket_jessie", "created_at": "2025-01-05T00:00:00"},
    ]

@app.route('/')
def hello_world():
    return jsonify({
        'message': 'Hello, World! Welcome to Pokemon Trading App API',
        'status': 'running',
        'app': 'PocketTrader Backend'
    })

@app.route('/api/users')
def get_users():
    """Get all users from the database"""
    if USE_MOCK:
        return jsonify({
            'status': 'success',
            'users': SAMPLE_USERS,
            'count': len(SAMPLE_USERS)
        })
    else:
        try:
            cur = mysql.connection.cursor()
            cur.execute("SELECT id, username, created_at FROM users")
            users = cur.fetchall()
            cur.close()

            # Convert to list of dictionaries
            user_list = []
            for user in users:
                user_list.append({
                    'id': user[0],
                    'username': user[1],
                    'created_at': str(user[2])
                })

            return jsonify({
                'status': 'success',
                'users': user_list,
                'count': len(user_list)
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    if USE_MOCK:
        return jsonify({
            'status': 'healthy',
            'database': 'mock',
            'message': 'Pokemon Trading App Backend (MOCK)',
            'user_count': 5
        })
    else:
        try:
            # Test database connection
            cur = mysql.connection.cursor()
            cur.execute("SELECT COUNT(*) FROM users")
            user_count = cur.fetchone()[0]
            cur.close()

            return jsonify({
                'status': 'healthy',
                'database': 'connected',
                'message': 'Pokemon Trading App Backend',
                'user_count': user_count
            })
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'database': 'disconnected',
                'error': str(e)
            }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)