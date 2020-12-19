const path = require('path'); 
const fs = require('fs');

const paths = require('./paths');
const env = require(path.resolve(paths.appPath, 'config/env'));

// 경로 
const PATHS = {
	MANIFEST: path.resolve(__dirname, `../dist/${env.active}/${env.build}/manifest`),
};

// front 리소스 정보 불러오기 
module.exports = ({active=env.active/*개발환경(local/test/stage/prodction)*/, build=env.build/*빌드번호*/, name=""/*webpack entry 또는 gulp 빌드 key*/}={}) => {
	let filepath = "";
	let data = null;
	
	// 개발환경 구분
	switch(active) {
		case env.phase.local:
		case env.phase.test: // dev / qa
		case env.phase.stage:
		case env.phase.production:
			// 파일 지정	
			//filepath = path.resolve(__dirname, `../dist/${active}/${build}/manifest/${name}.json`);	
			filepath = path.join(PATHS.MANIFEST, `/${name}.json`);	
			// 전체 
			//filepath = path.resolve(__dirname, `../dist/${active}/${build}/webpack/manifest.json`);
			if(fs.existsSync(filepath)) {
				data = fs.readFileSync(filepath);
			}
			if(data) {
				data = JSON.parse(data);
			}
			if(!data || typeof data !== 'object') {
				data = {};
			}
			//data.manifestFilePath = filepath;
			break;
	}

	console.log('[manifest-read] filepath', filepath);
	console.log('[manifest-read] data', data);
	return data;
};