-- Active: 1671284697971@@127.0.0.1@3306@DiscountShare
DROP TRIGGER IF EXISTS self_review_check;
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
DELIMITER ;