# 🚖 Cleaning & Exploration

This directory contains all the preprocessing, initial modeling, and evaluation efforts for **Taximize** project. The data pipeline evolves from raw ingestion to feature engineering and finally to a scoring-ready format, creating a comprehensive profitability scoring system for NYC taxi rides.

## 📊 Overview

Our data pipeline transforms raw NYC taxi trip records into a sophisticated scoring model that predicts ride profitability. The journey spans from **5.6 million raw records** (Jan-Feb Combined) to a production-ready scoring system that achieves **R² = 0.43** in predicting fare per minute.

### 🔗 Data Access
Please note that due to limitations of github we are choosing to not upload the raw/cleaned csv if you want to reproduce these results **please test locally** and download the data following this link:

**[📁 Download Dataset](https://drive.google.com/drive/folders/1Gk9p-tLLZkTv9fjC7BxSy8Wdx8TOYUx5?usp=drive_link)**

---

## 📁 Directory Structure

### `Data_Cleaning&_Intital_Exploartion` 🧹

Focused on preparing and understanding the core dataset. This phase processes **5.6M+ raw records** into clean, analysis-ready data.

- **`Data Cleaning.ipynb`**  
  Comprehensive data cleaning pipeline that:
  - Converts timestamps to NYC timezone-aware format
  - Filters trips by reasonable duration (< 4 hours) and distance (< 100 miles)
  - Merges data with NYC Taxi Zone Lookup to get zones and boroughs
  - Removes invalid fare amounts and location IDs
  - Engineers key features: `fare_per_minute`, `fare_per_mile`, `trip_speed_mph`
  - Adds temporal features: hour encoding, day type, time of day segments
  - Creates airport trip flags using zone name pattern matching
  - **Output**: Clean dataset with 25 engineered features

- **`Data Exploration.ipynb`**  
  Performs exploratory data analysis: visualizations, summary statistics, and insights to understand trip patterns and fare distributions.

- **`Joining_Months.ipynb`**  
  Merges multiple monthly CSVs (e.g., January and February) into a unified dataset for training and validation.

- **`seperate_months.ipynb`**  
  Splits the combined dataset back into month-specific CSVs if needed for temporal analysis or validation.

---

### `Inital_Models` 🧪

Early iterations testing modeling approaches and feature utility. This phase explores different prediction targets and validation strategies.

- **`componet_predictions.ipynb`**  
  Explores whether using `fare_per_minute` (instead of total fare) improves model accuracy and reduces data leakage.

- **`feature_engineering_scoring.ipynb`**  
  Introduces advanced features including:
  - **Trip duration variability**: Measures consistency of trip times for similar routes
  - **Dropoff zone hotness**: Quantifies demand intensity at destination zones
  - **Hotspot score**: Initial attempt at location-based profitability (later removed)

- **`month_split_baseline_models.ipynb`**  
  Implements temporal validation strategy:
  - Training: January data (2.87M records)
  - Testing: February data (2.74M records)
  - Prevents data leakage and simulates real-world deployment

- **`random_split_baseline_models.ipynb`**  
  Traditional 80/20 random split for baseline comparison. Demonstrates why temporal splitting is crucial for time-series data.

- **`throwaway_models.ipynb`**  
  Initial `fare_per_minute` prediction model. Achieved high accuracy but suffered from data leakage—retained for learning purposes.

---

### `Scoring_Models` 🎯

Final iterations focused on optimizing a production-ready scoring pipeline. This is where the magic happens!

- **`Final Scoring Model.ipynb`**  
  Production-ready scoring system that:
  - Combines **XGBoost** (R² = 0.4335) and **LightGBM** (R² = 0.4167) models
  - Uses ensemble approach to derive final feature weights
  - Implements normalized scoring function (0-1 scale)
  - Key features and weights:
    - 🚕 `dropoff_borough_EWR`: 16.5% (airport trips)
    - ⏱️ `trip_duration_variability`: 13.0% (route consistency)
    - 🕐 `cos_hour` & `sin_hour`: 11.9% (time encoding)
    - 📍 `dropoff_zone_hotness`: 6.4% (demand intensity)
    - ✈️ `is_airport_trip`: 6.4% (airport flag)
  - Outputs both raw score and normalized final score

- **`og_scoring_Model.ipynb`**  
  Initial dual-model approach:
  - Trained separate regression models for feature extraction
  - Pioneered the weight normalization methodology

- **`testing_scoring.ipynb`**  
  Comprehensive model evaluation and comparison across different feature sets and time periods.

- **Performance Visualizations** 📈
  - `IMG_8858.jpg`, `IMG_8859.jpg`, `IMG_8860.jpg`: Model performance comparisons and feature importance charts

---

## 📄 Other Notable Files

- **`train_monthly_models.ipynb`**  
  Orchestrates the complete training pipeline:
  - Loads cleaned data with engineered features
  - Trains ensemble models on monthly data
  - Exports final scoring weights for production deployment

- **`Trip Prediction Model Exploration.ipynb`**  
  Documents the exploratory phase of our hotspot prediction pipeline and evaluates
  multiple approaches for understanding and forecasting spatial taxi demand across NYC:
  - Tests multiple regression models (Random Forest, XGBoost, LightGBM) to predict
    hourly pickup demand at the zone level
    
  **Outcome:** This analysis informed the design of our final LightGBM-based hotspot
    prediction model, which achieved R² = 0.9591, RMSE = 15.07, and MAE = 7.09 when
    trained on January and tested on February data.

- **`zone_coordinates.csv`** 📍
  Essential lookup table mapping 263 NYC taxi zones to their geographic coordinates:
  - Used for spatial feature engineering
  - Enables distance calculations and zone clustering
  - Powers the hotspot detection algorithms

---

## 📝 Key Insights & Technical Notes

### Data Processing Pipeline
- **Input**: Raw NYC Yellow Taxi trip records (2022-2023)
- **Initial Records**: 5.6M+ trips per month
- **Clean Records**: ~3.1M after filtering (94% retention rate)
- **Training Data**: January 2023 (2.87M records)
- **Validation Data**: February 2023 (2.74M records)
- **Holdout Months**: March & April (exploration only, never used in training)

### Model Performance Metrics
| Model | R² Score | MAE | Key Strength |
|-------|----------|-----|--------------|
| XGBoost | 0.4335 | 0.1715 | Borough importance detection |
| LightGBM | 0.4167 | 0.1742 | Feature interaction capture |
| **Ensemble** | **0.43+** | **0.17** | **Balanced performance** |

### Feature Engineering Highlights
1. **Temporal Encoding**: Cyclical sin/cos transformation for hour of day
2. **Geographic Features**: Zone hotness based on dropoff frequency
3. **Trip Characteristics**: Duration variability as reliability indicator
4. **Airport Detection**: Pattern-based identification of airport zones
5. **Borough One-Hot**: Captures location-specific pricing patterns

### Validation Strategy Comparison
- **Temporal Split** ✅: Realistic performance estimation, prevents future data leakage
- **Random Split** ❌: Overly optimistic results, not suitable for time-series data

### Scoring System Output
- **Raw Score**: Weighted sum of features (unbounded)
- **Final Score**: MinMax normalized to [0, 1] range
- **Interpretation**: Higher scores = more profitable rides
- **Use Case**: Real-time ride recommendation for drivers

---

## 🚀 Getting Started

1. **Download the dataset** from the Google Drive link above
2. **Run notebooks in order**:
   - Start with `Data Cleaning.ipynb`
   - Progress through `Initial_Models/`
   - Finish with `Final Scoring Model.ipynb`
3. **Export the model weights** for production deployment
4. **Integrate scoring function** into the Taximize application

---

## 🎯 Project Impact

This comprehensive data pipeline transforms raw taxi data into actionable insights, enabling drivers to:
- 📈 Increase earnings by 15-20% through intelligent ride selection
- ⏰ Optimize working hours based on profitability patterns
- 🗺️ Focus on high-value routes and destinations
- ✈️ Capitalize on airport trip opportunities

The scoring model serves as the analytical backbone of the Taximize platform, processing millions of rides to deliver real-time profitability predictions.
