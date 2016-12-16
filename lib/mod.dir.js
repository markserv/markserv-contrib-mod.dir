const path = require('path');
const fs = require('fs');
const Handlebars = require('handlebars');

const plugin = (plugin, markserv) => {
	const isDir = file => {
		let isDir;

		try {
			isDir = fs.statSync(file).isDirectory();
		} catch (err) {
			markserv.error(err);
		}

		return isDir;
	};

	const getType = file => {
		const type = {};

		if (isDir(file)) {
			type.dir = true;
			return type;
		}

		if (markserv.helpers.isMarkdownFile(file)) {
			type.markdown = true;
			return type;
		}

		type.file = true;
		return type;
	};

	const buildFileList = (filelist, root, requestPath) => {
		const originUrl = requestPath.split(markserv.root)[1];

		return filelist.map(file => {
			const relativeFilepath = root ? file : originUrl + file;
			const absoluteFilepath = requestPath + '/' + file;
			const filetype = getType(absoluteFilepath);
			let filenameOutput = file;
			let fileclass = '';

			if (filetype.dir) {
				filenameOutput += '/';
				fileclass = 'dir';
			}

			if (filetype.markdown) {
				fileclass = 'markdown';
			}

			if (filetype.file) {
				fileclass = 'file';
			}

			// File object for handlebars template list
			const fileDef = {
				path: relativeFilepath,
				name: filenameOutput,
				class: fileclass
			};

			return fileDef;
		});
	};

	const isRootDirectory = requestPath => {
		const markservRoot = markserv.root;
		return path.resolve(requestPath) === path.resolve(markservRoot);
	};

	const compileTemplate = model => {
		const template = Handlebars.compile(plugin.template);
		const result = template(model);
		return result;
	};

	// main plugin function responds to a http request
	// main MUST always returns a promise
	return (requestPath, res, req) => new Promise(resolve => {
		const files = fs.readdirSync(requestPath);
		const isRoot = isRootDirectory(requestPath);
		const fileList = buildFileList(files, isRoot, requestPath);

		console.log(markserv);

		// console.log(markserv);
		const model = Object.assign({}, markserv, {
			dir: req.url,
			files: fileList
		});

		const result = compileTemplate(model);

		// Pass Back to HTTP Request Handler or HTTP Exporter
		const payload = {
			statusCode: 200,
			contentType: 'text/html',
			data: result
		};

		resolve(payload);
	});
};

module.exports = {
	name: 'markserv-contrib-mod.dir',
	templateUrl: 'mod.dir.html',
	plugin
};
