const path = require('path'); 
const mariadb = require('mariadb'); // https://www.npmjs.com/package/mariadb

const env = path.resolve(__dirname, '../.key/database.json');
const pool = mariadb.createPool({
	host: env.host, 
	user: env.user,
	password: '',
	database: 'test', 
	connectionLimit: 5
});

/*pool.getConnection()
.then(conn => {
	conn.query("SELECT 1 as val")
	.then(rows => { // rows: [ {val: 1}, meta: ... ]
		return conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
	})
	.then(res => { // res: { affectedRows: 1, insertId: 1, warningStatus: 0 }
		conn.release(); // release to pool
	})
	.catch(err => {
		conn.release(); // release to pool
	})
}).catch(err => {
	//not connected
});*/

async function asyncFunction() {
	let conn;
	try {
		conn = await pool.getConnection();
		const rows = await conn.query("SELECT 1 as val");
		// rows: [ {val: 1}, meta: ... ]
   
		const res = await conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
		// res: { affectedRows: 1, insertId: 1, warningStatus: 0 }
	}catch(err) {
		throw err;
	}finally {
		if(conn) conn.release(); //release to pool
	}
}

module.exports = {
	test: function() {
		pool.getConnection()
		.then(async connection => {
			console.log("connected ! connection id is " + connection.threadId);
			console.log(await connection.query("select * from test"));
			connection.release(); //release to pool
		})
		.catch(err => {
			console.log("not connected due to error: " + err);
		});
	}
};