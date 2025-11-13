# Backend README

# Flask Application

This is the backend of the application built using Flask. It serves as the API for the frontend and interacts with a MySQL database.

## Setup Instructions

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd app/backend
   ```

2. **Create a virtual environment**:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies**:
   ```
   pip install -r requirements.txt
   ```

4. **Configure the database**:
   Update the `config.py` file with your database connection details.

5. **Run the application**:
   ```
   python app.py
   ```

## Usage

Once the application is running, you can access the API at `http://localhost:5001`. 

## Directory Structure

- `app.py`: Entry point for the Flask application.
- `models/`: Contains model definitions for the application.
- `routes/`: Defines the routes for the Flask application.
- `config.py`: Configuration settings for the Flask application.
- `requirements.txt`: Lists the Python dependencies required for the backend.