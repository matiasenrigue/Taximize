# Taximize: Frontend

This is the frontend application for the taxi management system, built with Next.js 15 and React 19.

## Tech Stack

- **Framework**: Next.js 15.3.2 with React 19
- **Language**: TypeScript 5.8
- **Styling**: CSS Modules
- **Internationalization**: next-intl
- **Theme Management**: next-themes
- **Maps Integration**: @react-google-maps/api, @vis.gl/react-google-maps
- **Data Visualization**: Recharts
- **HTTP Client**: Axios
- **Date/Time**: Moment.js
- **Icons**: Font Awesome
- **Testing**: Jest with React Testing Library
- **Utilities**: Lodash, clsx

## Core Features

- **Light/Dark Mode**: Theme switching support with next-themes
- **Internationalization**: Multi-language support (English and German) using next-intl
- **Shift Management**: Start, pause, and end work shifts with break reminders
- **Ride Tracking**: Track rides with real-time GPS, destination management, and fare calculation
- **Taximeter**: Real-time fare calculation based on distance and time
- **Google Maps Integration**: Interactive maps with route planning and taxi zone visualization
- **User Authentication**: Sign up, sign in, and profile management
- **Statistics & Analytics**: View ride history, earnings, and work time statistics
- **Responsive Design**: Mobile-first approach with CSS modules

## Project Structure

```text
frontend/
├── __mocks__/          # Testing - mocks to simulate css-modules, files, and packages
├── app/                # Next.js App Router
│   └── [lang]/         # Language-based routing
│       ├── (protected)/# Authenticated routes
│       │   ├── account/       # User account pages
│       │   ├── map/           # Main map interface
│       │   ├── start-shift/   # Shift start page
│       │   └── end-shift/     # Shift end summary
│       ├── signin/            # Authentication pages
│       ├── signup/
│       ├── layout.tsx         # Root layout
│       └── page.tsx           # Home page
├── assets/             # Static assets (taxi zones data)
├── components/         # Reusable UI components
│   ├── AuthGuard/
│   ├── Button/
│   ├── Header/
│   ├── Map/
│   ├── TaxiMeter/
│   ├── modals/         # Modal components
│   └── ...
├── constants/          # Global constants and types
├── contexts/           # React Context providers
│   ├── RideContext/    # Ride state management
│   ├── ShiftContext/   # Shift state management
│   ├── UserContext/    # User authentication
│   └── UserLocationContext/
├── dictionaries/       # Translation files
│   ├── en.json         # English translations
│   └── de.json         # German translations
├── hooks/              # Custom React hooks
├── i18n/               # Internationalization config
├── lib/                # Utility functions
├── public/             # Static assets
├── .swcrc              # Testing - SWC configuration
├── jest.config.ts      # Testing - configuration
├── jest.setup.ts       # Testing - setup environment
├── middleware.ts       # Multi-language - rerouting
├── next.config.ts
├── package.json
└── tsconfig.json       # TypeScript configuration
```

### Component Structure

Each component follows a consistent structure:

```text
ComponentName/
├── ComponentName.tsx       # React component
├── ComponentName.module.css # CSS module styles
└── ComponentName.test.tsx  # Unit tests (optional)
```

## Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Getting Started

Since this is a monorepo, always run commands from the **root directory**:

### Installing Packages
To install all required packages, run:
```bash
npm install
```

When adding new packages, always define the workspace:
```bash
npm install <package> --workspace=frontend
```

### Development
```bash
npm run dev --workspace=frontend
```

### Building for Production
```bash
npm run build --workspace=frontend
```

### Starting Production Server
```bash
npm run start --workspace=frontend
```

### Running Tests
```bash
npm run test --workspace=frontend
```

## Key Context Providers

### RideContext
Manages the state of active rides including:
- Ride start/end functionality
- Destination management
- Fare calculation via taximeter hook
- Route availability and status
- Ride rating system

### ShiftContext
Handles shift-related operations:
- Shift start/end with configurable duration
- Break management with reminders
- Pause/resume functionality
- Overtime tracking
- Shift statistics (duration, earnings)

## Development Guidelines

1. **CSS Modules**: Use CSS modules for component styling to ensure style isolation
2. **TypeScript**: Leverage TypeScript for type safety across the application
3. **Testing**: Write unit tests for critical components and utilities
4. **Internationalization**: Use translation keys for all user-facing text
5. **Responsive Design**: Ensure components work well on mobile and desktop devices