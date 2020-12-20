// 모듈
const path = require('path'); 
const fs = require('fs');
const mkdir = require('mkdirp'); // 폴더생성 모듈 (하위 폴더까지 생성)
//const webpackMerge = require('webpack-merge'); // 여러 웹팩 설정값 결합 - webpackMerge({설정1}, {설정2}, ...) - (4.x 와 5.x 이상 버전 사용방법 차이 있음)
const { merge } = require('webpack-merge');
const paths = require(path.resolve(__dirname, './config/paths'));
const env = require(path.resolve(__dirname, './config/env'));
const manifestWrite = require(path.resolve(__dirname, './config/manifest-write'));

// webpack plugin 
//const ManifestPlugin = require('webpack-manifest-plugin'); // 빌드 결과 json 생성 - (2.x 와 3.x 이상 버전 사용방법 차이 있음)
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin'); // 순환 종속(import) 의존성 감지 (http://sudheerjonna.com/blog/2019/01/27/how-to-detect-and-avoid-cyclic-dependencies-in-javascript/)
//const CopyPlugin = require('copy-webpack-plugin'); // 개별 파일 또는 전체 디렉토리를 빌드 디렉토리에 복사
//const WebpackAssetsManifest = require('webpack-assets-manifest'); // 빌드 결과 json 생성 

// webpack config (웹팩설정 정보)
const configBase = require(path.resolve(__dirname, './config/webpack.base.js')); // 공통설정 (기본 프로젝트)
const configProduction = require(path.resolve(__dirname, './config/webpack.production.js')); // 웹팩 배포용 설정 
const configDevelopment = require(path.resolve(__dirname, './config/webpack.development.js')); // 웹팩 개발모드 설정 

/*
-
빌드결과 정보를 JSON 파일로 생성해 주는 것이 중요하다.
빌드파일명이 날짜시간, 빌드번호 등을 사용하여 캐시를 회피하는데, Java 또는 nodeJS 에서 해당 리소스를 태그 src 에 주입하기 위해서는
빌드결과 정보가 기록된 JSON 파일을 읽어서 HTML 에 해당하는 태그(<script>, <link> 등)로 들어가기 때문이다.

JSON (매니페스트) 파일에 리소스의 URL 정보까지 함께 넣어주는 것이 좋겠다.
그럼 Java 등에서 JSON 정보를 읽어 그대로 세팅만 해주면 되기 때문이다.
예를 들어, 
JSON 파일내부 "home": {"JS": ["//makestory.net/js/home.123.1.js", "//makestory.net/js/home.123.2.js"], "CSS": [...]}
JSP 또는 nodeJS 에서 entry 에 해당하는 "home" 를 해당 태그를 만들어 그대로 주입하면 된다.

로컬에서도 JSP 페이지에 스크립트를 주입하고 싶다면!
빌드정보(매니페스트 JSON 파일)가 들어있는 JSON 파일만 열어서 수정해주면 된다.

-
매니페스트란?
manifest.mf(jar) : jar 압축시 패키지 관련 정보 및 파일 확장 관련 정보를 저장 (META-INF/MANIFEST.MF)
AndroidManifest.xml : 안드로이드 어플리케이션에 대한 기본적인 정보를 저장

-
https://d2.naver.com/helloworld/7975004
내부 런타임 모듈 처리 변화
런타임 코드 대부분이 '런타임 모듈(runtime module)'이라 명명된 곳으로 이동된다. 기존에는 런타임 코드가 별도의 chunk로 분리될 수 있지만 항상 런타임 chunk에 포함되었기 때문에 번들 파일의 용량이 증가됐다.
'런타임 요건(Runtime Requirements)'은 어떤 런타임 모듈이 번들에 포함될 것인지를 제어해 실제 사용되는 코드만 번들에 포함되게 한다. 또한 미래에는 온디맨드 chunk 로딩 기법을 통해 필요한 시점에 런타임이 로딩되게 할 것이다.
코어 런타임은 매우 작은 크기로 유지되며 __webpack_require__ 함수와 모듈 팩토리, 모듈 인스턴스 캐시만을 포함하게 된다. 또한 번들을 즉시 실행 함수(IIFE, immediately invoked function expression) 형태로 감싸던 것을 대체하는 런타임 코드가 사용된다. ESM(ECMAScript Module) 형태로 내보내거나 ESM을 대상으로 지정하는 기능도 지원될 것이다.
*/

// 경로
const PATHS = {
	// 공통경로
	PUBLIC: `${env.active}/${env.build}/webpack/`,
};

// 개발서버 관련 설정 
let setDevelopment = (config={}) => {
	if(config.mode !== 'development') {
		return config;
	}
	if(!config.devServer || typeof config.devServer !== 'object') {
		config.devServer = {};
	}
	if(env.active === env.phase.local) {
		config.devServer.open = true;
	}else {
		config.devServer.open = false;
	}
	return config;
};

// 개발환경에 따른 output 변경 
let setOutput = (config={}) => {
	// config.output 값 변경 
	switch(env.active) {
		case env.phase.local:
		case env.phase.test: // dev / qa
		case env.phase.stage:
		case env.phase.production:
		/*case 'prd':
		case 'stg':
		case 'qa':
		case 'dev':*/
			// 빌드 결과 파일위치 지정 
			config.output.path = paths.appWebpackOutput;
			if(/*env.active !== env.phase.local*/config.mode !== 'development') {
				// 필드파일명 앞에 공통으로 붙이는 경로
				//config.output.publicPath = PATHS.PUBLIC;
			}
			//config.output.filename = `[name]/[name]./${getDatetime()}.js`;
			break;
	}
	console.log('[webpack] output', config.output && config.output.path || '');
	return config;
};

// 필수 플러그인 관련 설정 
let setPlugins = (config={}) => {
	//config = webpackMerge(config, {
	config = merge(config, {
		plugins: [
			// 순환 improt 검사
			// 순환 종속성에 대한 일반적인 수정은 다른 모듈에 필요한 변수를 내 보낸 후 파일 끝에 가져 오기를 두는 것
			/*
			// A.js
			module.exports = { foo: 'bar' };
			require('B'); // at this point A.exports is not empty anymore
			// B.js
			var A = require('A');
			A.foo === 'bar';
			*/
			new CircularDependencyPlugin({
				// exclude detection of files based on a RegExp
				//exclude: /\.js|node_modules/,
				// include specific files based on a RegExp
				//include: /dir/,
				// add errors to webpack instead of warnings
				//failOnError: true,
				// allow import cycles that include an asyncronous import,
				// e.g. via import(/* webpackMode: "weak" */ './file.js')
				//allowAsyncCycles: false,
				// set the current working directory for displaying module paths
				//cwd: process.cwd(),
			}),
			
			// 빌드 결과 정보가 들어있는 json 생성
			/*new WebpackAssetsManifest({
				//publicPath: '',
				merge: true, // true/false/customize
				// entrypoints 매니페스트 파일에 포함 
				entrypoints: true,
				// 설정이 완료된 후 실행할 콜백
				apply: function(manifest) {
					// console.log('apply');
					// console.log('arguments', arguments);
				},
				// 매니페스트의 각 항목을 사용자 정의하기위한 콜백
				customize: function(entry, original, manifest, asset) {
					// console.log('customize');
					// console.log('arguments', arguments);
				},
				// 전체 매니페스트를 변환하기위한 콜백
				transform: function(assets, manifest) {
					// console.log('transform');
					// console.log('arguments', arguments);
					let date = new Date();
					return {
						tool: 'webpack',
						time: [
							[date.getFullYear(), Number(date.getMonth())+1, date.getDate()].join('.'), // 년.월.일
							[date.getHours(), date.getMinutes(), date.getSeconds()].join(':'), // 시:분:초
							date.getMilliseconds() // 밀리초
						].join(' '),
						entrypoints: assets.entrypoints,
					};
				},
				// json replacer
				replacer: function(key, value) {
					// console.log('replacer');
					// console.log('arguments', arguments);
					if(key === 'entrypoints') {

					}
					return value;
				},
				// 컴파일이 완료되고 매니페스트가 작성된 후 실행할 콜백
				done: function(manifest, stats) {
					// console.log('done');
					// console.log('arguments', arguments);
				},
				// options: function(options) {
				// 	// console.log('options');
				// },
				// afterOptions: function(options) {
				// 	// console.log('afterOptions');
				// },
			}),*/
			//new ManifestPlugin({
			new WebpackManifestPlugin({
				// 파일명 - manifest.json
				//fileName: `${env.active}.${env.build}.json`, 
				// 경로의 기본 경로 (기본값: output.publicPath)
				//publicPath: '',
				// 경로에 추가되는 경로
				//basePath: '/', 
				// 정보 추가
				/*seed: { 
					'active': env.active,
					'build': env.build,
				},*/
				// 필터 
				filter: function(FileDescriptor) {
					//console.log('filter');
					//console.log('FileDescriptor', FileDescriptor);
					//FileDescriptor { path: string, name: string | null, isInitial: boolean, isChunk: boolean, chunk?: Chunk, isAsset: boolean, isModuleAsset: boolean }
					//return FileDescriptor; // 기본 출력 

					if(FileDescriptor.isInitial && !FileDescriptor.name.endsWith('.map')) {
						return FileDescriptor;
					}
				},
				// 매니페스트를 만들기전 세부 사항 수정 
				map: function(FileDescriptor) { 
					//console.log('map');
					//console.log('FileDescriptor', FileDescriptor);
					//FileDescriptor { path: string, name: string | null, isInitial: boolean, isChunk: boolean, chunk?: Chunk, isAsset: boolean, isModuleAsset: boolean }
					//return FileDescriptor; // 기본 출력 
					return FileDescriptor;
				},
				// 매니페스트를 구조 변경
				// entry 단위
				generate: function(seed, files, entrypoints) {
					//console.log('generate');
					//console.log('seed', seed); // seed: {} 추가된 정보 
					//console.log('files', files); // [{path: 'page1/page1.2020111-232650.js', chunk: Chunk, name: '', ...}, {...}, ...]
					//console.log('entrypoints', entrypoints); // {page1: ['...', ...], page2: ...}

					// filter - 매니페스트에 포함될 파일만 분류 
					let manifestFiles = files.reduce((manifest/*콜백의 반환값을 누적*/, file/*현재 요소*/) => {
						// file.path: 'page1/page1.2020111-23516.js'
						// file.name: 'page1.js'
						// file.chunk
						// file.isInitial, file.isChunk, file.isAsset, file.isModuleAsset
						manifest[file.name] = file.path;
						return manifest;
					}, {});

					// 파일 단위, 확장자 단위 별로 분리 
					let entrypointFiles = {};
					let entrypointTypes = {};
					Object.keys(entrypoints).forEach(entry => {
						// entry: page1
						// entrypoints[entry]: [ 'vendors~page1/vendors~page1.2020111-23516.js', 'page1/page1.2020111-23516.js' ]

						// 리소스 타입별로 구분 
						let types = {
							/*'ico': [],
							'json': [],
							'css': [],
							'js': [],*/
						};

						// 필터 (제외할 파일 종류)
						entrypointFiles[entry] = entrypoints[entry].filter(
							fileName => !fileName.endsWith('.map')
						);

						// 확장자 별로 분류 
						entrypointFiles[entry].forEach(file => {
							//console.log('file', file); // react/react.2020118-22463.js
							//console.log('extname', path.extname(file)); // .js
							let extname = path.extname(file).replace('.', '');
							if(!Array.isArray(types[extname])) {
								types[extname] = [];
							}
							types[extname].push(file);
						});
						entrypointTypes[entry] = types;
					});

					// 엔트리 단위 매니페스트 파일 생성 
					manifestWrite.webpack(entrypointTypes);

					//console.log(manifestFiles);
					//console.log(entrypointFiles);
					//console.log(entrypointTypes);

					// serialize 함수로 아래 return 값 파라미터로 전달
					return {
						//time: getDatetime(),
						//seed: seed,
						active: env.active,
						build: env.build,
						path: PATHS.PUBLIC,
						entry: entrypointTypes,
						file: manifestFiles,
					};
				},
				// 만들어진 매니페스트를 수정
				// entry 결과물
				serialize: function(manifest) {
					//console.log('serialize', manifest);
					//return JSON.stringify(manifest, null, 2); // 기본 출력

					// 최종 manifest.json 파일 내부 결과값 
					//console.log('[webpack] manifest', manifest);
					return JSON.stringify(manifest, null, 2); // 매니페스트 파일에 쓰기 
				}
			}),
		]
	});
	return config;
};

// node 설정
process.noDeprecation = true; // 콘설에 다음과 같은 형태의 경고 'parseQuery() will be replaced with getOptions() in the next major version of loader-utils.' 로더 개발자를 위한 로그 숨김처리 

// 웹팩4 에서는 webpack 코어와 webpack-cli 가 분리 배포 (각각 설치해야 한다)
// 웹팩4 에서는 모드가 생겨 일정한 규칙만 지키면 설정 파일이 없이도 빌드가 가능 (Production, Development 모드)
// 웹팩4(실험적인 수준) 에서는 WebAssembly 파일(wasm)을 직접 import해서 사용

// 커맨드라인 (cli)
// https://webpack.js.org/api/cli
// 공통 옵션: --config example.config.js, --json > stats.json 등
// 환경 옵션: --env.production, --env.platform=web 등
// 구성 옵션
// 출력 옵션
// 디버그 옵션
// 모듈 옵션
// 감시 옵션
// resolve 옵션
// 통계 옵션
// 고급 옵션
module.exports = (environment, argv) => {
	let mode;
	let project;
	let config = {};

	console.log('---------- ---------- webpack config start ---------- ----------');
	/*
	첫 번째 인자는 커맨드라인에서 전달해주는 --env 옵션들이 객체 형태로 전달 된다. 
	webpack.EnvironmentPlugin 나 webpack.DefinePlugin 를 이용하면 구현 코드에서도 해당 변수들을 전역에서 사용할 수 있게 해준다. 
	웹팩4 버전 이하에서는 --env 옵션을 이용해 어떤 빌드인지 구분했지만, 이제는 그럴 필요가 없어졌다. 
	두 번째 인자에는 커맨드라인에서 전달되는 모든 옵션이 객체 형태로 전달 된다. 
	*/
	// webpack cli
	//console.log('[webpack] webpack environment-variables', environment); // cli 환경옵션, https://webpack.js.org/api/cli/#environment-options, https://webpack.js.org/guides/environment-variables/
	//console.log('[webpack] webpack argv', argv); // cli 그 밖의 옵션, https://webpack.js.org/api/cli/#config-options
	env.buildConsoleLog();

	// argv
	// --multiple
	argv = argv && typeof argv === 'object' ? argv : {};
	mode = argv.mode || 'production';
	project = env.project || argv.project;

	// 웹팩 기본 설정 mode: 'none' | 'development' | 'production'
	console.log('[webpack] mode', mode);
	switch(mode) {
		case 'none':
			
			break;
		case 'development':
			//config = webpackMerge(configBase, configDevelopment); 
			config = merge(configBase, configDevelopment); 
			//config = Object.assign({}, configBase, configDevelopment); // 배열의 경우 merge 가 아닌, assign 마지막 파라미터 값으로 덮어쓰는(기존값 지우고 마지막 값 적용) 형태
			break;
		case 'production':
			//config = webpackMerge(configBase, configProduction);
			config = merge(configBase, configProduction); 
			//config = Object.assign({}, configBase, configProduction);
			break;
	}

	// 프로젝트별 웹팩 설정 변경 (프로젝트별로 웹팩 설정이 필요할 때)
	/*console.log('[webpack] project', project);
	switch(project) {
		case 'react':
			config = Object.assign({}, config, configReact);
			break;
		case 'typescript':
			config = Object.assign({}, config, configTypeScript);
			break;
		case 'vue':
			config = webpackMerge(config, configVue);
			config = merge(config, configVue);
			break;
		case 'ec':
			// 웹팩 여러개 실행 
			// (주의! output.filename [hash] 등이 설정된 경우, 각 output 별로 파일명이 다르다.)
			// Exporting multiple configurations 
			// https://webpack.js.org/configuration/configuration-types/#exporting-multiple-configurations
			//config = [Object.assign({}, config), configEC];
			//config = configEC;
			break;
	}*/

	// config 설정 강제변경/주입(공통설정) - output 경로 등
	config = (Array.isArray(config) ? config/*웹팩 설정을 여러개 실행할 경우*/ : [config]).map((config, index, array) => {
		config = setDevelopment(config);
		config = setOutput(config);
		config = setPlugins(config);
		return config;
	});

	//console.log('config', config);
	console.log('---------- ---------- webpack config end ---------- ----------');
	return config;
};