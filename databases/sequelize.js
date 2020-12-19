/*
-
sequelize (https://sequelize.org/)
sequelize 는 Node.js MySQL ORM(Object-Relational Mapping) 도구
ORM 은 객체와 관계형 데이터베이스의 관계를 매핑 해주는 도구
*/
const path = require('path'); 
const Sequelize = require('sequelize');

const model = require(path.resolve(__dirname, '../models/test'));
 
const sequelize = new Sequelize('DB Name', 'User', 'Password', {
	host: 'localhost',
	dialect: 'mysql',
	define: {
		timestamps: false
	}
});
const models = model(Sequelize, sequelize);
 
module.exports = {
	Sequelize,
	sequelize,
	models,
};