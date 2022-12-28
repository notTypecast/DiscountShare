-- SQLBook: Code
-- Active: 1671284697971@@127.0.0.1@3306@DiscountShare
DROP TRIGGER IF EXISTS self_review_check;
DROP TRIGGER IF EXISTS new_discount_check;
DELIMITER //
CREATE TRIGGER self_review_check
BEFORE INSERT ON review
FOR EACH ROW
BEGIN
    DECLARE discount_username VARCHAR(24);
    SELECT discount.username INTO discount_username FROM discount WHERE discount.shop_id=NEW.shop_id AND discount.product_name=NEW.product_name;

    IF NEW.username = discount_username THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: cannot rate own post';
    END IF;

END//

CREATE TRIGGER new_discount_check
BEFORE INSERT ON discount
FOR EACH ROW
BEGIN
    DECLARE old_cost FLOAT;

    -- Check if same discount already exists
    IF (SELECT COUNT(*) FROM discount WHERE shop_id=NEW.shop_id AND product_name=NEW.product_name) > 0 THEN
        -- Delete previous discount if the price of this discount is over 20% better
        SELECT cost INTO old_cost FROM discount WHERE shop_id=NEW.shop_id AND product_name=NEW.product_name;
        IF (NEW.cost < 0.8*old_cost) THEN
            DELETE FROM discount WHERE shop_id=NEW.shop_id AND product_name=NEW.product_name;
        ELSE
            SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Error: similar discount for product already exists';
        END IF;
    END IF;

END//
DELIMITER ;