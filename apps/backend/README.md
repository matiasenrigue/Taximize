my-taxi-app-backend/
├── src/
│   ├── config/
│   │   └── db.ts               # DB connection 
│   ├── controllers/
│   │   └── authController.ts   # signup & signin handlers
│   ├── models/
│   │   └── userModel.ts        # User schema, password hashing
│   ├── routes/
│   │   └── authRoutes.ts       # /signup, /signin
│   ├── middleware/
│   │   └── errorMiddleware.ts  # centralized error handler
│   ├── utils/
│   │   └── generateToken.ts    # JWT creation
│   ├── app.ts                  # express app setup (middleware, routes)
│   └── server.ts               # load .env, connect DB, start server
├── tests/
│   └── auth.test.ts            # Jest + Supertest for signup/signin
├── .env.example                # DB_URI, JWT_SECRET, PORT
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
