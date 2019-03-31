##comands to enter when setting up server

#commands to enter in postgresql server
```
CREATE DATABASE server;
```
```
CREATE TABLE users
(
  id INTEGER NOT NULL,
  username TEXT NOT NULL,
  email TEXT,
  password TEXT NOT NULL
)
```
```
CREATE TABLE tokens
(
  id INTEGER NOT NULL,
  bearer_token character VARCHAR(15) NOT NULL,
  bearer_token_expire TIMESTAMPTZ NOT NULL,
  refresh_token character VARCHAR(15) NOT NULL,
  refresh_token_expire TIMESTAMPTZ NOT NULL
)
```