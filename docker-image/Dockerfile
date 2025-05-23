# Use the official slim Python image
FROM python:3.10-slim

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED=True

ENV PYTHONPATH="/app:/app/src"

# Set the application home directory
ENV APP_HOME=/app
WORKDIR $APP_HOME

# Copy requirements files and install dependencies
COPY src/requirements.txt ./
COPY src/requirements-migration.txt ./

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir -r requirements-migration.txt

# Copy environment files, Firebase credentials, and code
COPY src/.env ./
COPY src/firebaseKey.json ./
COPY src/prompts.py ./
COPY src/textUtils.py ./
COPY src/indexer.py ./
COPY src/transcriber.py ./

# Copy the application source code and migrations
COPY src $APP_HOME/src

# Copy migration scripts
COPY run_migrations.sh /run_migrations.sh
RUN chmod +x /run_migrations.sh

# Environment variables for Flask
ENV MODULE=src.app
ENV QT_X11_NO_MITSHM=1
ENV PORT=8080
EXPOSE 8080

# Install additional dependencies
RUN pip install -U Flask flask-cors types-flask-cors

# Install FAISS (CPU version)
RUN pip install faiss-cpu

# Set the entry point to run migrations and then start the app
ENTRYPOINT ["/run_migrations.sh"]
CMD ["gunicorn", "--bind", ":8080", "--workers", "1", "--threads", "8", "--timeout", "0", "app:app"]