# Taximize: Frontend

## Project Structure
```text
frontend/
├── __mocks__/          # testing - mocks to simulate css-modules, files, and packages
├── app/                # pages
├── assets/
├── components/         # reusable components
├── constants/          # global constants
├── contexts/
├── dictionaries/       # multi-language - texts
├── hooks/
├── i18n/               # multi-language - next-intl setup
├── lib/                # utility functions
├── public/             # static assets
├── .env
├── .npmrc
├── .swcrc              # testing - SWC configuration (SWC compiles .tsx and .jsx to .js)
├── jest.config.ts      # testing - configuration
├── jest.setup.ts       # testing - setup environment
├── middleware.ts       # multi-language - rerouting
├── next.config.ts
├── next.env.d.ts
├── package.json
├── README.md
└── tsconfig.json       # typescript configuration
```

## Getting Started
Since this is a monorepo, always run commands from the root!

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

### Deployment
```bash
npm run build --workspace=frontend
npm run start --workspace=frontend
```

### Testing
```bash
npm run test --workspace=frontend
```