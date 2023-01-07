
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
      await queryConnectionPromise(conn, queries[i], args_per_query[i]);
    }

    result = await queryConnectionPromise(conn, queries[i], args_per_query[i]);

    await commitTransactionPromise(conn);
  }
  catch (err) {
    await rollbackTransactionPromise(conn);
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

async function rollbackTransactionPromise(conn) {
  return new Promise((resolve, reject) => {
    conn.rollback((err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

async function queryConnectionPromise(conn, query, args) {
  return new Promise((resolve, reject) => {
    conn.query(query, args, (err, result) => {
      if (err) {
        reject(err);
      }
        resolve(result);
      });
  });
}

export {promiseQuery, atomicPromiseQueries};