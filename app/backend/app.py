from flask import Flask, jsonify, request
import traceback
import re
from flask_mysqldb import MySQL
from flask_cors import CORS
import os
from pathlib import Path
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Database configuration - using environment variables from Docker Compose
app.config['MYSQL_HOST'] = os.environ.get('MYSQL_HOST', 'db')
app.config['MYSQL_USER'] = os.environ.get('MYSQL_USER', 'user')
app.config['MYSQL_PASSWORD'] = os.environ.get('MYSQL_PASSWORD', 'password')
app.config['MYSQL_DB'] = os.environ.get('MYSQL_DATABASE', 'app_db')

# Initialize MySQL connection
mysql = MySQL(app)

SQL_QUERIES = {}
def _load_queries():
    """Load individual .sql files into SQL_QUERIES dict (no parsing of monolithic file)."""
    sql_dir = Path(__file__).parent / 'sql'
    name_to_file = {
        'get_cards': 'get_cards.sql',
        'login_get_user_by_username': 'login_get_user_by_username.sql',
        'get_collection': 'get_collection.sql',
        'add_to_collection': 'add_to_collection.sql',
        'get_users': 'get_users.sql',
           'signup_check_username': 'signup_check_username.sql',
           'signup_insert_user': 'signup_insert_user.sql',
           'remove_from_collection': 'remove_from_collection.sql',
           'get_wishlist': 'get_wishlist.sql',
           'add_to_wishlist': 'add_to_wishlist.sql',
           'remove_from_wishlist': 'remove_from_wishlist.sql',
        'get_wishlist_owners': 'get_wishlist_owners.sql',
        'get_mutual_matches': 'get_mutual_matches.sql',
        'get_trade_opportunities': 'get_trade_opportunities.sql',
        'create_active_trade': 'create_active_trade.sql',
        'get_active_trades': 'get_active_trades.sql',
        'confirm_active_trade': 'confirm_active_trade.sql',
        'decline_active_trade': 'decline_active_trade.sql',
        'get_market_trends': 'get_market_trends.sql',
    }
    for name, filename in name_to_file.items():
        path = sql_dir / filename
        if path.exists():
            SQL_QUERIES[name] = path.read_text(encoding='utf-8').strip().rstrip(';')
        else:
            # Leave missing entries absent; handlers will raise KeyError if used
            pass

_load_queries()


@app.route('/api/signup', methods=['POST'])
def signup():
    """Create a new user if the username is unique. Expects JSON: { username, password }.

    Passwords are hashed server-side using Werkzeug's `generate_password_hash` before storage.
    """
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'status': 'error', 'message': 'username and password required'}), 400

    # Hash the provided password for storage
    try:
        password_hash = generate_password_hash(password)
    except Exception as e:
        return jsonify({'status': 'error', 'message': 'failed to hash password'}), 500

    try:
        cur = mysql.connection.cursor()

        # Check uniqueness
        sql_check = SQL_QUERIES.get('signup_check_username')
        if not sql_check:
            cur.close()
            return jsonify({'status': 'error', 'message': 'signup_check_username query missing'}), 500

        if ':' in sql_check:
            sql_no_comments = re.sub(r"--.*?\n", "\n", sql_check)
            sql_no_comments = sql_no_comments.replace(':username', '%s')
            cur.execute(sql_no_comments, (username,))
        else:
            cur.execute(sql_check, (username,))

        if cur.fetchone():
            cur.close()
            return jsonify({'status': 'error', 'message': 'username already exists'}), 409

        # Insert new user (store hashed password)
        sql_insert = SQL_QUERIES.get('signup_insert_user')
        if not sql_insert:
            cur.close()
            return jsonify({'status': 'error', 'message': 'signup_insert_user query missing'}), 500

        if ':' in sql_insert:
            sql_no_comments = re.sub(r"--.*?\n", "\n", sql_insert)
            for k in ['username', 'passwordHash']:
                sql_no_comments = sql_no_comments.replace(f':{k}', '%s')
            cur.execute(sql_no_comments, (username, password_hash))
        else:
            cur.execute(sql_insert, (username, password_hash))

        mysql.connection.commit()
        cur.close()
        return jsonify({'status': 'success'}), 201
    except Exception as e:
        mysql.connection.rollback()
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

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
        cur.execute(SQL_QUERIES['get_cards'])
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
    """Basic login for the sample user."""
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'status': 'error', 'message': 'username and password required'}), 400

    try:
        cur = mysql.connection.cursor()
        sql = SQL_QUERIES.get('login_get_user_by_username')
        if sql and ':' in sql:
            sql_no_comments = re.sub(r"--.*?\n", "\n", sql)
            sql_no_comments = sql_no_comments.replace(':username', '%s')
            cur.execute(sql_no_comments, (username,))
        else:
            cur.execute(SQL_QUERIES['login_get_user_by_username'], (username,))
        row = cur.fetchone()
        cur.close()

        if not row:
            return jsonify({'status': 'error', 'message': 'invalid credentials'}), 401

        user_id, uname, password_hash, date_joined = row

        # Support both hashed and legacy plain-text seeds to avoid lockout
        password_valid = False
        if password_hash:
            try:
                password_valid = check_password_hash(password_hash, password)
            except ValueError:
                password_valid = False
        if not password_valid and password_hash == password:
            password_valid = True

        if not password_valid:
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
        # Print full traceback to container logs to aid debugging during development
        print('Error in get_collection:')
        traceback.print_exc()
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

        # Handle named-parameter SQL template (e.g. :userId, :rarityOpt, :typeOpt, :packOpt, :nameSearchOpt)
        sql = SQL_QUERIES['get_collection']
        # If the SQL uses named params, replace them with positional %s and build params tuple
        if ':' in sql:
            # Remove SQL line comments (starting with --) so we don't accidentally replace tokens inside comments
            sql_no_comments = re.sub(r"--.*?\n", "\n", sql)

            # Replace named tokens with %s in the cleaned SQL
            for k in ['userId', 'rarityOpt', 'typeOpt', 'packOpt', 'nameSearchOpt']:
                sql_no_comments = sql_no_comments.replace(f":{k}", "%s")

            # Protect literal percent signs (e.g. in LIKE patterns) so Python-formatting
            # used by the DB driver doesn't treat them as format directives.
            placeholder = '__PCT_S__'
            sql_no_comments = sql_no_comments.replace('%s', placeholder)
            sql_no_comments = sql_no_comments.replace('%', '%%')
            sql_no_comments = sql_no_comments.replace(placeholder, '%s')

            # Build params tuple matching the expanded occurrences in the SQL
            params = (
                user_id,
                rarity, rarity,
                ctype, ctype,
                pack, pack,
                name_like, name_like,
            )
            cur.execute(sql_no_comments, params)
        else:
            # Fallback: existing positional template
            params = (
                user_id,
                rarity, rarity,
                ctype, ctype,
                pack, pack,
                name_like, name_like
            )
            cur.execute(sql, params)
        rows = cur.fetchall()
        cur.close()

        items = [{
            'cardID': r[0], 'name': r[1], 'packName': r[2], 'rarity': r[3], 'type': r[4],
            'quantity': r[5], 'imageURL': r[6]
        } for r in rows]

        return jsonify({'status': 'success', 'items': items, 'count': len(items)})
    except Exception as e:
        print('Exception in get_collection:')
        traceback.print_exc()
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
        # Use INSERT ... ON DUPLICATE KEY UPDATE as per R7-b
        sql = SQL_QUERIES.get('add_to_collection')
        if sql and ':' in sql:
            sql_no_comments = re.sub(r"--.*?\n", "\n", sql)
            sql_no_comments = sql_no_comments.replace(':userId', '%s').replace(':cardId', '%s').replace(':quantity', '%s')
            cur.execute(sql_no_comments, (user_id, card_id, qty))
        else:
            cur.execute(SQL_QUERIES['add_to_collection'], (user_id, card_id, qty))
        mysql.connection.commit()
        cur.close()

        return jsonify({'status': 'success'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/collection', methods=['DELETE'])
def remove_from_collection():
    """Remove a card from a user's collection. Accepts JSON { userID, cardID } or query params."""
    data = request.get_json(silent=True) or {}
    user_id = data.get('userID') or request.args.get('userID', type=int)
    card_id = data.get('cardID') or request.args.get('cardID')

    if not user_id or not card_id:
        return jsonify({'status': 'error', 'message': 'userID and cardID required'}), 400

    try:
        cur = mysql.connection.cursor()
        sql = SQL_QUERIES.get('remove_from_collection')
        if not sql:
            cur.close()
            return jsonify({'status': 'error', 'message': 'remove_from_collection query missing'}), 500

        # Check current quantity first so we can decrement instead of deleting all copies.
        cur.execute(
            "SELECT quantity FROM Collection WHERE userID = %s AND cardID = %s",
            (user_id, card_id)
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            return jsonify({'status': 'error', 'message': 'card not found in collection'}), 404

        current_qty = row[0]

        if current_qty <= 1:
            # Delete outright to avoid violating the quantity > 0 check constraint
            cur.execute(
                "DELETE FROM Collection WHERE userID = %s AND cardID = %s",
                (user_id, card_id)
            )
            new_quantity = 0
        else:
            cur.execute(
                "UPDATE Collection SET quantity = quantity - 1 WHERE userID = %s AND cardID = %s",
                (user_id, card_id)
            )
            new_quantity = current_qty - 1

        mysql.connection.commit()
        cur.close()
        return jsonify({'status': 'success', 'quantity': new_quantity})
    except Exception as e:
        mysql.connection.rollback()
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/users')
def get_users():
    """Get all users from the database"""
    try:
        cur = mysql.connection.cursor()
        cur.execute(SQL_QUERIES['get_users'])
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


@app.route('/api/wishlist', methods=['GET'])
def get_wishlist():
    """Return a user's wishlist with optional filters (rarity, type, packName, name)."""
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

        sql = SQL_QUERIES.get('get_wishlist')
        if not sql:
            cur.close()
            return jsonify({'status': 'error', 'message': 'get_wishlist query missing'}), 500

        if ':' in sql:
            sql_no_comments = re.sub(r"--.*?\n", "\n", sql)
            for k in ['userId', 'rarityOpt', 'typeOpt', 'packOpt', 'nameSearchOpt']:
                sql_no_comments = sql_no_comments.replace(f':{k}', '%s')

            # Protect literal percent signs in SQL (LIKE patterns) from Python formatting
            placeholder = '__PCT_S__'
            sql_no_comments = sql_no_comments.replace('%s', placeholder)
            sql_no_comments = sql_no_comments.replace('%', '%%')
            sql_no_comments = sql_no_comments.replace(placeholder, '%s')

            params = (
                user_id,
                rarity, rarity,
                ctype, ctype,
                pack, pack,
                name_like, name_like,
            )
            cur.execute(sql_no_comments, params)
        else:
            params = (
                user_id,
                rarity, rarity,
                ctype, ctype,
                pack, pack,
                name_like, name_like,
            )
            cur.execute(sql, params)

        rows = cur.fetchall()
        cur.close()

        items = [{
            'cardID': r[0], 'name': r[1], 'packName': r[2], 'rarity': r[3], 'type': r[4],
            'dateAdded': str(r[5]) if r[5] else None, 'imageURL': r[6]
        } for r in rows]

        return jsonify({'status': 'success', 'items': items, 'count': len(items)})
    except Exception as e:
        print('Exception in get_wishlist:')
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/wishlist', methods=['POST'])
def add_to_wishlist():
    """Add a card to a user's wishlist (upsert). Expects JSON { userID, cardID }."""
    data = request.get_json(silent=True) or {}
    user_id = data.get('userID')
    card_id = data.get('cardID')

    if not user_id or not card_id:
        return jsonify({'status': 'error', 'message': 'userID and cardID required'}), 400

    try:
        cur = mysql.connection.cursor()
        sql = SQL_QUERIES.get('add_to_wishlist')
        if not sql:
            cur.close()
            return jsonify({'status': 'error', 'message': 'add_to_wishlist query missing'}), 500

        if ':' in sql:
            sql_no_comments = re.sub(r"--.*?$", "", sql, flags=re.MULTILINE)
            ordered_keys = []

            def repl(match):
                ordered_keys.append(match.group(1))
                return '%s'

            sql_no_comments = re.sub(r':(cardId|userId)', repl, sql_no_comments)
            params = tuple(card_id if key == 'cardId' else user_id for key in ordered_keys)
            cur.execute(sql_no_comments, params)
        else:
            cur.execute(sql, (card_id, user_id))

        mysql.connection.commit()
        cur.close()
        return jsonify({'status': 'success'})
    except Exception as e:
        mysql.connection.rollback()
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/wishlist', methods=['DELETE'])
def remove_from_wishlist():
    """Remove a card from a user's wishlist. Accepts JSON { userID, cardID } or query params."""
    data = request.get_json(silent=True) or {}
    user_id = data.get('userID') or request.args.get('userID', type=int)
    card_id = data.get('cardID') or request.args.get('cardID')

    if not user_id or not card_id:
        return jsonify({'status': 'error', 'message': 'userID and cardID required'}), 400

    try:
        cur = mysql.connection.cursor()
        sql = SQL_QUERIES.get('remove_from_wishlist')
        if not sql:
            cur.close()
            return jsonify({'status': 'error', 'message': 'remove_from_wishlist query missing'}), 500

        if ':' in sql:
            sql_no_comments = re.sub(r"--.*?$", "", sql, flags=re.MULTILINE)
            ordered_keys = []

            def repl(match):
                ordered_keys.append(match.group(1))
                return '%s'

            sql_no_comments = re.sub(r':(cardId|userId)', repl, sql_no_comments)

            params = tuple(card_id if key == 'cardId' else user_id for key in ordered_keys)
            cur.execute(sql_no_comments, params)
        else:
            cur.execute(sql, (card_id, user_id))

        mysql.connection.commit()
        cur.close()
        return jsonify({'status': 'success'})
    except Exception as e:
        mysql.connection.rollback()
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/wishlist/owners', methods=['GET'])
def get_wishlist_owners():
    """Return owners who have extra copies (>1) of a specific wishlist card.

    Accepts `userID` and `cardID` as query params (or in JSON body). Returns items:
    { ownerID, username, quantity } for each owner (excluding the viewer).
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get('userID') or request.args.get('userID', type=int)
    # cardID values are string identifiers (e.g. 'A1-001'), so accept raw string from args
    card_id = data.get('cardID') or request.args.get('cardID')

    if not user_id or not card_id:
        return jsonify({'status': 'error', 'message': 'userID and cardID required'}), 400

    try:
        cur = mysql.connection.cursor()
        sql = SQL_QUERIES.get('get_wishlist_owners')
        if not sql:
            cur.close()
            return jsonify({'status': 'error', 'message': 'get_wishlist_owners query missing'}), 500

        if ':' in sql:
            sql_no_comments = re.sub(r"--.*?$", "", sql, flags=re.MULTILINE)
            ordered_keys = []

            def repl(match):
                ordered_keys.append(match.group(1))
                return '%s'

            sql_no_comments = re.sub(r':(cardId|userId)', repl, sql_no_comments)

            params = tuple(card_id if key == 'cardId' else user_id for key in ordered_keys)
            cur.execute(sql_no_comments, params)
        else:
            cur.execute(sql, (card_id, user_id))

        rows = cur.fetchall()
        cur.close()

        items = [{
            'ownerID': r[0], 'username': r[1], 'quantity': int(r[2])
        } for r in rows]

        return jsonify({'status': 'success', 'items': items, 'count': len(items)})
    except Exception as e:
        print('Exception in get_wishlist_owners:')
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/matches', methods=['GET'])
def get_mutual_matches():
    """Find mutual trade matches for the logged-in user.

    Accepts `userID` or `username` as query params. Returns items with partnerID, partnerName,
    iWant_cardID, iWant_name, rarity_required, theyWant_cardID, theyWant_name.
    """
    user_id = request.args.get('userID', type=int)
    username = request.args.get('username')

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

        sql = SQL_QUERIES.get('get_mutual_matches')
        if not sql:
            cur.close()
            return jsonify({'status': 'error', 'message': 'get_mutual_matches query missing'}), 500

        if ':' in sql:
            sql_no_comments = re.sub(r"--.*?\n", "\n", sql)
            sql_no_comments = sql_no_comments.replace(':me', '%s')
            cur.execute(sql_no_comments, (user_id,))
        else:
            cur.execute(sql, (user_id,))

        rows = cur.fetchall()
        cur.close()

        items = [{
            'partnerID': r[0], 'partnerName': r[1],
            'iWant_cardID': r[2], 'iWant_name': r[3], 'rarity_required': r[4],
            'theyWant_cardID': r[5], 'theyWant_name': r[6]
        } for r in rows]

        return jsonify({'status': 'success', 'items': items, 'count': len(items)})
    except Exception as e:
        print('Exception in get_mutual_matches:')
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/trade-opportunities', methods=['GET'])
def get_trade_opportunities():
    """Return trade opportunities targeting the given user (userID or username)."""
    user_id = request.args.get('userID', type=int)
    username = request.args.get('username')

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

        sql = SQL_QUERIES.get('get_trade_opportunities')
        if not sql:
            cur.close()
            return jsonify({'status': 'error', 'message': 'get_trade_opportunities query missing'}), 500

        if ':' in sql:
            sql_no_comments = re.sub(r"--.*?\n", "\n", sql)
            sql_no_comments = sql_no_comments.replace(':targetId', '%s')
            cur.execute(sql_no_comments, (user_id,))
        else:
            cur.execute(sql, (user_id,))

        rows = cur.fetchall()
        cur.close()

        items = [{
            'ownerID': r[0], 'ownerName': r[1], 'cardID': r[2], 'cardName': r[3], 'createdAt': str(r[4]) if r[4] else None
        } for r in rows]

        return jsonify({'status': 'success', 'items': items, 'count': len(items)})
    except Exception as e:
        print('Exception in get_trade_opportunities:')
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/active-trades', methods=['POST'])
def create_active_trade():
    """Create a new pending active trade. Expects JSON: { user1, user2, cardSent1, cardSent2, createdBy }"""
    data = request.get_json(silent=True) or {}
    user1 = data.get('user1')
    user2 = data.get('user2')
    cardSent1 = data.get('cardSent1')
    cardSent2 = data.get('cardSent2')
    createdBy = data.get('createdBy')

    if not user1 or not user2 or not cardSent1 or not cardSent2 or not createdBy:
        return jsonify({'status': 'error', 'message': 'user1,user2,cardSent1,cardSent2,createdBy required'}), 400

    try:
        cur = mysql.connection.cursor()
        sql = SQL_QUERIES.get('create_active_trade')
        if not sql:
            cur.close()
            return jsonify({'status': 'error', 'message': 'create_active_trade query missing'}), 500

        # simple positional params
        cur.execute(sql, (user1, user2, cardSent1, cardSent2, createdBy))
        mysql.connection.commit()
        cur.close()
        return jsonify({'status': 'success'}), 201
    except Exception as e:
        mysql.connection.rollback()
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/active-trades', methods=['GET'])
def list_active_trades():
    """List active trades for a user. Accepts query param userID or username."""
    user_id = request.args.get('userID', type=int)
    username = request.args.get('username')

    if not user_id and not username:
        return jsonify({'status': 'error', 'message': 'userID or username required'}), 400

    try:
        cur = mysql.connection.cursor()
        if not user_id and username:
            cur.execute("SELECT userID FROM User WHERE username = %s", (username,))
            row = cur.fetchone()
            if not row:
                cur.close()
                return jsonify({'status': 'error', 'message': 'user not found'}), 404
            user_id = row[0]

        sql = SQL_QUERIES.get('get_active_trades')
        if not sql:
            cur.close()
            return jsonify({'status': 'error', 'message': 'get_active_trades query missing'}), 500

        cur.execute(sql, (user_id, user_id))
        rows = cur.fetchall()
        cur.close()

        items = []
        for r in rows:
            items.append({
                'initiatorID': r[0], 'responderID': r[1],
                'cardOfferedByUser1': r[2], 'cardOfferedByUser1Name': r[3], 'cardOfferedByUser1Image': r[4],
                'cardOfferedByUser2': r[5], 'cardOfferedByUser2Name': r[6], 'cardOfferedByUser2Image': r[7],
                'confirmed': bool(r[8]), 'createdBy': r[9], 'confirmedBy': r[10], 'createdAt': str(r[11]) if r[11] else None
            })

        return jsonify({'status': 'success', 'items': items, 'count': len(items)})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/active-trades/confirm', methods=['POST'])
def confirm_active_trade():
    """Confirm (accept) an active trade. Expects JSON: { confirmedBy, user1, user2, cardSent1, cardSent2 }"""
    data = request.get_json(silent=True) or {}
    confirmedBy = data.get('confirmedBy')
    user1 = data.get('user1')
    user2 = data.get('user2')
    cardSent1 = data.get('cardSent1')
    cardSent2 = data.get('cardSent2')

    if not confirmedBy or not user1 or not user2 or not cardSent1 or not cardSent2:
        return jsonify({'status': 'error', 'message': 'confirmedBy,user1,user2,cardSent1,cardSent2 required'}), 400

    try:
        cur = mysql.connection.cursor()
        sql = SQL_QUERIES.get('confirm_active_trade')
        if not sql:
            cur.close()
            return jsonify({'status': 'error', 'message': 'confirm_active_trade query missing'}), 500

        cur.execute(sql, (confirmedBy, user1, user2, cardSent1, cardSent2))
        if cur.rowcount == 0:
            # nothing updated (either not found or already confirmed)
            mysql.connection.rollback()
            cur.close()
            return jsonify({'status': 'error', 'message': 'no pending trade updated'}), 404

        mysql.connection.commit()

        # After successful confirmation and trigger processing, clean up the processed ActiveTrades row
        try:
            cur.execute(
                "DELETE FROM ActiveTrades WHERE user1 = %s AND user2 = %s AND cardSent1 = %s AND cardSent2 = %s AND confirmed = TRUE",
                (user1, user2, cardSent1, cardSent2)
            )
            mysql.connection.commit()
        except Exception:
            # log but don't fail the whole request; trigger has already processed the trade
            traceback.print_exc()

        cur.close()
        return jsonify({'status': 'success'})
    except Exception as e:
        mysql.connection.rollback()
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/active-trades', methods=['DELETE'])
def decline_active_trade():
    """Decline a pending active trade. Expects JSON: { user1, user2, cardSent1, cardSent2 }"""
    data = request.get_json(silent=True) or {}
    user1 = data.get('user1')
    user2 = data.get('user2')
    cardSent1 = data.get('cardSent1')
    cardSent2 = data.get('cardSent2')

    if not user1 or not user2 or not cardSent1 or not cardSent2:
        return jsonify({'status': 'error', 'message': 'user1,user2,cardSent1,cardSent2 required'}), 400

    try:
        cur = mysql.connection.cursor()
        sql = SQL_QUERIES.get('decline_active_trade')
        if not sql:
            cur.close()
            return jsonify({'status': 'error', 'message': 'decline_active_trade query missing'}), 500

        cur.execute(sql, (user1, user2, cardSent1, cardSent2))
        if cur.rowcount == 0:
            mysql.connection.rollback()
            cur.close()
            return jsonify({'status': 'error', 'message': 'no pending trade deleted'}), 404

        mysql.connection.commit()
        cur.close()
        return jsonify({'status': 'success'})
    except Exception as e:
        mysql.connection.rollback()
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/market-trends', methods=['GET'])
def get_market_trends():
    """Return market trends data from the market_trends_view."""
    try:
        cur = mysql.connection.cursor()
        # The view is already ordered by valueScore DESC
        sql = SQL_QUERIES.get('get_market_trends')
        if not sql:
            cur.close()
            return jsonify({'status': 'error', 'message': 'get_market_trends query missing'}), 500

        cur.execute(sql)
        rows = cur.fetchall()
        cur.close()

        items = [{
            'cardID': r[0],
            'name': r[1],
            'rarity': r[2],
            'packName': r[3],
            'imageURL': r[4],
            'demand': r[5],
            'supply': r[6],
            'trend': r[7]
        } for r in rows]

        return jsonify({'status': 'success', 'items': items, 'count': len(items)})
    except Exception as e:
        print('Exception in get_market_trends:')
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

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
    app.run(host='0.0.0.0', port=5001, debug=True)
