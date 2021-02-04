//require('dotenv').config(); // 환경변수들을 파일(.env)에 넣고 사용할 수 있게 하는 개발도구

/*
process.env
process.argv
*/

// 빌드 공통 정보 
const PHASE_LOCAL = 'local'; // 개발환경: 로컬
const PHASE_TEST = 'test'; // 개발환경: QA(test)
const PHASE_STAGE = 'stage'; // 개발환경: STG
const PHASE_PRODUCTION = 'production'; // 개발환경: PRD

const PROJECT = process.env.PROJECT || ''; // react 등 프로젝트 지정 빌드 
const ACTIVE = [PHASE_LOCAL, PHASE_TEST, PHASE_STAGE, PHASE_PRODUCTION].includes(process.env.ACTIVE) && process.env.ACTIVE || PHASE_LOCAL; // PHASE(회사에서의 변수), local/test/stage/production spring.profiles.active(스프링 환경에서 사용하는 변수, -Dspring.profiles.active=local)
const BUILD = process.env.BUILD_NUMBER || 'build'; // 젠킨스 빌드 번호 
const PORT = (() => {
	return {
		[PHASE_LOCAL]: 3001,
		[PHASE_TEST]: 3002,
		[PHASE_STAGE]: 3003,
		[PHASE_PRODUCTION]: 3000,
	}[ACTIVE];
})();

// window.location.host: 포트포함, window.location.hostname: 포트제외
const PUBLIC_URL = process.env.PUBLIC_URL || 'http://127.0.0.1';
const SOCKET_PORT = process.env.SOCKET_PORT || 9010;
const SOCKET_URL = process.env.SOCKET_URL || `ws://127.0.0.1:${SOCKET_PORT}`;
const MONGODB_PORT = process.env.MONGODB_PORT || 27017;
const MONGODB_HOST = process.env.MONGODB_HOST || `127.0.0.1:${MONGODB_PORT}`; // 'mongodb://localhost' 로 연결이 안될 때가 있음 - 도커를 사용할 경우 해당 컨테이너명 설정
const MONGODB_DB = process.env.MONGODB_DB || 'webpush';
const PUSH_PORT = process.env.PUSH_PORT || 9020;

// 쉘 명령에서 '--옵션값' 존재여부
// $ node <실행 파일> --옵션키
const isArgv = (argv) => process.argv.indexOf(`--${argv}`) >= 0;
// 쉘 명령에서 '--옵션키'의 '옵션값' 반환
// $ node <실행 파일> --옵션키 옵션값
const getArgv = (argv) => {
	let value = null;
	if(process.argv.includes(`--${argv}`) && process.argv[process.argv.indexOf(`--${argv}`)+1]) {
		value = process.argv[process.argv.indexOf(`--${argv}`)+1];
	}
	return value;
};

// process env 콜솔 로그 출력 
const setBuildConsoleLog = () => {
	// 시스템 환경변수 
	//console.log('[env] process.env', process.env); 
	/*process.argv.forEach(function(val, index, array) {
		console.log(`[env] ${index} : ${val}`);
	});*/
	console.log('[env] USER', process.env.USER); // 예: 'jenkins'
	console.log('[env] HOME', process.env.HOME); // 예: '/Users/ysm0203'
	console.log('[env] PWD', process.env.PWD); // 예: '/usr/src/nodejs/build.git'
	console.log('[env] NODE', process.env.NODE); // 예: '/usr/local/bin/node'
	//console.log('[env] NODE_PATH', process.env.NODE_PATH);

	// npm 관련 정보 
	console.log('[env] npm_node_execpath', process.env.npm_node_execpath); // 예: '/usr/local/bin/node'
	console.log('[env] npm_config_node_version', process.env.npm_config_node_version); // 예: '10.9.0'
	console.log('[env] npm_config_registry', process.env.npm_config_registry); // 예: 'https://repo.cjoshopping.com/content/groups/npm_public_repository/'
	//console.log('[env] npm_config_globalconfig', process.env.npm_config_globalconfig); // 예: '/usr/local/etc/npmrc'
	//console.log('[env] npm_config_node_gyp', process.env.npm_config_node_gyp); // 예: '/usr/local/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js'

	// Git 관련 환경변수
	process.env.GIT_BRANCH && console.log('[env] GIT_BRANCH', process.env.GIT_BRANCH); // 예: 'origin/master'
	process.env.GIT_COMMIT && console.log('[env] GIT_COMMIT', process.env.GIT_COMMIT); // 예: '33bed416e079de15ca729ef4a543bb7495343f45'

	// 젠킨스 관련 환경변수
	process.env.WORKSPACE && console.log('[env] WORKSPACE', process.env.WORKSPACE); // 예: '/var/lib/jenkins/workspace/front display build'
	process.env.JOB_NAME && console.log('[env] JOB_NAME', process.env.JOB_NAME); // 예: 'front display build'
	process.env.BUILD_TAG && console.log('[env] BUILD_TAG', process.env.BUILD_TAG); // 예: 'jenkins-front display build-9'
	process.env.BUILD_DISPLAY_NAME && console.log('[env] BUILD_DISPLAY_NAME', process.env.BUILD_DISPLAY_NAME); // 예: '#9'
	process.env.BUILD_NUMBER && console.log('[env] BUILD_NUMBER', process.env.BUILD_NUMBER); // 예: '9'
	//process.env.BUILD_ID && console.log('[env] BUILD_ID', process.env.BUILD_ID); // 예: '9' - 젠킨스에서 사용하는 고유값 

	// 젠킨스에서 수동(관리자가 설정)으로 추가한 환경변수 
	process.env.PROJECT && console.log('[env] PROJECT', process.env.PROJECT); // react 등 별도 프로젝트 빌드 
	process.env.ACTIVE && console.log('[env] ACTIVE', process.env.ACTIVE); // 사용자 설정값, 개발환경(dev/qa/stg/prd), 웹팩의 모드(development/production)가 아닌 개발환경
};

module.exports = {
	phase: {
		local: PHASE_LOCAL,
		test: PHASE_TEST,
		stage: PHASE_STAGE,
		production: PHASE_PRODUCTION,
	},
    project: PROJECT,
    active: ACTIVE,
	build: BUILD,
	port: PORT,
	publicUrl: PUBLIC_URL,
	socketPort: SOCKET_PORT,
	socketUrl: SOCKET_URL,
	mongoPort: MONGODB_PORT,
	mongoHost: MONGODB_HOST,
	mongoDB: MONGODB_DB,
	pushPort: PUSH_PORT,
	isArgv,
	argv: getArgv,
    buildConsoleLog: setBuildConsoleLog,
};