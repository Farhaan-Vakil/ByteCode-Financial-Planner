CREATE DATABASE commoncentsdb;
\c commoncentsdb
CREATE TABLE Accounts (
	id SERIAL PRIMARY KEY NOT NULL,
	username VARCHAR(200) NOT NULL,
	email VARCHAR(200) NOT NULL,
	password VARCHAR(200) NOT NULL,
	UNIQUE (email)
);
CREATE TABLE FinanceEntries (
   id SERIAL PRIMARY KEY,
   email VARCHAR(200) NOT NULL UNIQUE,
   income NUMERIC NULL,
   expenses NUMERIC[] NULL
);
