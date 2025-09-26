from flask import Blueprint

# Create a blueprint for the routes
main = Blueprint('main', __name__)

@main.route('/')
def hello_world():
    return 'Hello, World!'