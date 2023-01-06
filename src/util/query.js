
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

// returns result of last query
async function atomicPromiseQueries(queries, args_per_query) {
  let result;
  const conn = await getConnectionPromise();

  try {
    await beginTransactionPromise(conn);

    let i;
    for (i = 0; i < queries.length - 1; ++i) {
      await promiseQuery(queries[i], args_per_query[i]);
    }

    result = await promiseQuery(queries[i], args_per_query[i]);

    await commitTransactionPromise(conn);
  }
  catch (err) {
    console.log(err);
    console.log("Rolling back transaction");
    conn.rollback();
    throw err;
  }
  finally {
    conn.release();
  }

  return result;

}

async function getConnectionPromise() {
  return new Promise((resolve, reject) => {
    global.pool.getConnection((err, conn) => {
      if (err) {
        reject(err);
      }
      resolve(conn);
    });
  });
}

async function beginTransactionPromise(conn) {
  return new Promise((resolve, reject) => {
    conn.beginTransaction((err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

async function commitTransactionPromise(conn) {
  return new Promise((resolve, reject) => {
    conn.commit((err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

export {promiseQuery, atomicPromiseQueries};