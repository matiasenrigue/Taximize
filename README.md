# Taxi Driver App

## Project Structure
```
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   ├── jest.config.js      # testing configuration
│   │   ├── package.json
│   │   └── tsconfig.json       # backend typescript configuration
│   └── frontend/
│       ├── __mocks__/          # testing - mocks to replace css-modules and files
│       ├── app/                # app & pages
│       ├── components/         # reusable components
│       ├── dictionaries/       # multi-language - dictionaries
│       ├── hooks/              # custom hooks
│       ├── public/             # static assets
│       ├── .npmrc
│       ├── .swcrc              # testing - SWC configuration (SWC compiles .tsx and .jsx to .js)
│       ├── jest.config.ts      # testing configuration
│       ├── jest.setup.ts       # testing - setup environment
│       ├── middleware.ts       # multi-language - rerouting
│       ├── next.config.ts
│       ├── next.env.d.ts
│       ├── package.json
│       └── tsconfig.json       # frontend typescript configuration
├── node_modules/               # shared modules, do not commit!
├── packages/                   # shared code
├── .gitignore
├── .npmrc
├── eslint.config.mjs
├── package.json                # workspace configuration
├── package-lock.json
├── README.md
└── tsconfig.base.json          # base typescript configuration
```

## Getting Started
### Development
To run the development server for a specific workspace:
```bash
npm run dev --workspace=frontend
```
or
```bash
npm run dev --workspace=backend
```

### Testing
To run tests for a specific workspace:
```bash
npm run test --workspace=frontend
```
or
```bash
npm run test --workspace=backend
```

### Installing Packages

**Always** install packages for a specific workspace:
```bash
npm install <package> --workspace=apps/backend
```