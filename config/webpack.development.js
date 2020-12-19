// 모듈
const path = require('path'); 
const fs = require('fs');
//const glob = require("glob");
//const request = require('request'); // http 호출을 할 수있는 가장 간단한 방법 (HTTPS 지원)

const paths = require('./paths');
const env = require(path.resolve(paths.appPath, 'config/env'));
const manifestRead = require(path.resolve(paths.appPath, 'config/manifest-read'));

// webpack plugin 
const HtmlWebpackPlugin = require('html-webpack-plugin'); // dev server 사용시 test html 생성
//const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin; // 번들의 구성사항을 한번에 볼 수 있는 도구

// 웹팩 설정 
module.exports = {
	// 개발모드(로컬 개발환경 서버) 설정
	mode: 'development',
	output: {
		publicPath: '/', // publicPath 초기화!
	},
	devtool: 'source-map',
	devServer: {
		// 기본값은 "localhost"
		// 외부에서 개발 서버에 접속해서 테스트하기 위해서는 '0.0.0.0'으로 설정해야 한다.
		host: '0.0.0.0', 
		
		// 서버 포트 설정 
		// 기본값은 8080
		port: 9000,
		
		// 정적파일을 제공할 경로 (기본값은 output.path)
		/*
		output.publicPath 가 설정되어 있을 경우, contentBase 값을 설정해줘야 한다.
		http://<host 설정주소>:<port 설정포트>/<contentBase 경로입력> (예를 들어, http://0.0.0.0:9000/local/test/webpack/ )으로 접근 한다.
		*/
		//contentBase: path.resolve(__dirname, '../public'),
		//contentBase: `/${env.active}/${env.build}/`, 
		//contentBase: `/${env.active}/${env.build}/webpack/`, 

		// hot: HotModuleReplacementPlugin 을 사용해 HMR 기능을 이용하는 옵션 
		// 소스가 변경되면 자동으로 빌드되어 반영된다. 파일이 수정될 경우 그 부분에 대해 리로드를 해주는 옵션 
		hot: true,

		// 에러가 날 경우 브라우저에 표시 
		// 이 옵션을 사용하지 않아도 개발자 도구 콘솔에서 알려주므로 반드시 사용하지 않아도 되지만 
		// 에러가 났을 경우 확실히 알려주기 때문에 유용할 수 있다. 
		overlay: true,

		// compress : gzip 압축방식을 이용하여 웹 자원의 사이즈를 줄이는 방법 
		// 웹 성능 최적화에 관한 기법으로 gzip(https://ko.wikipedia.org/wiki/Gzip) 은 파일들의 본래 크기를 
		// 줄이는 것(minification, concatenation, compression)이 아니라 서버와 클라이언트 간의 압축 방식을 의미합니다. 
		//compress: true,

		// dev server 구동 후 브라우저 열기
		//open: true,

		// stats
		// 메시지 수준을 정할수 있다. ‘none’, ‘errors-only’, ‘minimal’, ‘normal’, ‘verbose’ 로 메세지 수준을 조절한다.
		//stats: "errors-only",

		// historyApiFallback
		// 히스토리 API를 사용하는 SPA 개발시 설정한다. 404가 발생하면 index.html로 리다이렉트한다.
		//historyApiFallback: true,

		// before에 설정한 미들웨어는 익스프레스에 의해서 app 객체가 인자로 전달되는데 Express 인스턴스
		before: (app, server, compiler) => {
			// curl localhost:<포트설정값>/api/keywords
			app.get('/api/keywords', (req, res) => {
				res.json([
					{ keyword: '이탈리아' },
					{ keyword: '세프의요리' }, 
					{ keyword: '제철' }, 
					{ keyword: '홈파티'}
				])
			});
			//
			app.get('/api/test', (req, res) => {
				let option = { // http://118k.tistory.com/246
					method: "GET",
					uri: "http://news.mk.co.kr/newsRead.php?sc=30000001&year=2016&no=773608",
					/*headers: {
						"User-Agent": "Mozilla/5.0" 
					},*/
					encoding: null
				};
				request(option, function(error, response, html) {
					if(error) throw error;
				
					//console.log(html);
				});
			});
		},

		// 웹팩 개발 서버에서 api 서버로 프록싱
		proxy: {
			// 개발서버에 들어온 모든 http 요청중 '/api' 로 시작되는것은 'http://localhost:<포트설정값>' 로 요청되도록 설정
			// 즉, devServer.port 로 연결되도록 설정 
			'/api': 'http://localhost:9000', 
		}
	},

    // 개발모드 전용 플러그인
	plugins: [
		// 번들 된 파일을 <script />로 로드한 html 파일을 자동으로 생성해 주는 plugin - (개발환경에서 사용하기 위한 플러그인)
		// https://github.com/jantimon/html-webpack-plugin
		// output.publicPath 값이 설정되어 있을 경우, devServer.contentBase 값 설정이 필요하다.
		// (output.path 경로에서 자동으로 빌드 리소스를 가져오는데, output.publicPath 설정할 경우 가져올 경로가 변경된다. 즉, publicPath 주석처리 필요)
		new HtmlWebpackPlugin({
			//filename: path.resolve(__dirname, '../public/index.html'),
			template: path.resolve(__dirname, '../pages/webpack-dev.ejs'),
			templateParameters: function(compilation, assets, options) {
				/*
				assets
				{
					"css": [ "main.css" ],
					"js": [ "assets/head_bundle.js", "assets/main_bundle.js"],
					"chunks": {
						"head": {
							"entry": "assets/head_bundle.js",
							"css": [ "main.css" ]
						},
						"main": {
							"entry": "assets/main_bundle.js",
							"css": []
						},
					}
				}
				*/
				let { css=[], js=[] } = assets && typeof assets === 'object' ? assets : {};
				let gulp;

				//console.log('[webpack template] compilation', compilation);
				//console.log('[webpack template] assets', assets);
				//console.log('[webpack template] options', options);
				//console.log(compilation.options);
				//console.log(compilation.getStats().toJson());

				// gulp 에서 만든 라이브러리 파일 가져오기 
				//gulp = manifestRead({name: 'library'});
				
				// ejs 템플릿 엔진을 사용할 경우, 해당 페이지에 데이터 주입
				// ejs-loader 가 웹팩에 설정되어 있어야 한다
				return {
					title: 'Webpack Test Page',
					// javascript, css 등 번들링 결과물 EJS 템플릿에 주입 
					css,
					js,
				};
			},
			inject: false,
			minify: false,
			showErrors: true, // 에러 발생시 메세지가 브라우저 화면에 노출 된다.
		}),
		// 번들링 구조를 시각적으로 보여주는 기능
		//new BundleAnalyzerPlugin(),
	],
};