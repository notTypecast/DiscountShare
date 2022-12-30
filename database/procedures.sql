-- SQLBook: Code
DROP PROCEDURE IF EXISTS calculate_review_points;

DELIMITER //
CREATE PROCEDURE calculate_review_points(IN new_name VARCHAR(255) CHARSET utf8, IN new_cost DECIMAL(10, 2), IN new_username VARCHAR(24) CHARSET utf8)
BEGIN
    DECLARE day_avg DECIMAL(10, 2);
    -- Get most recent day average for product
    SELECT cost INTO day_avg FROM price WHERE product_name=new_name AND day_date <> CURDATE() ORDER BY DATE(day_date) DESC LIMIT 1;

    -- Check if new price is over 20% better than most recent day average
    IF (new_cost < 0.8*day_avg) THEN
        BEGIN
        UPDATE user SET review_score=review_score+50, total_review_score=total_review_score+50 WHERE username=new_username;
        SET @discount_condition_value = 2;
        END;
    -- Check if new price is over 20% better than most recent week average
    ELSE
        BEGIN
        -- Get most recent week average for product
        DECLARE week_avg DECIMAL(10, 2);
        SELECT AVG(cost) INTO week_avg FROM price WHERE product_name=new_name AND day_date >= DATE_SUB(CURDATE(), INTERVAL 8 DAY) AND day_date <> CURDATE();
        IF (new_cost < 0.8*week_avg) THEN
            BEGIN
            UPDATE user SET review_score=review_score+20, total_review_score=total_review_score+20 WHERE username=new_username;
            SET @discount_condition_value = 1;
            END;
        ELSE
            SET @discount_condition_value = 0;
        END IF;
        END;
    END IF;
END;//

DELIMITER ;