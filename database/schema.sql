-- SQLBook: Code
-- Active: 1671284697971@@127.0.0.1@3306@DiscountShare
USE DiscountShare;

DROP TABLE IF EXISTS review;
DROP TABLE IF EXISTS price;
DROP TABLE IF EXISTS discount;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS administrator;
DROP TABLE IF EXISTS shop;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS subcategory;
DROP TABLE IF EXISTS category;


CREATE TABLE user (
    username VARCHAR(24) PRIMARY KEY NOT NULL,
    email VARCHAR(255) NOT NULL,
    hash CHAR(60) BINARY NOT NULL,
    tokens INT NOT NULL DEFAULT 0,
    review_score INT NOT NULL DEFAULT 0,
    total_review_score INT NOT NULL DEFAULT 0
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE administrator (
    username VARCHAR(24) PRIMARY KEY NOT NULL,
    email VARCHAR(255) NOT NULL,
    hash CHAR(60) BINARY NOT NULL
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE shop (
    id VARCHAR(255) PRIMARY KEY NOT NULL,
    shop_type ENUM("convenience", "supermarket") NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    name TEXT,
    website TEXT,
    brand TEXT,
    phone_number TEXT
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE category (
    id VARCHAR(255) PRIMARY KEY NOT NULL,
    name TEXT NOT NULL
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE subcategory (
    id VARCHAR(255) PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    category_id VARCHAR(255) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES category(id) ON UPDATE CASCADE ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE product (
    name VARCHAR(255) PRIMARY KEY NOT NULL,
    image_link TEXT NOT NULL,
    category_id VARCHAR(255) NOT NULL,
    subcategory_id VARCHAR(255) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES category(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (subcategory_id) REFERENCES subcategory(id) ON UPDATE CASCADE ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE price (
    product_name VARCHAR(255) NOT NULL,
    day_date DATE NOT NULL,
    cost FLOAT NOT NULL,
    PRIMARY KEY (product_name, day_date),
    FOREIGN KEY (product_name) REFERENCES product(name) ON UPDATE CASCADE ON DELETE CASCADE    
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE discount (
    shop_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    cost FLOAT NOT NULL,
    username VARCHAR(24) NOT NULL,
    posted DATETIME NOT NULL,
    expiry DATETIME NOT NULL,
    in_stock TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (shop_id, product_name),
    FOREIGN KEY (shop_id) REFERENCES shop(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (product_name) REFERENCES product(name) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (username) REFERENCES user(username) ON UPDATE CASCADE ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE review (
    username VARCHAR(24) NOT NULL,
    shop_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    rating ENUM("like", "dislike") NOT NULL,
    PRIMARY KEY (username, shop_id, product_name),
    FOREIGN KEY (username) REFERENCES user(username) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES shop(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (product_name) REFERENCES product(name) ON UPDATE CASCADE ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
