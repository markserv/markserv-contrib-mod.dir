const markserv = require.main.exports.plugin;

const path = require('path');
const fs = require('fs');
const Handlebars = require('handlebars');

markserv(plugin => {
  // console.log(plugin);

  const isDir = file => {
    let isDir;

    try {
      isDir = fs.statSync(file).isDirectory();
    } catch (err) {
      markserv.error(err);
    }

    return isDir;
  };

  const isMarkdown = file => {
    return file.split('.md')[1] === '';
  };

  const getType = file => {
    const type = {};

    if (isDir(file)) {
      type.dir = true;
      return type;
    }

    if (isMarkdown(file)) {
      type.markdown = true;
      return type;
    }

    type.file = true;
    return type;
  };

  const buildFileList = (filelist, root, requestPath) => {
    return filelist.map(file => {
      const absoluteDirPath = plugin.Markconf.root + requestPath;
      const relativeFilepath = root ? file : requestPath + '/' + file;
      const absoluteFilepath = root ? absoluteDirPath + file : absoluteDirPath + '/' + file;

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

  const compileTemplate = model => {
    const template = Handlebars.compile(plugin.template);
    const result = template(model);
    return result;
  };

  const isRootDirectory = requestPath => {
    return path.resolve(requestPath) === path.resolve(plugin.Markconf.root);
  };

  return requestPath => {
    return new Promise((resolve, reject) => {
      const files = fs.readdirSync(requestPath);
      const isRoot = isRootDirectory(requestPath);
      const fileList = buildFileList(files, isRoot, requestPath);

      const model = Object.assign(plugin.Markconf, {
        dir: requestPath,
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
});
