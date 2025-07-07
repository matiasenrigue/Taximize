import { mlConfig } from '../../../shared/config/ml.config';

export interface MLPredictionRequest {
  start_latitude: number;
  start_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
}

export interface MLPredictionResponse {
  predicted_score: number;
  confidence?: number;
  model_version?: string;
}

export class MLServiceError extends Error {
  constructor(message: string, public code: string, public statusCode?: number) {
    super(message);
    this.name = 'MLServiceError';
  }
}

export class MLServiceClient {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;

  constructor(baseUrl?: string, timeout?: number, retryAttempts?: number) {
    this.baseUrl = baseUrl || mlConfig.serviceUrl;
    this.timeout = timeout || mlConfig.timeout;
    this.retryAttempts = retryAttempts || mlConfig.retryAttempts;
  }

  /**
   * Predict ride score using ML service
   * @param startLat Starting latitude
   * @param startLng Starting longitude
   * @param destLat Destination latitude
   * @param destLng Destination longitude
   * @returns Promise<number> Predicted score (1-5)
   */
  async predictRideScore(startLat: number, startLng: number, destLat: number, destLng: number): Promise<number> {
    const requestData: MLPredictionRequest = {
      start_latitude: startLat,
      start_longitude: startLng,
      destination_latitude: destLat,
      destination_longitude: destLng
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.makeRequest(requestData);
        
        // Validate response
        if (!response.predicted_score || response.predicted_score < 1 || response.predicted_score > 5) {
          throw new MLServiceError('Invalid prediction score received', 'INVALID_RESPONSE');
        }

        return Math.round(response.predicted_score);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.retryAttempts) {
          // Wait before retry with exponential backoff
          await this.delay(Math.pow(2, attempt - 1) * 1000);
          continue;
        }
      }
    }

    // All retry attempts failed
    throw new MLServiceError(
      `ML service failed after ${this.retryAttempts} attempts: ${lastError?.message}`,
      'SERVICE_UNAVAILABLE'
    );
  }

  /**
   * Check if ML service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout)
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Make HTTP request to ML service
   */
  private async makeRequest(requestData: MLPredictionRequest): Promise<MLPredictionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new MLServiceError(
          `ML service returned ${response.status}: ${errorText}`,
          'HTTP_ERROR',
          response.status
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof MLServiceError) {
        throw error;
      }

      // Handle fetch errors (network, timeout, etc.)
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new MLServiceError('ML service request timeout', 'TIMEOUT');
        }
        throw new MLServiceError(`Network error: ${error.message}`, 'NETWORK_ERROR');
      }

      throw new MLServiceError('Unknown error occurred', 'UNKNOWN_ERROR');
    }
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}