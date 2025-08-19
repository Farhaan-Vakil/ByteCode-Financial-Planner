CREATE DATABASE commoncentsdb;
\c commoncentsdb

/*Sample budgets json:
[{
  "income":  1500,
  "expenses": [{"rent": 1500, "food": 1200}],
  "stocks": [{"apple": 2}]
}]
  */
CREATE TABLE accounts (
	id SERIAL PRIMARY KEY NOT NULL,
	username VARCHAR(200) NOT NULL,
	email VARCHAR(200) NOT NULL,
	password VARCHAR(200) NOT NULL,
	budgets JSONB NULL,
	UNIQUE (email)
);
