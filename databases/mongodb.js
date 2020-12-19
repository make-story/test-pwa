const path = require('path'); 
const mongoose = require('mongoose'); // MongoDB 기반 ODM(Object Data Modelling) - 4 버전부터 쿼리가 프로미스를 지원합니다. 3버전까지는 쿼리를 프로미스로 만들기 위해서 뒤에 exec()을 붙여주어야 했습니다. 4버전부터는 필요하지 않습니다.
//const autoIncrement = require('mongoose-auto-increment');

const env = require(path.resolve(__dirname, '../config/env'));
const { connection } = mongoose;

// mongodb 연결 
// DB 연결 부분을 주의하자, Model을 불러오는데(사용하는데) MongoDB 가 먼저 연결되지 않는다면 initialize 과정에서 에러가 발생한다.
const uri = `mongodb://${env.mongoHost}:27017/${env.mongoDB}`;
const options = {
    useNewUrlParser: true/*사용하면 mongoDB_URL에 PORT를 넣을 수 있다*/, 
    useFindAndModify: false/*문서에 따르면 false로 설정하면 findAndModify() 대신에 네이티브 함수인 findOneAndUpdate()를 사용하게 된다고 한다*/, 
    useUnifiedTopology: true
};
//const createConnection = mongoose.createConnection(uri, options);
const connect = () => mongoose.connect(uri, options);
connection.on('error', err => console.log('connection error', err));
connection.once('open', () => {
	console.log('Connected to MongoDB', uri);
});
connection.once('disconnected', () => {
	console.log('Disconnected to MongoDB', uri);
});

//exports.createConnection = createConnection;
exports.connect = connect;
