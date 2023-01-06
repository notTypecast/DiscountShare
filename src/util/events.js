import { promiseQuery, atomicPromiseQueries } from "./query.js";
import { getDatetimeFromObject } from "./date.js";

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
    constructor(group_id, group_fun) {
        this.group_id = group_id;
        this.group_fun = group_fun;
        this.current_event = null;
    }

    // Executes backlog of expired events and sets the next earliest timeout
    async initialize() {
        const expired_events = await promiseQuery("SELECT * FROM timed_event WHERE activation <= CURDATE() AND group_id=?", [this.group_id]);
        for (let event of expired_events) {
            this.group_fun(event);
            await promiseQuery("DELETE FROM timed_events WHERE id=?", event.id);
        }

        await this._setEarliestTimeout();
    }

    // Schedules a new event
    async addEvent(activation) {
        console.log("Adding event");
        const queries = [
            "INSERT INTO timed_event(group_id, activation) VALUES(?, ?)",
            "SELECT @timer_id AS id"
        ];
        const args_per_query = [
            [this.group_id, activation],
            null
        ];
        const id = (await atomicPromiseQueries(queries, args_per_query))[0].id;

        if (this.current_event === null) {
            await this._setEarliestTimeout();
        }

        return id;
    }

    // PRIVATE
    // Sets the next earliest timeout
    async _setEarliestTimeout() {
        this.current_event = await promiseQuery("SELECT * FROM timed_event ORDER BY activation LIMIT 1");
        console.log(this.current_event);

        if (this.current_event.length === 0) {
            this.current_event = null;
            return;
        }

        this.current_event = this.current_event[0];

        //setTimeout(() => this._executeEvent(this), (new Date(this.current_event.activation)).getTime() - (new Date()).getTime());
        setTimeout(() => this._executeEvent(this), 20000);
    }

    // PRIVATE
    // Executes the defined function when the event is fired. Recursively, this
    // function will ensure that the next earliest activation will be selected,
    // even if timers are activated in the meantime.
    async _executeEvent(event_group) {
        event_group.group_fun(event_group.current_event);
        await promiseQuery("DELETE FROM timed_event WHERE id=?", event_group.current_event.id);
        this._setEarliestTimeout();
    }
}

async function discountEventHandler(event) {
    const discount = await promiseQuery("SELECT * FROM discount INNER JOIN timed_event ON discount.timer_id=timed_event.id WHERE timed_event.id=?", event.id);
    console.log(discount);

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
    console.log("Cond: ", val);

    if (val === 0) {

        await promiseQuery("DELETE FROM discount WHERE shop_id=? AND product_name=?", [discount[0].shop_id, discount[0].product_name]);
    }
    else {
        const newDate = new Date(event.activation);
        newDate.setDate(newDate.getDate() + 7);
        const formattedDatetime = getDatetimeFromObject(newDate);
        await promiseQuery("UPDATE discount SET expiry=? WHERE shop_id=? AND product_name=?", [formattedDatetime, discount.shop_id, discount.product_name]);
        global.discountEventGroup.addEvent(formattedDatetime);
    }
}

async function monthlyTokensEventHandler(event) {

}

export {TimedEventGroup, discountEventHandler, monthlyTokensEventHandler};
