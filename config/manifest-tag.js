const path = require('path'); 
const fs = require('fs');

const paths = require('./paths');
const env = require(path.resolve(paths.appPath, 'config/env'));
const manifestRead = require(path.resolve(paths.appPath, 'config/manifest-read'));

// link rel="stylesheet" 태그 생성
const createTagCSS = manifest => {
	let arr = [];
	if(!Array.isArray(manifest.css)) {
		return '';
	}
	manifest.css.forEach(function(src) {
		arr.push(`<link rel="stylesheet" href="/${manifest.path}${src}"></link>`);
	});
	return arr.join('');
};

// script 태그 생성
const createTagJS = manifest => {
	let arr = [];
	if(!Array.isArray(manifest.js)) {
		return '';
	}
	manifest.js.forEach(function(src) {
		arr.push(`<script src="/${manifest.path}${src}"></script>`);
	});
	return arr.join('');
};

// tag 반환
const getTag = type => ({ manifest={}, name="" }) => {
	let tag = "";
	if(name) {
		manifest = manifestRead({ name });
	}
	switch(type) {
		case "css":
			tag = createTagCSS(manifest);
			break;
		case "js":
			tag = createTagJS(manifest)
			break;
	}
	return tag;
};

module.exports = {
	css: getTag("css"),
	js: getTag("js"),
};