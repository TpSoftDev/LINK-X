# Use the official slim Python image
FROM python:3.10-slim

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED=True

# Set the application home directory
ENV APP_HOME=/app
WORKDIR $APP_HOME

# Copy requirements and install dependencies
COPY src/requirements.txt ./  
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy environment files, Firebase credentials, and code
COPY src/.env ./  

# Use Environment Variables
ENV OPENAI_API_KEY=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
ENV AUTH_SECRET=78e7acf9b1069552eea5b7d29fc42c2d
ENV POSTGRES_URL=postgresql://neondb_owner:npg_9mcyfEOhr3RB@ep-yellow-sun-a5h8no3u-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# Copy FAISS index and metadata
COPY src/index.faiss /app/index.faiss
COPY src/index.pkl /app/index.pkl

# Copy the application source code
COPY src $APP_HOME/src

# Environment variables for Flask
ENV MODULE=src.app 
ENV QT_X11_NO_MITSHM=1
ENV PORT=8080
EXPOSE 8080

# Install Flask and CORS if not included in requirements
RUN pip install -U Flask flask-cors types-flask-cors

# Install FAISS (CPU version)
RUN pip install faiss-cpu

# Set the entry point to run the app with gunicorn
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 $MODULE:app