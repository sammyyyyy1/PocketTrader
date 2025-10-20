from flask import Flask, jsonify, request
from flask_mysqldb import MySQL
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Database configuration - using environment variables from Docker Compose
app.config['MYSQL_HOST'] = os.environ.get('MYSQL_HOST', 'db')
app.config['MYSQL_USER'] = os.environ.get('MYSQL_USER', 'user')
app.config['MYSQL_PASSWORD'] = os.environ.get('MYSQL_PASSWORD', 'password')
app.config['MYSQL_DB'] = os.environ.get('MYSQL_DATABASE', 'app_db')

# Initialize MySQL connection
mysql = MySQL(app)

@app.route('/')
def hello_world():
    return jsonify({
        'message': 'Hello, World! Welcome to Pokemon Trading App API',
        'status': 'running',
        'app': 'PocketTrader Backend'
    })

@app.route('/api/cards')
def get_cards():
    """Get all Pokemon cards from the database"""
    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            SELECT cardID, name, packName, rarity, type, imageURL
            FROM Card
            ORDER BY 
                CASE rarity
                    WHEN 'C'  THEN 1
                    WHEN '3S' THEN 2
                    WHEN '4D' THEN 3
                    WHEN '3D' THEN 4
                    WHEN '2S' THEN 5
                    WHEN '1S' THEN 6
                    WHEN '2D' THEN 7
                    WHEN '1D' THEN 8
                    ELSE 99
                END,
                name
        """)
        cards = cur.fetchall()
        cur.close()

        # Convert to list of dictionaries
        card_list = []
        for card in cards:
            card_list.append({
                'cardID': card[0],
                'name': card[1],
                'packName': card[2],
                'rarity': card[3],
                'type': card[4],
                'imageURL': card[5]
            })

        return jsonify({
            'status': 'success',
            'cards': card_list,
            'count': len(card_list)
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/login', methods=['POST'])
def login():
    """Basic login for the sample user (no hashing for milestone demo)."""
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'status': 'error', 'message': 'username and password required'}), 400

    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT userID, username, passwordHash, dateJoined FROM User WHERE username = %s", (username,))
        row = cur.fetchone()
        cur.close()

        if not row:
            return jsonify({'status': 'error', 'message': 'invalid credentials'}), 401

        user_id, uname, password_hash, date_joined = row
        # For demo purposes, compare plain-text password to stored passwordHash
        if password != password_hash:
            return jsonify({'status': 'error', 'message': 'invalid credentials'}), 401

        return jsonify({
            'status': 'success',
            'user': {
                'userID': user_id,
                'username': uname,
                'dateJoined': str(date_joined) if date_joined else None
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/collection', methods=['GET'])
def get_collection():
    """Return a user's collection with optional filters (rarity, type, packName, name)."""
    user_id = request.args.get('userID', type=int)
    username = request.args.get('username')
    rarity = request.args.get('rarity')
    ctype = request.args.get('type')
    pack = request.args.get('packName')
    name_like = request.args.get('name')

    if not user_id and not username:
        return jsonify({'status': 'error', 'message': 'userID or username required'}), 400

    try:
        cur = mysql.connection.cursor()

        # Resolve user_id from username if needed
        if not user_id and username:
            cur.execute("SELECT userID FROM User WHERE username = %s", (username,))
            row = cur.fetchone()
            if not row:
                cur.close()
                return jsonify({'status': 'error', 'message': 'user not found'}), 404
            user_id = row[0]

        # Build query with optional filters
        base_sql = (
            "SELECT c.cardID, c.quantity, k.name, k.packName, k.rarity, k.type, k.imageURL "
            "FROM Collection c JOIN Card k ON c.cardID = k.cardID WHERE c.userID = %s"
        )
        params = [user_id]

        if rarity:
            base_sql += " AND k.rarity = %s"
            params.append(rarity)
        if ctype:
            base_sql += " AND k.type = %s"
            params.append(ctype)
        if pack:
            base_sql += " AND k.packName = %s"
            params.append(pack)
        if name_like:
            base_sql += " AND k.name LIKE %s"
            params.append(f"%{name_like}%")

        base_sql += " ORDER BY k.name"

        cur.execute(base_sql, tuple(params))
        rows = cur.fetchall()
        cur.close()

        items = [{
            'cardID': r[0], 'quantity': r[1], 'name': r[2], 'packName': r[3],
            'rarity': r[4], 'type': r[5], 'imageURL': r[6]
        } for r in rows]

        return jsonify({'status': 'success', 'items': items, 'count': len(items)})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/collection', methods=['POST'])
def add_to_collection():
    """Add a card to a user's collection (upsert quantity)."""
    data = request.get_json(silent=True) or {}
    user_id = data.get('userID')
    card_id = data.get('cardID')
    qty = data.get('quantity', 1)

    if not user_id or not card_id:
        return jsonify({'status': 'error', 'message': 'userID and cardID required'}), 400
    if not isinstance(qty, int) or qty <= 0:
        return jsonify({'status': 'error', 'message': 'quantity must be a positive integer'}), 400

    try:
        cur = mysql.connection.cursor()
        # Try to update existing
        cur.execute(
            "UPDATE Collection SET quantity = quantity + %s WHERE userID = %s AND cardID = %s",
            (qty, user_id, card_id)
        )
        if cur.rowcount == 0:
            # Insert new row
            cur.execute(
                "INSERT INTO Collection (userID, cardID, quantity) VALUES (%s, %s, %s)",
                (user_id, card_id, qty)
            )
        mysql.connection.commit()
        cur.close()

        return jsonify({'status': 'success'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/users')
def get_users():
    """Get all users from the database"""
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT userID, username, dateJoined FROM User")
        users = cur.fetchall()
        cur.close()

        # Convert to list of dictionaries
        user_list = []
        for user in users:
            user_list.append({
                'userID': user[0],
                'username': user[1],
                'dateJoined': str(user[2]) if user[2] else None
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
    try:
        # Test database connection
        cur = mysql.connection.cursor()
        cur.execute("SELECT COUNT(*) FROM Card")
        card_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM User")
        user_count = cur.fetchone()[0]
        cur.close()

        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'message': 'Pokemon Trading Card App Backend',
            'card_count': card_count,
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