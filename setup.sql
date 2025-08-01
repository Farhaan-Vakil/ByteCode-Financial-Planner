CREATE DATABASE LoginData;
\c LoginData
CREATE TABLE Accounts (
	id SERIAL PRIMARY KEY,
	username VARCHAR(15),
	password VARCHAR(25)
);
