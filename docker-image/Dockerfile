# Use the official slim Python image
FROM python:3.10-slim

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED True

# Set the application home directory
ENV APP_HOME /app
WORKDIR $APP_HOME

# Copy requirements and install dependencies
COPY src/requirements.txt ./
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy environment files, Firebase credentials, and code
COPY src/.env ./

# Copy FAISS index and metadata
COPY src/index.faiss /app/index.faiss
COPY src/index.pkl /app/index.pkl

# Copy the application source code
COPY src $APP_HOME/src

# Environment variables
ENV MODULE app
ENV QT_X11_NO_MITSHM=1
ENV PORT 8080

# Install Flask and CORS if not included in requirements
RUN pip install -U Flask flask-cors types-flask-cors

# Install FAISS (CPU version).
RUN pip install faiss-cpu

# Set the entry point to run the app
# CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 $MODULE.app:app
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 src.app:app
