# Taxi Driver App
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project Structure
```
├── __mocks__/                  # testing - mocks to replace css-modules and files
├── app/                        # app pages
├── components/                 # reusable components
├── public/                     # static assets
├── .gitignore
├── .swcrc                      # testing - SWC configuration (SWC compiles .tsx and .jsx to .js)
├── eslint.config.mjs
├── jest.config.ts              # testing configuration
├── jest.setup.ts               # testing - setup environment
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── README.md
└── tsconfig.json               # typescript configuration
```

## Getting Started

To run the development server:
```bash
npm run dev
```

To run tests:
```bash
npm test
```