#!/usr/bin/env python3
"""
Test script for the ML service to ensure it works correctly
"""

import requests
import json
import sys

def test_ml_service():
    """Test the ML service endpoints"""
    base_url = "http://localhost:5001"
    
    print("Testing ML Service...")
    
    # Test health endpoint
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✓ Health endpoint working")
            print(f"  Response: {response.json()}")
        else:
            print(f"✗ Health endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Health endpoint failed: {e}")
        return False
    
    # Test prediction endpoint
    print("\n2. Testing prediction endpoint...")
    test_data = {
        "start_latitude": 53.349805,
        "start_longitude": -6.260310,
        "destination_latitude": 53.343794,
        "destination_longitude": -6.254573
    }
    
    try:
        response = requests.post(
            f"{base_url}/predict",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        if response.status_code == 200:
            result = response.json()
            print("✓ Prediction endpoint working")
            print(f"  Response: {result}")
            
            # Validate response format
            if "predicted_score" in result and 1 <= result["predicted_score"] <= 5:
                print("✓ Prediction score in valid range")
            else:
                print("✗ Invalid prediction score")
                return False
        else:
            print(f"✗ Prediction endpoint failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Prediction endpoint failed: {e}")
        return False
    
    # Test info endpoint
    print("\n3. Testing info endpoint...")
    try:
        response = requests.get(f"{base_url}/info", timeout=5)
        if response.status_code == 200:
            print("✓ Info endpoint working")
            print(f"  Response: {response.json()}")
        else:
            print(f"✗ Info endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Info endpoint failed: {e}")
        return False
    
    # Test invalid data
    print("\n4. Testing invalid data handling...")
    invalid_data = {
        "start_latitude": 200,  # Invalid latitude
        "start_longitude": -6.260310,
        "destination_latitude": 53.343794,
        "destination_longitude": -6.254573
    }
    
    try:
        response = requests.post(
            f"{base_url}/predict",
            json=invalid_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        if response.status_code == 400:
            print("✓ Invalid data properly rejected")
        else:
            print(f"✗ Invalid data not properly rejected: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Invalid data test failed: {e}")
        return False
    
    print("\n✓ All tests passed!")
    return True

if __name__ == "__main__":
    success = test_ml_service()
    sys.exit(0 if success else 1)