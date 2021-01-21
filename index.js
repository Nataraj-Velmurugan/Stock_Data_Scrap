const cron = require('node-cron');
const axios = require('axios');

const fs = require(`fs`);
const mysql = require(`mysql-await`);

let connection;

// JSON.parse(fs.readFileSync(`mysql-config.json`))
(async () => {
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '5342',
    database: 'STOCK_DATA',
});

pool.on(`acquire`, (connection) => {
    console.log(`Connection %d acquired`, connection.threadId);
});

pool.on(`connection`, (connection) => {
    console.log(`Connection %d connected`, connection.threadId);
});

pool.on(`enqueue`, () => {
    console.log(`Waiting for available connection slot`);
});

pool.on(`release`, function (connection) {
    console.log(`Connection %d released`, connection.threadId);
});

connection = await pool.awaitGetConnection();

connection.on(`error`, (err) => {
    console.error(`Connection error ${err.code}`);
});


// connection.release();

// result = await pool.awaitQuery(`SELECT * FROM people WHERE age = ?`, [45]);

// console.log(result);

// await pool.awaitEnd();

})();

// var valid = cron.validate('*/30 * * * * *');
// console.log(valid)

cron.schedule('*/30 * * * * *', async () => {
    console.log(new Date().toLocaleTimeString())
    console.log('running a task every 30 seconds');
    
    let resp = await axios.get('http://nimblerest.lisuns.com:4531/GetLastQuoteArray/?accessKey=5033487b-e9c3-4355-ad66-3c6824c069bd&exchange=NSE&instrumentIdentifiers=RELIANCE');
    // console.log(resp.data);

    if(resp.data === 'Authentication request received. Try request data in next moment.') {
       resp = await axios.get('http://nimblerest.lisuns.com:4531/GetLastQuoteArray/?accessKey=5033487b-e9c3-4355-ad66-3c6824c069bd&exchange=NSE&instrumentIdentifiers=RELIANCE');
    }

    let responseArray = resp.data;

    let [relianceData] = responseArray.filter(obj=>obj.INSTRUMENTIDENTIFIER==='RELIANCE');

    let result = await connection.awaitQuery(`INSERT INTO RELIANCE (LOW, HIGH) 
                                              VALUES ('${relianceData.LOW}', '${relianceData.HIGH}')`);
    // console.log(result);

});