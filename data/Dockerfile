# Use a lightweight Python base image
FROM python:3.11-slim

# Set working directory in the container
WORKDIR /app

# Install system dependencies for geospatial libraries
RUN apt-get update && apt-get install -y \
    libgdal-dev \
    g++ \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY data/data_models_api/combined_flask_app/requirements.txt ./requirements.txt

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire data directory
COPY data/ ./data/

# Expose the Flask port
EXPOSE 5050

# Set environment variable for Flask
ENV FLASK_APP=data/data_models_api/combined_flask_app/flask_app.py
ENV PYTHONUNBUFFERED=1

# Run the Flask app directly
CMD ["python", "-m", "data.data_models_api.combined_flask_app.flask_app"]
