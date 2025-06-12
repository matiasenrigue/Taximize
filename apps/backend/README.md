> Notes for the future: in prod --> DB sequelize, use migrations


### **.env file**

> Change the name if you want && Put as Password

```bash
# connection string to a superuser database (often 'postgres')
# on your local machine this might be:
#   postgres://postgres:postgres@localhost:5432/postgres

# connect as the superuser for DB‐creation scripts:
PG_ADMIN_URL=postgres://MatiasUCD:YOUR_ADMIN_PASSWORD_HERE@localhost:5432/postgres

# the app’s own credentials & database:
DATABASE_USERNAME=TaxiDriver
DATABASE_PASSWORD=group6UCD
DATABASE_NAME=TaxiAPP

# (optional) how your app will connect via Sequelize:
DATABASE_URL=postgres://TaxiDriver:group6UCD@localhost:5432/TaxiAPP


PORT=5000
JWT_SECRET=your_jwt_secret
```



### **How to create DB locally**

1. Install PostrgeSQL (Mac commands)

```bash
brew install postgresql # To install it

brew services start postgresql # To start

pg_isready # To very it works
```

2. Connect to the DB

```bash
psql -d postgres
```

3. Create your DB 

```bash
-- 1) Create a superuser for admin tasks:
CREATE ROLE "MatiasUCD"
  WITH LOGIN
       SUPERUSER
       PASSWORD '<<YOUR_ADMIN_PASSWORD_HERE>>';

-- 2) Create your app’s own role:
CREATE ROLE "TaxiDriver"
  WITH LOGIN
       PASSWORD 'group6UCD';

-- 3) Create the actual database, owned by TaxiDriver:
CREATE DATABASE "TaxiAPP"
  OWNER "TaxiDriver";

```

