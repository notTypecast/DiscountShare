
function promiseQuery(query, args) {
  return new Promise((resolve, reject) => {
    global.pool.query(query, args, (err, result) => {
        if (err) {
            reject(err);
        }
        resolve(result);
    });
  });
}

export {promiseQuery};