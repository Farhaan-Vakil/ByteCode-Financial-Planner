CREATE DATABASE logindata;
\c logindata
CREATE TABLE Accounts (
	id SERIAL PRIMARY KEY NOT NULL,
	username VARCHAR(200) NOT NULL,
	email VARCHAR(200) NOT NULL,
	password VARCHAR(200) NOT NULL,
	UNIQUE (email)
);
