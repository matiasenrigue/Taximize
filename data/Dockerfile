# Use a lightweight Python base image
FROM python:3.11

# Set working directory in the container
WORKDIR /app

# Copy entire `data/` folder (the current context)

RUN apt-get update && apt-get install -y \
    libgdal-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*


COPY data/data_models_api/combined_flask_app/requirements.txt ./requirements.txt

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Install dependencies from the correct path
COPY data/ ./data/

# Set the default command
CMD ["python", "data/data_models_api/combined_flask_app/flask_app.py"]
