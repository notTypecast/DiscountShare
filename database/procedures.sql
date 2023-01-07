DROP PROCEDURE IF EXISTS calculate_condition_value;
DROP PROCEDURE IF EXISTS calculate_review_points;
DROP PROCEDURE IF EXISTS new_review_score_rating;
DROP PROCEDURE IF EXISTS undo_review_score_rating;
DROP PROCEDURE IF EXISTS backup_discount;

DELIMITER //
-- Calculates condition value of discount that is 2 for good discount, 1 for average and 0 for bad and saves in @discount_condition_value
CREATE PROCEDURE calculate_condition_value(IN prod_name VARCHAR(255) CHARSET utf8mb4, IN new_cost DECIMAL(10, 2))
BEGIN
    DECLARE day_avg DECIMAL(10, 2);
    -- Get yesterday's average price for product (or most recent, if yesterday's doesn't exist)
    SELECT cost INTO day_avg FROM price WHERE product_name=prod_name AND day_date <> CURDATE() ORDER BY DATE(day_date) DESC LIMIT 1;

    -- Check if new price is over 20% better than most recent day average
    IF (new_cost < 0.8*day_avg) THEN
        SET @discount_condition_value = 2;
    -- Check if new price is over 20% better than most recent week average
    ELSE
        BEGIN
        -- Get most recent week average for product
        DECLARE week_avg DECIMAL(10, 2);
        SELECT AVG(cost) INTO week_avg FROM price WHERE product_name=prod_name AND day_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND day_date <> CURDATE();
        IF (new_cost < 0.8*week_avg) THEN
            SET @discount_condition_value = 1;
        ELSE
            SET @discount_condition_value = 0;
        END IF;
        END;
    END IF;
END//

-- Calculates review points that a user should get for a new discount based on existing prices
-- Creates variable @discount_condition_value that is 2 for 50 points, 1 for 20 and 0 for none
CREATE PROCEDURE calculate_review_points(IN new_name VARCHAR(255) CHARSET utf8mb4, IN new_cost DECIMAL(10, 2), IN new_username VARCHAR(24) CHARSET utf8mb4)
BEGIN
    CALL calculate_condition_value(new_name, new_cost);
    
    IF (@discount_condition_value = 2) THEN
        UPDATE user SET review_score=review_score+50, total_review_score=total_review_score+50 WHERE username=new_username;
    ELSEIF (@discount_condition_value = 1) THEN
        UPDATE user SET review_score=review_score+20, total_review_score=total_review_score+20 WHERE username=new_username;
    END IF;
END//

-- Common procedure run by inserts and updates on review
-- Adds or removes corresponding points from review score of user
CREATE PROCEDURE new_review_score_rating(IN new_rating ENUM("like", "dislike"), IN new_shop_id VARCHAR(255) CHARSET utf8mb4, IN new_product_name VARCHAR(255) CHARSET utf8mb4)
BEGIN
    DECLARE points INT;
    DECLARE posted_by VARCHAR(24) CHARSET utf8mb4;
    SELECT (CASE WHEN new_rating="like" THEN 5 ELSE -1 END) INTO points;
    SELECT username INTO posted_by FROM discount WHERE shop_id=new_shop_id AND product_name=new_product_name;
    UPDATE user SET review_score = review_score + points, total_review_score = total_review_score + points WHERE username=posted_by;
END//

-- Common procedure run by deletes and updates on review
-- Adds or removes corresponding points from review score of user
CREATE PROCEDURE undo_review_score_rating(IN old_rating ENUM("like", "dislike"), IN old_shop_id VARCHAR(255) CHARSET utf8mb4, IN old_product_name VARCHAR(255) CHARSET utf8mb4)
BEGIN
    DECLARE points INT;
    DECLARE posted_by VARCHAR(24) CHARSET utf8mb4;
    SELECT (CASE WHEN old_rating="like" THEN -5 ELSE 1 END) INTO points;
    SELECT username INTO posted_by FROM discount WHERE shop_id=old_shop_id AND product_name=old_product_name;
    UPDATE user SET review_score = review_score + points, total_review_score = total_review_score + points WHERE username=posted_by;
END//

-- Adds a discount that is to be deleted to expired discounts
-- Also adds its reviews to expired reviews
CREATE PROCEDURE backup_discount(IN old_shop_id VARCHAR(255) CHARSET utf8mb4, IN old_product_name VARCHAR(255) CHARSET utf8mb4, IN old_cost DECIMAL(10, 2), IN old_username VARCHAR(24) CHARSET utf8mb4, IN old_posted DATETIME, IN old_expiry DATETIME)
BEGIN
    DECLARE likes INT;
    DECLARE dislikes INT;
    DECLARE last_discount_id INT;
    SELECT COUNT(CASE WHEN rating="like" THEN 1 ELSE NULL END), COUNT(CASE WHEN rating="dislike" THEN 1 ELSE NULL END) INTO likes, dislikes FROM review WHERE shop_id=old_shop_id AND product_name=old_product_name;
    INSERT INTO expired_discount(shop_id, product_name, cost, username, posted, expiry, likes, dislikes) VALUES (old_shop_id, old_product_name, old_cost, old_username, old_posted, old_expiry, likes, dislikes);
    SELECT LAST_INSERT_ID() INTO last_discount_id;
    INSERT INTO expired_review(username, expired_discount_id, rating) SELECT username, last_discount_id, rating FROM review WHERE shop_id=old_shop_id AND product_name=old_product_name;
    DELETE FROM review WHERE shop_id=old_shop_id AND product_name=old_product_name;
END//

DELIMITER ;