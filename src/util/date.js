function getDatetimeFromObject(date) {
    let year = date.getFullYear();  // Get the year
    let month = (date.getMonth() + 1).toString().padStart(2, "0");  // Get the month (0-based) and pad with a leading zero if needed
    let day = date.getDate().toString().padStart(2, "0");  // Get the day of the month and pad with a leading zero if needed
    let hours = date.getHours().toString().padStart(2, "0");  // Get the hours and pad with a leading zero if needed
    let minutes = date.getMinutes().toString().padStart(2, "0");  // Get the minutes and pad with a leading zero if needed
    let seconds = date.getSeconds().toString().padStart(2, "0");  // Get the seconds and pad with a leading zero if needed
    
    let formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    return formattedDate;
}

// Given a date object, return the date of the next month
function getNextMonthDate(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export { getDatetimeFromObject, getNextMonthDate };