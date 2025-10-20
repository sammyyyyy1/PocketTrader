import os

DATABASE_URI = (
	f"mysql+pymysql://{os.environ.get('MYSQL_USER')}:{os.environ.get('MYSQL_PASSWORD')}"
	f"@{os.environ.get('MYSQL_HOST')}/{os.environ.get('MYSQL_DATABASE')}"
)
SECRET_KEY = os.environ.get('SECRET_KEY', 'your_secret_key')
DEBUG = True