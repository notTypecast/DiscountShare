-- SQLBook: Code
-- Active: 1671284697971@@127.0.0.1@3306@DiscountShare
DROP TRIGGER IF EXISTS self_review_check;
DROP TRIGGER IF EXISTS discount_update_check;
DROP TRIGGER IF EXISTS new_discount_check;
DROP TRIGGER IF EXISTS save_expired_discount;
DELIMITER //
-- Ensures a user cannot rate their own post
CREATE TRIGGER self_review_check
BEFORE INSERT ON review
FOR EACH ROW
BEGIN
    DECLARE discount_username VARCHAR(24);
    SELECT discount.username INTO discount_username FROM discount WHERE discount.shop_id=NEW.shop_id AND discount.product_name=NEW.product_name;

    IF NEW.username = discount_username THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot rate own post.';
    END IF;

END//
-- When updating discount table with same primary key, allows the update only if discount cost is over 20% better
CREATE TRIGGER discount_update_check
BEFORE UPDATE ON discount
FOR EACH ROW
BEGIN
    -- Allow updates on in_stock alone
    IF (NEW.shop_id=OLD.shop_id AND NEW.product_name=OLD.product_name AND NEW.cost=OLD.cost AND NEW.username=OLD.username AND NEW.posted=OLD.posted AND NEW.expiry=OLD.expiry) THEN
        LEAVE;
    END IF;

    -- Ensure price is positive
    IF (NEW.cost < 0) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = "Invalid price.";
    END IF;

    -- Check if same discount already exists
    IF (SELECT COUNT(*) FROM discount WHERE shop_id=NEW.shop_id AND product_name=NEW.product_name) > 0 THEN
        BEGIN
        DECLARE old_cost DECIMAL(10, 2);
        -- Update discount if the price of this discount is over 20% better
        SELECT cost INTO old_cost FROM discount WHERE shop_id=NEW.shop_id AND product_name=NEW.product_name;
        IF (NEW.cost < 0.8*old_cost) THEN
            -- If update is allowed, add old discount to expired discounts
            BEGIN
            DECLARE likes INT;
            DECLARE dislikes INT;
            SELECT COUNT(CASE WHEN rating="like" THEN 1 ELSE NULL END), COUNT(CASE WHEN rating="dislike" THEN 1 ELSE NULL END) INTO likes, dislikes FROM review WHERE username=OLD.username AND shop_id=OLD.shop_id AND product_name=OLD.product_name;
            INSERT INTO expired_discount(shop_id, product_name, cost, username, posted, expiry, likes, dislikes) VALUES (OLD.shop_id, OLD.product_name, OLD.cost, OLD.username, OLD.posted, OLD.expiry, likes, dislikes);
            END;
        ELSE
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Similar discount already exists for product in this store.';
        END IF;
        END;
    END IF;

    CALL calculate_review_points(NEW.product_name, NEW.cost, NEW.username);

END//
-- Checks validity of price for new discount
-- Adds review score points to user, depending on how good the discount is
-- Creates new session variable @discount_condition_value containing 2, 1 or 0 depending on whether user got 50, 20 or 0 points respectively
CREATE TRIGGER new_discount_check
BEFORE INSERT ON discount
FOR EACH ROW
BEGIN
    -- Ensure price is positive
    IF (NEW.cost < 0) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = "Invalid price.";
    END IF;

    CALL calculate_review_points(NEW.product_name, NEW.cost, NEW.username);

END//
-- Saves a discount before it is deleted to the expired_discount table
CREATE TRIGGER save_expired_discount
BEFORE DELETE ON discount
FOR EACH ROW
BEGIN
    DECLARE likes INT;
    DECLARE dislikes INT;
    SELECT COUNT(CASE WHEN rating="like" THEN 1 ELSE NULL END), COUNT(CASE WHEN rating="dislike" THEN 1 ELSE NULL END) INTO likes, dislikes FROM review WHERE username=OLD.username AND shop_id=OLD.shop_id AND product_name=OLD.product_name;
    INSERT INTO expired_discount(shop_id, product_name, cost, username, posted, expiry, likes, dislikes) VALUES (OLD.shop_id, OLD.product_name, OLD.cost, OLD.username, OLD.posted, OLD.expiry, likes, dislikes);
END//
-- Changes user review score when they get a rating
CREATE TRIGGER review_score_rating
AFTER INSERT ON review
FOR EACH ROW
BEGIN
    UPDATE user SET review_score = review_score + (CASE WHEN NEW.rating="like" THEN 5 ELSE -1 END) WHERE username=NEW.username;
END//
DELIMITER ;