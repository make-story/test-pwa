
/*
-
mysql / mysql2 
mysql 과 mysql2 가 다른점은 대표적으로 promise 지원의 차이
*/
const path = require('path'); 
const mysql = require('mysql2'); // https://www.npmjs.com/package/mysql2
//const mysql = require('mysql2/promise');

const pool = mysql.createPool({
	host: 'localhost',
	user: 'root',
	database: 'test',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
});
const result = async () => {
	const conn = pool.getConnection();

	try {
		const [ row ] = await conn.query("SELECT * FROM TABLE WHERE id = 4");
		return row;
	}catch (e) {
		throw new Error(e);
	}finally {
		//pool.releaseConnection(conn); // 연결해제
		conn.release(); // pool 을 돌려주는 역할을 한다.
	}
};

/*
-
MySQL
http://bcho.tistory.com/892

-
외래키
CASCADE 
  참조키와 동일하게 맞춘다. 즉 참조키값이 삭제되면 해당 테이블의 동일한 레코드도 삭제되며 
  참조키값이 업데이트(예 aa => bb 로 바뀐다면)되면 외래키값도 업데이트(aa => bb 로 바뀐다)가 된다. 
RESTRICT : 참조키가 삭제되거나 업데이트 되는걸 막는다. 
SET NULL : 참조키가 삭제되거나 업데이트 되면 외래키값을 null 로만든다. 
NO ACTION : 참조키가 삭제되거나 업데이트 되어도 아무런 동작을 하지 않는다. 이 경우는 외래키의 의미가 없다고 볼수 있다. 

-
Connetion Pooling
node-mysql도 기본적으로 connection pooling을 제공한다. Connection pooling을 사용하는 법은 매우 쉽다.앞의 예제의 경우에는 전체가 하나의 connection만 사용하기 때문에 동시에 많은 요청이 들어올 경우 제대로 처리가 되지 않는다.
Connection을 만드는 부분을 살펴보면 DB Connection을 만드는 방법과 크게 다르지 않다.여기에 몇가지 인자를 추가 지정할 수 있는데, connectionLimit은 pool에 담을 수 있는 최대의 connection 수이다. 여기서는 20개로 설정하였다. (디폴트는 10)
다음으로 사용한 옵션이waitForConnection이라는 옵션인데, true로 되어 있으면 Pool내에 가용한 Connection이 없을 경우에 Connection이 반납되기를 기다리고, false로 되어 있으면, Connection이 없을 경우 바로 에러를 리턴한다.
var pool = mysql.createPool({
	host: 'localhost',
	port: 3306,
	user: '',
	password: '',
	database: 'test',
	connectionLimit:20,
	waitForConnections:false
});
 
실제로 테스트를 해보면 재미있는 점이, Pool이 생성되도, 실제로 connection이 만들어지지 않는다. Pool.getConnection시에, 유휴 connection이 없을 경우에만 connectionLimit 범위안에서 connection을 생성한다.
아쉬운 점이 자바 엔터프라이즈에서 사용하는 Connection Pool의 경우 min/max 값을 정해서 자동으로 connection pool의 사이즈를 조정한다거나, 각 Connection을 health 상태를 주기적으로 검사해서 문제가 있는 것은 끊는다거나 등의 기능이 되는데, 거의 기능이 없다. (장애 대응이 쉽지 않을 듯)
Pool을 사용해서 Query를 해보자. 앞에서 구현한 select * from users를 pool로 구현해주면 query 전에 pool.getConnection으로 싸주고, getConnection의 callback 함수안에서 두 번째 인자로 넘어온 connection 객체를 이용해서 쿼리를 수행하면 된다.
//select all
app.get('/users', function(req, res){
	pool.getConnection(function(error, connection){
		var query = connection.query('select * from users', function (error, rows) {
			if(error){
				connection.release();
				throw error;
			}
			console.log(rows);
			res.json(rows);
			connection.release();
		});
		console.log(query);
	});
});
여기서 주의할점은 connection을 사용한 후에, 반드시 connection.release 를 이용해서 pool에 connection을 반납해야 한다.특히 에러가 났을때도 connection을 반납해야 하는 것을 잊지 말아야 한다.이렇게 connection을 반납하지 않아서 유휴 conneciton이 pool에 남아있지 않는 현상을 connection leak이라고 하는데, connection pool을 사용할 때 상당히 자주 발생하는 장애이기 때문에 반드시 꼼꼼하게 처리하기 바란다. (나중에 leak이 발생하면 찾기도 어렵다.)

-
Transaction(트랜잭션) 처리
var user = {'userid':req.body.userid, 'name':req.body.name, 'address':req.body.address};
pool.getConnection(function(error, connection) {
	connection.beginTransaction(function(error) {
		if(error) {
			throw error;
		}

		//
		connection.query('insert into users set ?', user, function(error, result) {
			if(error) {
				console.error(error);
				connection.rollback(function() {
					connection.release();
					console.error('rollback error');
					throw error;
				});
			} // if error

			console.log('insert transaction log');
			var log = {'userid': req.body.userid};
			connection.query('insert into log set ?', log, function(error, result) {
				if(error) {
					console.error(error);
					connection.rollback(function() {
						connection.release();
						console.error('rollback error');
						throw error;
					});
				} // if error

				connection.commit(function(error) {
					if(error) {
						console.error(error);
						connection.rollback(function() {
							connection.release();
							console.error('rollback error');
							throw error;
						});
					} // if error

					//
					connection.release();
					res.send(200, 'success');
 
				}); // commit
			}); // insert into log
		}); // inset into users
	}); // begin trnsaction
});

-
SQL injection attack을 방어
var mysql = require('mysql');
mysql.escape(값)
*/

// mysql connection
var connection = mysql.createConnection({
	user: '', // 사용자
	password: '', // 비밀번호
	//database: 'test',
	//host: 'localhost',
	//port: 3306,
	insecureAuth: true
});
var connect = function(database) { // 연결
	var database = database || 'test';
	connection.connect(function(error) {
		if(error) {
			console.error('mysql connection error');
			console.error(error);
			throw error;
		}
	});
	if(database) {
		connection.query('use ' + database);
	}
};
var end = function() { // 종료
	//close
	connection.end();
};
//connect('test');
var pool = (function(database) { // connection pooling
	var database = database || 'test';
	return mysql.createPool({
		host: 'localhost',
		port: 3306,
		user: '', // 사용자
		password: '', // 비밀번호
		database: database,
		connectionLimit: 20, // 한 번에 만들 수있는 최대 연결 수입니다. (기본값 : 10)
		waitForConnections: false,
		insecureAuth: true
	});
})('test');

// sql 쿼리
var getQuery = function(query, binding, done, fail) {
	try {
		pool.getConnection(function(error, connection) {
			if(error) throw error;
			connection.query(query, binding, function(error, results, fields) {
				connection.release();
				if(error) {
					if(typeof fail === 'function') {
						fail();
					}
					throw error;
				}else if(typeof done === 'function') {
					if(Array.isArray(results)) {
						done(results);
					}
				}
			});
		});
	}catch(e) {
		console.log(e);
	}
};
var setQuery = function(query, binding, done, fail) {
	try {
		pool.getConnection(function(error, connection) {
			if(error) throw error;
			connection.query(query, binding, function(error, results, fields) {
				connection.release();
				if(error) {
					if(typeof fail === 'function') {
						fail();
					}
					throw error;
				}else if(typeof done === 'function') {
					done(results.insertId || '');
				}
			});
		});
	}catch(e) {
		console.log(e);
	}
};
var setTransactionQuery = function(arr, callback) {
	/*
	-
	arr 파라미터 형식
	[
		{'query': 'insert into test (name, phone) values (?)', 'binding': ['ysm', '01012345678']}, 
		{'query': 'update test set name = ?', 'binding': ['ysm']},
		...
	]
	*/
	var arr = Array.isArray(arr) ? arr : [];

	// 엔진이 InnoDB 인것만 가능
	pool.getConnection(function(error, connection) {
		connection.beginTransaction(function(error) {
			if(error) {
				throw error;
			}

			// 순차적 반복실행 (콜백루프)
			(function setLoop(arr) {
				var obj = arr.shift();
				connection.query(obj['query'], obj['binding'] || [], function(error, result) {
					if(error) {
						console.error(error);
						connection.rollback(function() {
							connection.release();
							console.error('rollback error');							
							throw error;
						});
					}

					if(arr.length) {
						// loop 실행
						setLoop(arr);
					}else {
						// commit
						connection.commit(function(error) {
							if(error) {
								console.error(error);
								// rollback
								connection.rollback(function() {
									connection.release();
									console.error('rollback error');
									throw error;
								});
							}
							//
							connection.release();
							// callback
		 					if(typeof callback === 'function') {
		 						callback();
		 					}
						});
					}
				});
			})(arr);
		});
	});
};

/*
// get
var query = [];
query.push("select a.*, c.code as code_category, c.category");
query.push("from documents a");
query.push("left outer join documents_categories b on b.code_document = a.code");
query.push("left outer join categories c on c.code = b.code_category");
query.push("where a.code = ?");
getQuery(query.join(' '), [code], 
    function(arr) {
        var i, max;
        for(i=0, max=arr.length; i<max; i++) {
            if(arr[i].content) {
                arr[i].content = bundle.setStripTags(arr[i].content);
            }
        }
        return response.json({'status': 'success', 'result': arr}); // status
    },
    function() {
        return response.json({'status': 'error'}); // status
    }
);

// set
setQuery('insert into documents_categories (code_document, code_category) values (?, ?) ON DUPLICATE KEY UPDATE code_document = ?, code_category = ?', [code_document, code_category, code_document, code_category], 
    function() {
        setQuery('delete from documents_categories where code_document = ? and code_category != ?', [code_document, code_category]);
        return response.json({'status': 'success'});
    },
    function() {
        return response.json({'status': 'error'});	
    }
);
*/