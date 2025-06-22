-- SQL schema for ride_share app
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    car_info VARCHAR(100),
    available BOOLEAN DEFAULT FALSE,
    password VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    email VARCHAR(100) UNIQUE,
    verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rides (
    id SERIAL PRIMARY KEY,
    rider_id INTEGER REFERENCES users(id),
    driver_id INTEGER REFERENCES drivers(id),
    origin VARCHAR(255),
    destination VARCHAR(255),
    status VARCHAR(50),
    requested_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;