const path = require('path');
const fs = require('fs');
const Handlebars = require('handlebars');

const helpers = (plugin, markserv) => {
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

		if (markserv.isMarkdownFile(file)) {
			type.markdown = true;
			return type;
		}

		type.file = true;
		return type;
	};

	const buildFileList = (filelist, root, requestPath) => {
		const originUrl = requestPath.split(plugin.Markconf.root)[1];

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
		const markservRoot = plugin.Markconf.root;
		return path.resolve(requestPath) === path.resolve(markservRoot);
	};

	const compileTemplate = model => {
		const template = Handlebars.compile(plugin.template);
		const result = template(model);
		return result;
	};

	return {
		isDir,
		getType,
		buildFileList,
		isRootDirectory,
		compileTemplate
	};
};

const main = (plugin, helpers) => (requestPath, res, req) => new Promise(resolve => {
	console.log(helpers);
	const files = fs.readdirSync(requestPath);
	const isRoot = helpers.isRootDirectory(requestPath);
	const fileList = helpers.buildFileList(files, isRoot, requestPath);

	const model = Object.assign(plugin.Markconf, {
		dir: req.url,
		files: fileList
	});

	const result = helpers.compileTemplate(model);

	// Pass Back to HTTP Request Handler or HTTP Exporter
	const payload = {
		statusCode: 200,
		contentType: 'text/html',
		data: result
	};

	resolve(payload);
});

module.exports = () => {
	// END: Helper functions

	// Return configuration
	return {
		name: 'markserv-contrib-mod.dir',

		// Set default `options` here, can be overridden in Markconf.js
		options: {
		},

		// String HTML template used to render the view
		template: '',

		// `templatePath` loads into `template` when the server starts up
		// templatePath is relative to the Markconf.js file that loads it
		templatePath: 'mod.dir.html',

		// link to and helper functions that you would like to use
		helpers,

		// `handle()` is called when the plugin starts up and should return a promise
		handle: main
	};
};
