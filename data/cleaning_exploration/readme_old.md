#  Cleaning & Exploration

This directory contains all the preprocessing, initial modeling, and evaluation efforts for Taximize project. The data pipeline evolves from raw ingestion to feature engineering and finally to a scoring-ready format.


Please note that due to limitations of github we are choosing to not upload the raw/cleaned csv if you want to reproduce these results please test locally and download the data following this link. 

https://drive.google.com/drive/folders/1Gk9p-tLLZkTv9fjC7BxSy8Wdx8TOYUx5?usp=drive_link

---

##  Directory Structure

### `Data_Cleaning&_Intital_Exploartion`

Focused on preparing and understanding the core dataset.

- **`data_cleaning.py`**  
  Cleans the raw CSV data (e.g., removing nulls, filtering invalid fares, removing outliers).

- **`data_exploration.py`**  
  Performs exploratory data analysis: visualizations, summary statistics, and insights.

- **`joining_months.py`**  
  Merges multiple monthly CSVs (e.g., January and February) into a unified dataset.

- **`separate_months.py`**  
  Splits the combined dataset back into month-specific CSVs if needed for analysis or validation.

---

### `Initial_Models`

Early iterations testing modeling approaches and feature utility.

- **`component_predictions.py`**  
  Explores whether using `fare_per_minute` (instead of total fare) improves model accuracy.

- **`feature_engineering.py`**  
  Introduces early features including:
  - Trip duration variability
  - Dropoff zone hotness

- **`month_split.py`**  
  Temporally splits data into training and testing sets using full months (e.g., Jan for training, Feb for testing).

- **`random_split.py`**  
  Baseline split using random sampling. Acts as a benchmark against `month_split`.

- **`throwaway_model.py`**  
  First version of fare prediction using `fare_per_minute`. Later discarded due to data leakage issues but retained for documentation.

---

### `Scoring_Model`

Final iterations focused on optimizing a scoring pipeline.

- **`final_scoring.py`**  
  Production-ready scoring model combining engineered features, weights, and pipeline logic.

- **`og_scoring_model.py`**  
  First scoring model approach:
  - Trained two regression models to extract feature importance
  - Normalized results to compute final feature weights

- **`testing_monthly.py`**  
  Monthly evaluations and tuning results. There are pictures in this folder that compare model performance across different versions.

---

##  Other Notable Files

- **`train_monthly_models.py`**  
  Builds and exports the final scoring pipeline used in production.

- **`Trip_Prediction_Model_Exploration.py`**  
  Investigates dropoff hotspot prediction using trip data.

- **`zone_coordinates.csv`**  
  Lookup table for zone IDs to their latitude/longitude — used in both fare and hotspot models.

---

##  Notes

- All data cleaning and exploration was performed using **January and February** data.
- **March and April** were used **only for exploration and validation**, not for training.
- The project investigates how `fare_per_minute` and geographic features affect prediction accuracy.
- Two validation strategies were tested:
  - **Temporal split** by month (`month_split.py`)
  - **Random split** (`random_split.py`)
- Feature engineering and model training culminated in a scoring system that weights features based on regression-derived importance.

---
