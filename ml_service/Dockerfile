FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ml_service.py .

# Expose port
EXPOSE 5001

# Set environment variables
ENV PORT=5001
ENV DEBUG=false

# Run the application
CMD ["python", "ml_service.py"]