USE DiscountShare;

DROP TABLE IF EXISTS review;
DROP TABLE IF EXISTS price;
DROP TABLE IF EXISTS discount;
DROP TABLE IF EXISTS expired_review;
DROP TABLE IF EXISTS expired_discount;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS shop;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS subcategory;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS timed_event;


CREATE TABLE timed_event (
    id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    group_id INT NOT NULL,
    activation DATETIME NOT NULL
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user (
    username VARCHAR(24) PRIMARY KEY NOT NULL,
    email VARCHAR(255) NOT NULL,
    hash CHAR(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    creation DATETIME DEFAULT NOW(),
    last_updated BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
    tokens INT NOT NULL DEFAULT 0,
    total_tokens INT NOT NULL DEFAULT 0,
    review_score INT NOT NULL DEFAULT 0,
    total_review_score INT NOT NULL DEFAULT 0,
    is_admin TINYINT NOT NULL DEFAULT 0
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
    cost DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (product_name, day_date),
    FOREIGN KEY (product_name) REFERENCES product(name) ON UPDATE CASCADE ON DELETE CASCADE    
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE discount (
    shop_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    username VARCHAR(24) NOT NULL,
    posted DATETIME NOT NULL,
    expiry DATETIME NOT NULL,
    in_stock TINYINT NOT NULL DEFAULT 1,
    timer_id INT,
    PRIMARY KEY (shop_id, product_name),
    FOREIGN KEY (shop_id) REFERENCES shop(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (product_name) REFERENCES product(name) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (username) REFERENCES user(username) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (timer_id) REFERENCES timed_event(id) ON UPDATE CASCADE ON DELETE SET NULL
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

CREATE TABLE expired_discount (
    discount_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    shop_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    username VARCHAR(24) NOT NULL,
    posted DATETIME NOT NULL,
    expiry DATETIME NOT NULL,
    likes INT NOT NULL,
    dislikes INT NOT NULL,
    FOREIGN KEY (shop_id) REFERENCES shop(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (product_name) REFERENCES product(name) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (username) REFERENCES user(username) ON UPDATE CASCADE ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE expired_review (
    username VARCHAR(24) NOT NULL,
    expired_discount_id INT NOT NULL,
    rating ENUM("like", "dislike") NOT NULL,
    PRIMARY KEY (username, expired_discount_id),
    FOREIGN KEY (username) REFERENCES user(username) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (expired_discount_id) REFERENCES expired_discount(discount_id) ON UPDATE CASCADE ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX discount_idx
ON discount(posted, username);

CREATE INDEX exp_discountIdx
ON expired_discount(posted);

CREATE INDEX price_idx
ON price(day_date);

CREATE INDEX product_idx
ON product(category_id, subcategory_id);

CREATE INDEX user_idx
ON user(total_review_score);

CREATE INDEX subcategory_idx
ON subcategory(category_id);
