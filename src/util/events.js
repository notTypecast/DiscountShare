import { promiseQuery, atomicPromiseQueries } from "./query.js";
import { getDatetimeFromObject } from "./date.js";

const MAX_SINT_32 = 2147483647;

class TimedEventGroup {
    /* Defines a timed event group.
     * Timed event groups consist of groups of the same type of events that are scheduled 
     * to run in the future.
     * Such events are saved in the database and, once their activation time is reached, 
     * are deleted and executed using the group's execution function.
     * As such, added events will be executed even if there is server downtime.
     * All added events must have an activation datetime that comes after the currently running timeout's activation,
     * or they will be run after the current timeout finishes.
    */ 
   
    // Initializes the event group with an ID (MUST be unique among all existing group IDs) and a group function to run on each event

    static cleanup_func = async (id) => {
        await promiseQuery("DELETE FROM timed_event WHERE id=?", id);
    };

    constructor(group_id, group_fun) {
        this.group_id = group_id;
        this.group_fun = group_fun;
        this.current_event = null;
    }

    // Executes backlog of expired events and sets the next earliest timeout
    async initialize() {
        const expired_events = await promiseQuery("SELECT * FROM timed_event WHERE activation <= NOW() AND group_id=?", [this.group_id]);
        for (let event of expired_events) {
            await this.group_fun(event, async () => await TimedEventGroup.cleanup_func(event.id));
        }

        await this._setEarliestTimeout();
    }

    // Schedules a new event
    async addEvent(activation) {
        const queries = [
            "INSERT INTO timed_event(group_id, activation) VALUES(?, ?)",
            "SELECT LAST_INSERT_ID() AS id"
        ];
        const args_per_query = [
            [this.group_id, activation],
            null
        ];
        const id = (await atomicPromiseQueries(queries, args_per_query))[0].id;

        await this._setEarliestTimeout();

        return id;
    }

    // PRIVATE
    // Sets the next earliest timeout
    async _setEarliestTimeout() {
        if (this.current_event !== null) {
            return;
        }

        this.current_event = await promiseQuery("SELECT * FROM timed_event WHERE group_id=? ORDER BY activation LIMIT 1", [this.group_id]);

        if (this.current_event.length === 0) {
            this.current_event = null;
            return;
        }

        this.current_event = this.current_event[0];

        //this._setTimeout_safe(5000);
        this._setTimeout_safe((new Date(this.current_event.activation)).getTime() - (new Date()).getTime());
    }

    // PRIVATE
    // Sets timeout, but correctly handles wait times larger than maximum value accepted by setTimeout (32-bit signed integer)
    // Will chain multiple timeouts of max value to reach total timeout duration
    _setTimeout_safe(sleep_duration) {
        if (sleep_duration <= 0) {
            this._executeEvent(this);
        }
        else if (sleep_duration <= MAX_SINT_32){
            setTimeout(() => this._setTimeout_safe(0), sleep_duration);
        }
        else {
            setTimeout(() => this._setTimeout_safe(sleep_duration - MAX_SINT_32), MAX_SINT_32);
        }
    }

    // PRIVATE
    // Executes the defined function when the event is fired. Recursively, this
    // function will ensure that the next earliest activation will be selected,
    // even if timers are activated in the meantime.
    async _executeEvent(event_group) {
        await event_group.group_fun(event_group.current_event, async () => await TimedEventGroup.cleanup_func(event_group.current_event.id));
        this.current_event = null;
        this._setEarliestTimeout();
    }
}

async function discountEventHandler(event, cleanup) {
    const discount = await promiseQuery("SELECT * FROM discount WHERE timer_id=?", event.id);
    

    if (discount.length === 0) {
        return;
    }
    
    const queries = [
        "CALL calculate_condition_value(?, ?)",
        "SELECT @discount_condition_value AS condition_value"
    ];
    const args_per_query = [
        [discount[0].product_name, discount[0].cost],
        null
    ]
    
    let val = await atomicPromiseQueries(queries, args_per_query);
    val = val[0].condition_value;

    await cleanup();

    if (val === 0) {
        await promiseQuery("DELETE FROM discount WHERE shop_id=? AND product_name=?", [discount[0].shop_id, discount[0].product_name]);
    }
    else {
        const newDate = new Date(event.activation);
        newDate.setDate(newDate.getDate() + 7);
        const formattedDatetime = getDatetimeFromObject(newDate);
        const bumpedId = await global.discountEventGroup.addEvent(formattedDatetime);
        await promiseQuery("UPDATE discount SET expiry=?, timer_id=? WHERE shop_id=? AND product_name=?", [formattedDatetime, bumpedId, discount[0].shop_id, discount[0].product_name, bumpedId]);
    }
}

// This handler is fired at the end of each month, distributing tokens to all users appropriately
async function monthlyTokensEventHandler(event, cleanup) {
    // event.activation should be YYYY-MM-01
    // calculate the number of tokens to distribute according to last month's number of users
    const currentDate = new Date(event.activation);
    const prevMonth = getDatetimeFromObject(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    // total tokens to distribute: 100U*(80%) = 80U
    const total_users = (await promiseQuery("SELECT COUNT(*) AS total_users FROM user WHERE creation <= ?", prevMonth))[0].total_users;
    const total_score = (await promiseQuery("SELECT SUM((CASE WHEN review_score < 0 THEN 0 ELSE review_score END)) AS total_score FROM user"))[0].total_score;

    // distribute based on current month score and set current review score to 0
    if (total_users > 0) {
        if (total_score > 0) {
            const tokens = 80*total_users;
            await promiseQuery("UPDATE user SET tokens=ROUND((review_score/?)*?), total_tokens=total_tokens+tokens, review_score=0", [total_score, tokens]);
        }
        else {
            await promiseQuery("UPDATE user SET tokens=0, review_score=0")
        }
    }

    await cleanup();

    currentDate.setMonth(currentDate.getMonth() + 1);
    await global.monthlyTokensEventGroup.addEvent(getDatetimeFromObject(currentDate));
}

export {TimedEventGroup, discountEventHandler, monthlyTokensEventHandler};
