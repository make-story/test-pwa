// 모듈
const path = require('path'); 
const fs = require('fs');
const mkdir = require('mkdirp'); // 폴더생성 모듈 (하위 폴더까지 생성)

const paths = require('./paths');
const env = require(path.resolve(paths.appPath, 'config/env'));

// 경로 
const PATHS = {
	MANIFEST: path.resolve(__dirname, `../dist/${env.active}/${env.build}/manifest`),
};

// 공통 정보
const SEED = {
	// 개발환경/빌드정보 
	'active': env.active,
	'build': env.build,
	'path': '',
	// 프론트리소스 정보 
	// ico, json, css, js 등 파일 
};

// webpack entry 별 빌드결과 정보 설정 
let setWebpackDistributionManifest = (manifest={}, options={}) => {
	let {dir, seed} = Object.assign({'dir': PATHS.MANIFEST, 'seed': {}}, options); // 파라미터값 

	// 공통적인 구조로 맞춤 
	seed = Object.assign(SEED, {'path': `${env.active}/${env.build}/webpack/`}, seed);

	// 엔트리 포인트 별로 파일을 생성
	Object.keys(manifest).forEach(entry => {
		// 빌드 경로 (폴더)
		let filepath = `${dir}/${entry}.json`;
		let data = {}; // 기존 저장된 파일 내용 

		// 폴더 존재여부 확인
		if(!fs.existsSync(dir)) {
			// 하위 폴더까지 모두 생성 
			mkdir.sync(dir);
		}/*else if(fs.existsSync(filepath)) {
			// 해당 파일이 존재하면, gulp는 기존 정보에 추가/수정을 한다.
			data = fs.readFileSync(filepath);
			if(data) {
				seed = Object.assign({}, JSON.parse(data), seed);
			}
		}*/

		// entry 별 JSON (빌드정보) 파일 생성 
		fs.writeFileSync(
			filepath, 
			JSON.stringify(Object.assign({}, seed, manifest[entry])/*믹스인*/, null, 2), 
			function(error) { 
			
			}
		);
	});

	console.log('[manifest-write] manifest', manifest);
};

// gulp dist 별 빌드결과 정보 설정 
let setGulpDistributionManifest = (manifest={}, options={}) => {
	let {dir, seed, type} = Object.assign({'dir': PATHS.MANIFEST, 'seed': {}, 'type': ''}, options); // 파라미터값 

	// 공통적인 구조로 맞춤
	seed = Object.assign(SEED, {'path': `${env.active}/${env.build}/gulp/`}, seed);

	// 엔트리 포인트 별로 파일을 생성
	Object.keys(manifest).forEach(entry => {
		// 빌드 경로 (폴더)
		let filepath = `${dir}/${entry}.json`;
		let data = {}; // 기존 저장된 파일 내용 
		
		//
		if(!type) {
			type = entry;
		}

		// 폴더 존재여부 확인
		if(!fs.existsSync(dir)) {
			// 하위 폴더까지 모두 생성 
			mkdir.sync(dir);
		}else if(fs.existsSync(filepath)) {
			// 해당 파일이 존재하면, gulp는 기존 정보에 추가/수정을 한다.
			data = fs.readFileSync(filepath);
			if(data) {
				seed = Object.assign({}, JSON.parse(data), seed);
			}
		}

		// entry 별 JSON (빌드정보) 파일 생성 
		fs.writeFileSync(
			filepath, 
			JSON.stringify(Object.assign({}, seed, {[type]: manifest[entry]})/*믹스인*/, null, 2), 
			function(error) { 
			
			}
		);
	});
};

module.exports = {
    webpack: setWebpackDistributionManifest,
    gulp: setGulpDistributionManifest,
};