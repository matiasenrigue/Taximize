# Users

The Users module provides core user management functionality including profile data retrieval and preferences management. This foundational module serves as the primary interface for authenticated user operations, ensuring secure access to user data and personalization settings.

## 📖 API Documentation
**[View Complete API Reference →](../../../documentation/API_Documentation/users.md)**

<img src="../../../documentation/media/preferences.gif" alt="Analytics Dashboard" width="250"/>


## 🏗️ Architecture

### 🔧 Components

1. **User Model** (`user.model.ts`)
   - Defines user data structure with automatic password hashing
   - Includes secure password verification methods

2. **User Controller** (`user.controller.ts`)
   - REST API endpoints for user profile and preferences management
   - Handles secure data retrieval with password exclusion

3. **User Routes** (`user.routes.ts`)
   - Protected endpoints requiring authentication middleware


### 🗃️ User Data Structure

The User model provides:

- **Core Identity**:
  - `id` - UUID v4 primary key
  - `email` - Unique email address with validation
  - `username` - Display name for the user

- **Security Features**:
  - `password` - Automatically hashed using bcrypt 
  - `matchPassword()` - Instance method for secure password verification

- **Personalization**:
  - `preferences` - JSON object storing user customizations:
    - `theme` - UI theme preference
    - `language` - Locale/language setting
    - `breakWarnings` - Alert preference for work breaks

### 🔐 Security Implementation

1. **Password Security**:
   - Automatic bcrypt hashing with 10 salt rounds
   - Password validation (8-100 characters)
   - Secure comparison via `matchPassword()` method

2. **Authentication Protection**:
   - All endpoints require `protect` middleware
   - JWT token validation and user attachment
   - Automatic password field exclusion from responses