// 모듈
const path = require('path'); 
const fs = require('fs');
//const glob = require("glob"); // /**/*.js 형태 사용

const paths = require('./paths');
const env = require(path.resolve(paths.appPath, 'config/env'));

// 웹팩 설정 
module.exports = {
	// webpack mode: 'none' | 'development' | 'production'
	mode: 'production',
};