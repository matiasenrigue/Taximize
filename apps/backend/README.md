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



### **.env file**

```bash
# connection string to a superuser database (often 'postgres')
# on your local machine this might be:
#   postgres://postgres:postgres@localhost:5432/postgres

# connect as the superuser for DB‐creation scripts:
PG_ADMIN_URL=postgres://<adminUser>:<adminPass>@<host>:<port>/postgres

# the app’s own credentials & database:
DATABASE_USERNAME=app_user
DATABASE_PASSWORD=app_password
DATABASE_NAME=app_db

# (optional) how your app will connect via Sequelize:
DATABASE_URL=postgres://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@<host>:<port>/${DATABASE_NAME}

PORT=5000
JWT_SECRET=your_jwt_secret
```



