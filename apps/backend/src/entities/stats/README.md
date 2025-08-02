# Statistics

The Statistics module provides comprehensive analytics for driver performance tracking, offering insights into earnings patterns, work time distribution, and shift data visualization. This powerful analytics engine helps drivers optimize their working strategy through detailed historical data and performance metrics.

## 📖 API Documentation
**[View Complete API Reference →](../../../documentation/API_Documentation/stats.md)**

<img src="../../../documentation/media/stats.gif" alt="Analytics Dashboard" width="250"/>

## 🏗️ Architecture

### 🔧 Components

1. **Stats Controller** (`stats.controller.ts`)
   - REST API endpoints for statistics retrieval with comprehensive validation

2. **Stats Service** (`stats.service.ts`)
   - Core analytics engine with Redis caching for performance optimization

3. **Utility Functions**
   - **Date Helpers** (`utils/dateHelpers.ts`): Date manipulation and formatting utilities
   - **Currency Helpers** (`utils/currencyHelpers.ts`): Monetary value formatting and conversion
   - **Statistics Helpers** (`utils/statisticsHelpers.ts`): Complex analytics calculations and aggregations


### 📊 Data Processing Features

1. **Intelligent Caching**: Redis-based caching with 5-minute TTL reduces database load
2. **Flexible Date Ranges**: Support for custom date ranges with proper validation
3. **Multi-View Support**: Weekly and monthly aggregation views

