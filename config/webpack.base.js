/*
기본적인 module loader를 처리하는 rules 등이나 plugin 등은 base.js에서 처리하고, 
development.js에서는 개발에서만 사용하는 부분들을, 
production.js 에서는 배포용에서 사용하는 옵션들을 설정

-
모듈화
ES2015의 import
CommonJS의 require()
AMD의 define, require

-
순환 의존성 주의! (A.js 에서 B.js import, 그리고 B.js 에서 A.js import)
https://blog.outsider.ne.kr/1283
순환 종속(import) 의존성 감지 웹팩 플러그인 (https://www.npmjs.com/package/circular-dependency-plugin)

-
트리 쉐이킹
트리 쉐이킹(Tree Shaking)은 일명 죽은 코드라고 불리는 것을 제거하기 위한 자바스크립트 에서 사용되는 용어로써 Rollup에 의해 알려졌다.
웹팩 4+ 에서는 package.json의 sideEffects라는 속성으로 컴파일러에게 힌트를 제공할 수 있게 되었다.
*/

// 모듈
const path = require('path'); 
const fs = require('fs');
const webpack = require('webpack');
//const glob = require("glob"); // /**/*.js 형태 사용

const paths = require('./paths');
const env = require(path.resolve(paths.appPath, 'config/env'));

// webpack plugin 
const CleanWebpackPlugin = require('clean-webpack-plugin'); // 폴더 내부 파일 비우기
const TerserPlugin = require('terser-webpack-plugin'); // 자바스크립트 코드 압축  (웹팩4+ production 모드는 terser-webpack-plugin를 기본 minimizer로 사용)
//const DirectoryNamedWebpackPlugin = require("directory-named-webpack-plugin"); // 웹팩 4 전용
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // 웹팩4 부터는 extract-text-webpack-plugin 을 CSS에 사용해서는 안됩니다. 대신 mini-css-extract-plugin을 사용
//const NpmInstallPlugin = require('npm-install-webpack-plugin'); // 개발 중 누락 된 종속성 자동 설치
//const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

// 날짜
let getDatetime = () => {
	let date = new Date();
	return [
		[date.getFullYear(), Number(date.getMonth())+1, date.getDate()].join(''), // 년월일
		[date.getHours(), date.getMinutes(), date.getSeconds()].join(''), // 시분초
	].join('-');
};

// style files regexes
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

// 웹팩 설정 
module.exports = {
	// webpack mode: 'none' | 'development' | 'production'
	//mode: 'production',

	// devtool
	devtool: 'inline-source-map',

	// entry, 로더를 해석하기 위한 기본 경로인 절대 경로
	// [중요!] context 경로에 따라, entry, resolve.modules 경로 기준이 된다.
	context: paths.appPath,
	//context: __dirname,
	//context: path.resolve(__dirname, '../'),
	//context: process.env.PWD,
	//context: '/Users/ysm0203/Development/node/test-cj/ec-static-common/src/js/',

	// 웹팩이 파일을 읽어들이기 시작하는 부분
	// 서로간 의존성이 없는 여러개의 파일을 사용하고 싶다면 Array 형식으로 사용 
	// 여러 entry 를 사용(여러 페이지)한다면 Object 
	entry: {
		// IE 환경에서 최신 자바스크립트를 사용해 개발하고 싶다면 두 폴리필을 npm에서 다운 받은 후 저렇게 모든 엔트리에 넣어주셔야 합니다. ('@babel/polyfill', 'eventsource-polyfill')
		//'test': ['@babel/polyfill', 'eventsource-polyfill', 'src/javascript/entry.js'],
		//'module2': 'src/javascript/module2.js',
		//'circular': 'src/javascript/index.js', // 순환 종속 테스트 
		'index': 'src/javascript/index.js',
	},

	// 경로나 확장자를 처리할 수 있게 도와주는 옵션
	// 모듈로딩 관련 옵션 설정, 모듈 해석방식 정의 (alias등)
	resolve: {
		// 모듈 탐색을 시작할 경로 지정, require 나 import 했을 때 시작 경로 (default: 'node_modules/')
		// context 경로 기준으로 경로 설정
		modules: [
			// 'node_modules' 경로 필수
			// 참고: path.resolve 상대경로를 절대경로로 변경
			path.resolve(paths.appPath, 'node_modules'),
			path.resolve(paths.appPath, 'src'),
			path.resolve(paths.appPath, '.'),
			//path.resolve(__dirname, 'node_modules'), 
			//path.resolve(__dirname, 'src'),
			//path.resolve(__dirname, '.'),
		],

		// 탐색할 모듈의 확장자를 지정  
		// 종속 파일 검색할 때 - import * from './index'; 확장자 검색 항목 
		extensions: ['.mjs', '.js', '.json', '.jsx', '.ts', '.tsx', '.vue'],

		// alias
		// key 가 모듈이름이 되는 객체를 만듭니다. value 는 모듈 경로입니다. (정규식)
		// ProvidePlugin 연동
		alias: {
			//jquery: "common/cjos/lib/m/jquery.js" // define(['jquery'], ...) 대응 (/node_modules/ 내부 jquery 가 설치되지 않았을 경우, 경로지정)
			//'components': path.resolve(__dirname, '..', 'src', 'components'),
      		//'containers': path.resolve(__dirname, '..', 'src', 'containers'),
      		//'assets': path.resolve(__dirname, '..', 'src', 'assets'),
		},

		// 활성화되면 심볼릭 링크 된 리소스는 심볼릭 링크 된 위치가 아닌 실제 경로 로 확인
		symlinks: false,

		//
		plugins: [
			/*new DirectoryNamedWebpackPlugin({
				exclude: /node_modules/,
				include: [
					path.resolve(__dirname, '../ec-static-common/src/js/'),
					path.resolve(__dirname, '../ec-static-component/src/js/'),
					path.resolve(__dirname, '../ec-display-cjmall-frontweb/src/js/')
				]
			}),*/
			/*new TsconfigPathsPlugin({ 
				configFile: path.resolve(paths.appPath, 'tsconfig.json') 
			}),*/
		],
	},

	// 모듈처리 방법 (로더 등)
	// 로더는 웹팩 번들링되는 중간 과정에 개입 (로더는 파일을 해석하고 변환하는 과정에 관여, 모듈을 처리하는 단위)
	module: {
		//noParse: /jquery|lodash/,

		// 누락 된 내보내기를 경고 대신 오류
		strictExportPresence: true, 

		// rules나 use 대신 loaders를 쓰고, options 대신 query를 쓰면, 웹팩1
		/*loaders: [
			{
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: /node_modules/,
				query: {
					cacheDirectory: true,
					presets: ['es2015']
				}
			}
		]*/
		// 웹팩2 이상 
		rules: [
			// 템플릿 관련 
			{
				test: /\.ejs$/,
				exclude: /node_modules/, // 제외
				use: {
					loader: "ejs-loader", // npm install --save ejs-loader ejs-webpack-loader
					options: {
						//variable: 'data',
						//interpolate : '\\{\\{(.+?)\\}\\}',
						//evaluate : '\\[\\[(.+?)\\]\\]'
					}
				}
			},
			// 자바스크립트 관련 (트랜스파일러 등)
			{
				test: /\.js?$/,
				//test: /\.(js|mjs|jsx|ts|tsx)$/,
				//include: path.join(__dirname), // 대상
				exclude: /node_modules/, // 제외
				use: {
					// .babelrc 있다면 해당 파일을 먼저 참조 하며, 없을 경우 webpack options 에 부여한 presets plugins 을 참조
					loader: 'babel-loader',  // npm install --save-dev babel-loader @babel/core @babel/preset-env 
					options: {
						// presets
						// @babel/preset-env를 설정하여, babel에서 미리 정의해둔 환경으로 ES6에서 ES5로 변환
						// @babel/preset-env은 함께 사용되어야 하는 Babel 플러그인을 모아 둔 것으로 Babel 프리셋이라고 부른다. 
						// Babel이 제공하는 공식 Babel 프리셋(Official Preset) : @babel/preset-env, @babel/preset-flow, @babel/preset-react, @babel/preset-typescript
						// @babel/preset-env도 공식 프리셋의 하나이며 필요한 플러그인 들을 프로젝트 지원 환경에 맞춰서 동적으로 결정해 준다.
						//presets: ['@babel/preset-env'] 
						presets: [
							//"@babel/preset-typescript",
							[
								"@babel/preset-env", 
								{
									// async / await 사용때문에 크롬버전 지정
									"targets": {"chrome": "55"}, // chrome 55 이상으로 지정 
									"debug": true
								},
							],
						],
						// plugins 
						plugins: [
							'@babel/plugin-syntax-dynamic-import', // 다이나믹 import (System.import 는 더이상 사용되지 않습니다.) - import 방식이 require.ensure보다 더 좋습니다. (import 방식은 catch 를 활용해 에러가 났을 때 대처)
							'@babel/plugin-proposal-class-properties', // class property 관련된 문제를 해결
							'@babel/plugin-proposal-object-rest-spread' // … 변수 spread 과 관련된 문제
						], 
					}
				}
			},
			// Typescript
			// https://github.com/TypeStrong/ts-loader
			/*{
				test: /\.(ts|tsx)$/, // TypeScript 를 사용 할때는 .ts (리액트 컴포넌트의 경우에는 .tsx) 확장자를 사용
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							transpileOnly: true
						}
					},
				],
			},*/
			// Vue
			// https://vue-loader.vuejs.org/
			/*{
				test: /\.vue$/,
				exclude: /node_modules/,
				use: {
					loader: 'vue-loader',
				},
			},*/
			// Svelte
			/*{
				test: /\.(html|svelte)$/,
				exclude: /node_modules/,
				use: {
					loader: 'svelte-loader',
					options: {
						preprocess: require('svelte-preprocess')({  // npm install -D svelte-preprocess
							// options
						})
					},
				},
			},*/
			// 스타일 관련 
			{
				test: /\.scss$/, // npm install --save--dev node-sass style-loader css-loader sass-loader
				//include: path.join(__dirname),
				exclude: /node_modules/,
				use: [
					// 배열의 마지막 로더부터 실행된다.
					//"style-loader", // Creates `style` nodes from JS strings
					//(process.env.NODE_ENV || process.env.ACTIVE) !== 'production' ? 'style-loader' : MiniCssExtractPlugin.loader, // MiniCssExtractPlugin
					MiniCssExtractPlugin.loader,
					"css-loader", // Translates CSS into CommonJS
					{
						loader: "sass-loader", // Compiles Sass to CSS
						/*sourceMap: true,
            			sassOptions: {
							outputStyle: 'compressed',
						},*/
					}
				]
			},
			// CSS 관련 로더
			{
				test: /\.css$/,
				include: /\.module\.css$/, // CSS 모듈 전용 - 파일명.module.css 규칙 파일
				use: [
					// 배열의 마지막 로더부터 실행된다.
					'style-loader',
					//'vue-style-loader',
					{
						loader: 'css-loader',
						options: {
							importLoaders: 1,
							modules: true
						}
					}
				],
			},
			// CSS 외부 파일로 생성 - CSS 위 로더 실행 후 실행
			{
				test: /\.css$/,
				exclude: /\.module\.css$/, // 제외할 폴더나 파일
				use: [
					// 배열의 마지막 로더부터 실행된다.
					MiniCssExtractPlugin.loader,
					{
						loader: 'css-loader',
						/*options: {
							modules: true,
							localIdentName: "[name]__[local]"
						},*/
					}
				],
			},
		]
	},

	// 결과
	// 파일이 저장될 경로
	output: {
		//pathinfo: false,

		// path 는 어디에 결과가 저장되는지 에 관한 것 
		path: path.resolve(__dirname, '../dist/webpack/'), 
		
		// 파일들이 위치할 서버 상의 경로 
		// publicPath 는 배포 빌드 할 때 Webpack plugins(ulr-loader,file-loader 같은..), CSS나 HTML파일 안에 URL들을 업데이트 해주기 위한 것(prefix개념) 
		// devServer (개발모드)를 사용할 경우(HtmlWebpackPlugin 함께 사용하는 경우) devServer.contentBase 도 함께 변경해줘야 한다. 
		// 자바스크립트 내부 코드에서 dynamic import 를 사용하는 경우, publicPath 를 활용하여 리소스 url을 지정해 줄 수 있다.
		//publicPath: '/dist/webpack/',
		//publicPath: `/${env.active}/${env.build}/`,
		publicPath: `/${env.active}/${env.build}/webpack/`,

		// [name]은 entry 에 설정된 ‘key’ 이름 - entry name
		// [id] 웹팩 내부적으로 사용하는 모듈 ID - chunk id
		// [hash]는 매번 웹팩 컴파일 시 랜덤한 문자열을 붙여줍니다. 해시 길이 지정가능 - [hash:16]
		// [hash]가 컴파일할 때마다 랜덤 문자열을 붙여준다면, 
		// [chunkhash]는 파일이 달라질 때에만 랜덤 값이 바뀝니다. (이것을 사용하면 변경되지 않은 파일들은 계속 캐싱하고 변경된 파일만 새로 불러올 수 있습니다.)
		//filename: '[name].bundle.js',
		filename: '[name]/[name].[hash].js',
		//filename: `[name]/[name].${getDatetime()}.js`,
		chunkFilename: '[name]/[id].[chunkhash].js',

		// 빌드 결과물을 라이브러리 형태로 외부에서 사용가능하도록 설정 (externals 설정과 연동)
		/*
		-
		libraryTarget 설정값 종류
		"var" - 변수를 설정하여 내보내기 : var Library = xxx (기본)
		"this" - this를 설정하여 내보내기 : this[“Library”] = xxx
		"commonjs" - commonjs 속성을 사용하여 내보내기 : exports[“Library”] = xxx
		"commonjs2" - module.exports를 설정하여 내보내기 : module.exports = xxx
		"amd" - AMD로 내보내기 (옵션으로 설정 - 라이브러리 옵션을 통해 이름 설정)
		"umd" - AMD, CommonJS2로 내보내기 또는 루트의 등록 정보로 내보내기 | Default : “var” output.library가 설정되어 있지 않지만 output.libraryTarget이 var 이외의 값으로 설정된 경우 내보낸 객체의 모든 속성이 복사됩니다. (예외 and, commonjs2 및 umd)
		*/
		//libraryTarget: 'umd',
		//library: 'App',
	},

	// 부가적인 기능
	// 번들링 완료 후 마지막 output 과정에 개입 (번들링된 파일을 처리하는 단위)
	// 웹팩4 에서는 ModuleConcatenationPlugin, UglifyJsPlugin, NoEmitOnErrorsPlugin, NamedModules 플러그인이 모두 사라지고 optimization 속성(속성내부 설정)으로 대치
	// 웹팩3 에서 DedupePlugin (중복 종속 제거) 은 사라졌고, OccurrenceOrderPlugin (청크 [id]를 생성하기 위한 플러그인)은 기본으로 설정되어 있음
	plugins: [
		// output 경로내 폴더 비우기 (Gulp 와 함께 사용할 경우, Gulp 빌드 파일지울 수 있으니 확인필요)
		new CleanWebpackPlugin.CleanWebpackPlugin({
			// 파일 제거 시뮬레이션
			dry: true,
			// 콘솔에 로그 쓰기 
			// (dry가 true 일 때는 항상 활성화 됨) 
			verbose: true,
			// 사용하지 않는 모든 웹팩 자산을 자동으로 제거합니다. (default: true)
			//cleanStaleWebpackAssets: true,
			// 현재 웹팩 자산 제거를 허용하지 않음 (default: true)
			//protectWebpackAssets: true,
		}),

		// 자바스크립트 모듈 사용에 누락된 디펜던시 자동 설치 
		/*new NpmInstallPlugin({
			// Use --save or --save-dev
			dev: false,
			// Install missing peerDependencies
			peerDependencies: true,
			// Reduce amount of console logging
			quiet: false,
			// npm command used inside company, yarn is not supported yet
			npm: 'npm'
		}),*/

		// 개별 파일 또는 전체 디렉토리를 빌드 디렉토리에 복사
		/*new CopyPlugin([
			{ from: 'source', to: 'dest' },
			{ from: 'other', to: 'public' },
		]),*/

		// 번들링한 결과물에서 css파일을 따로 추출
		new MiniCssExtractPlugin({
			// 개발모드 
			//filename: '[name].css',
			//chunkFilename: '[id].css',
			// 운영모드
			filename: '[name]/[name].[hash].css',
			chunkFilename: '[name]/[id].[hash].css',
		}),

		// 라이브러리 로딩 (모든 모듈에 자동으로 설정된 import 구문 삽입)
		// jQuery 를 사용하고 있는 모든 모듈 JS 마다 import $ from 'jquery'; 불러온다면 꽤나 번거로운 일
		// import $ from 'jquery'; 와 같은 구문을 사용하지 않고 라이브러리를 불러오고자 할 경우에는 웹팩에서 제공하는 풀러그인 ProvidePlugin를 사용
		// 즉, 아래 설정한 것을 자동 import 해줌
		// /node_modules/ 기본경로 내부 패키지명 또는 수동으로 모듈 경로 설정(예: common/) 등록 
		/*new webpack.ProvidePlugin({
			"$": "jquery",
			"jQuery": "jquery",
			"window.jQuery": "jquery",
			"Cookies": ["common/cjos/lib/js.cookie"],
			"_": ["common/cjos/lib/underscore"]
		}),*/

		// 모든 자바스크립트 모듈에서 접근이 가능한 전역 변수를 선언
		// DefinePlugin으로 선언한 전역 변수는 어디까지나 웹팩이 소스 코드를 빌드하는 동안에만 사용 - console.log(Define 설정한 변수) 런타임 실행시 에러발생됨
		/*new webpack.DefinePlugin({
			APP_NAME: JSON.stringify('My app'),
			VERSION: JSON.stringify('v0.1')
		}),*/

		// process.env 환경변수 설정 플로그인 (React 등 번들 후 Web에서 접근할 때 사용)
		// 웹팩에서 제공하는 EnvironmentPlugin은 노드 런타임(Node runtime)에서 process.env에 저장되는 환경 변수를 전역 변수로 등록하기 위한 플러그인
		new webpack.EnvironmentPlugin({ ...process.env }),
		/*new webpack.EnvironmentPlugin({
			HEADLESS_CONTROL: 'N', // process.env.HEADLESS_CONTROL 접근 가능  
		}),*/
	],

	// 종속성을 제외하는 방법을 제공 (라이브러리)
	// webpack 에 의해 번들되어서는 안되지만, 대신 번들 결과에 의해 요청된 종속성을 나타냅니다.
	// output.libraryTarget에 의해서 지정된대로 또는 key-value 쌍으로 된 객체 정의를 사용하여 종속성별로 수정
	externals: [
		//WebpackNodeExternals(),
	],

	// 웹팩4 에서 최적화 관련 플러그인들이 모두 optimization 속성으로 통합
	// minimize가 UglifyJsPlugin 을 계승하고, splitChunks 가 CommonsChunkPlugin 을 계승 (mode가 production일 때는 자동으로 이 두 속성이 켜집니다.)
	// concatenateModules 옵션은 ModuleConcatenationPlugin 을 계승
	// 이외에도 BannersPlugin, IgnorePlugin, EnvironmentPlugin, ContextReplacementPlugin 등 기본 제공 플러그인 기본제공 
	optimization: {
		// UglifyJsPlugin (코드를 압축하여 난독화시켜주는 플러그인, UglifyJsPlugin은 es6 이상의 코드를 컴파일하지 못하는 버그)
		// uglify-js가 ES6+를 지원하지 않기 때문에 TerserPlugin 사용 (uglify-js 를 꼭 사용해야 한다면 ES6 를 바벨로 트랜스파일링 후 사용권장)
		minimize: false, 
		minimizer: [new TerserPlugin()], 
		
		//namedChunks: true,
		//moduleIds: 'named',
		//chunkIds: 'named',

		// 벤더(vendor) - 청크간에 겹치는 패키지들을 별도의 파일로 추출
		// CommonsChunkPlugin (entry point가 여러 개 설정되어있는 경우, 공통된 모듈 또는 라이브러리를 별도의 chunk로 분리하여 bundle 작업을 수행할 때 사용할 수 있는 플러그인)
		// 청크(chunk)간에 겹치는 패키지들을 별도의 파일로 추출하여 번들링할 수 있는데 이를 웹팩에서는 vendor 부르고 있음
		// 즉, 자주 사용되어 중복으로 import 된 모듈을 별도의 chunk 파일로 생성하기 위한 설정이다.
		// 웹팩3 에서는 직접 벤더를 지정해야 했으나, 웹팩4 에서는 웹팩이 알아서 벤더를 생성
		splitChunks: { 
			// all : 조건에 포함되는 모든 것을 분리 (동적 또는 비동기적 모듈 모두 최적화)
			// initial : 초기 로딩에 필요한 경우 (동적 번들, 비동기적 모듈은 별도 번들 최적화)
			// async : import() 를 이용해 다이나믹하게 사용되는 경우에 분리 (동적 모듈만 번들 최적화)
			chunks: 'async',

			// 그룹단위 청크 설정
			cacheGroups: {
				"common": {
					test: /[\\/]common[\\/]/
				},
				"component": {
					test: /[\\/]component[\\/]/
				},
			},
		}, 
		//removeEmptyChunks: false,

		/*runtimeChunk: {
			name: 'runtime'
		},*/

		// ModuleConcatenationPlugin (웹팩3 에서 새로 나왔는데 웹팩이 변환하는 자바스크립트 코드를 조금이나마 더 줄여주는 플러그인)
		//concatenateModules: true
	},

	// Some libraries import Node modules but don't use them in the browser.
	// Tell Webpack to provide empty mocks for them so importing them works.
	// Module not found: Error: Can't resolve 'fs' 등과 같은 에러 대응 
	// 서버가 아닌 클라이언트에서 경우, empty 취급 
	// react webpack 파일 또는 react-dev-utils 모듈 참고
	//target: 'web', // default: web
	//target: 'node',
    /*node: {
		module: 'empty',
		dgram: 'empty',
		dns: 'mock',
		fs: 'empty',
		http2: 'empty',
		net: 'empty',
		tls: 'empty',
		child_process: 'empty',
	},*/
};