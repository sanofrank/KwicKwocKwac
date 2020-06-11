'use strict';

const url = require('url');

const http = require('http');

const https = require('https');

const fs = require('fs');

const httpRequestOptions = [
	'protocol',
	'host',
	'hostname',
	'family',
	'port',
	'localAddress',
	'socketPath',
	'method',
	'path',
	'headers',
	'auth',
	'agent',
	'createConnection',
	'timeout',
	'encoding', // Xtra ...
	'content' // Xtra - http://stackoverflow.com/questions/2445276/how-to-post-data-in-php-using-file-get-contents
];

const fsReadOptions = [
	'encoding',
	'flag'
];

/**
 * Get content from a file or a URL
 *
 * @async
 *
 * @param {!string} path - Path or a URL
 *
 * @param {object} [options] - Options to get content
 *
 * @param {number} [options.family] - Same as [http.request.options.family]{@link https://nodejs.org/api/http.html#http_http_request_options_callback}
 *
 * @param {string} [options.socketPath] - Same as [http.request.options.socketPath]{@link https://nodejs.org/api/http.html#http_http_request_options_callback}
 *
 * @param {string} [options.method=GET] - Same as [http.request.options.method]{@link https://nodejs.org/api/http.html#http_http_request_options_callback}
 *
 * @param {object} [options.headers] - Same as [http.request.options.headers]{@link https://nodejs.org/api/http.html#http_http_request_options_callback}
 *
 * @param {string} [options.auth] - Same as [http.request.options.auth]{@link https://nodejs.org/api/http.html#http_http_request_options_callback}
 *
 * @param {(http.Agent|boolean)} [options.agent] - Same as [http.request.options.agent]{@link https://nodejs.org/api/http.html#http_http_request_options_callback}
 *
 * @param {function} [options.createConnection] - Same as [http.request.options.createConnection]{@link https://nodejs.org/api/http.html#http_http_request_options_callback}
 *
 * @param {number} [options.timeout] - Same as [http.request.options.timeout]{@link https://nodejs.org/api/http.html#http_http_request_options_callback}
 *
 * @param {string} [options.encoding=latin1] - Same as [fs.readFile.options.encoding]{@link https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback}
 *
 * @param {string} [options.content] - Used to send content
 *
 * @param {string} [options.flag] - Same as [fs.readFile.options.flag]{@link https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback}
 *
 * @return {Promise<string>}
 */
const fileGetContents = function (path, options) {
	const sanitizeOptions = function (indexes, options) {
		const sanitizedOptions = {};

		for (let x = 0, y = indexes.length; x < y; x++) {
			if (typeof options[indexes[x]] !== 'undefined') {
				let option = options[indexes[x]];

				if (typeof option === 'object') {
					option = Object.assign({}, option);
				}

				sanitizedOptions[indexes[x]] = option;
			}
		}

		return sanitizedOptions;
	};

	const httpRequest = function (options, resolve, reject) {
		const client = options.protocol === 'https:' ? https : http;

		const request = client.request(options, response => {
			let data = '';

			response.on('data', chunk => {
				data += chunk.toString(options.encoding || 'latin1');
			});

			response.on('end', () => {
				resolve(data);
			});
		});

		request.on('error', error => {
			reject(error);
		});

		request.end(options.content || undefined);
	};

	const fileSystemRequest = function (path, options, resolve, reject) {
		fs.readFile(path, options, (error, data) => {
			if (error) {
				reject(error);
			} else {
				resolve(data.toString());
			}
		});
	};

	return new Promise((resolve, reject) => {
		if (arguments.length === 0) {
			reject(new Error('Required path value'));

			return;
		}

		try {
			if (typeof options !== 'object') {
				options = {};
			}

			const uri = url.parse(path);

			if (!uri.host) {
				const fsOptions = sanitizeOptions(fsReadOptions, options);

				fileSystemRequest(path, fsOptions, resolve, reject);

				return;
			}

			const httpOptions = sanitizeOptions(httpRequestOptions, options);

			httpOptions.protocol = uri.protocol;

			httpOptions.host = uri.host;

			httpOptions.port = uri.port;

			httpOptions.hostname = uri.hostname;

			httpOptions.path = uri.path;

			httpRequest(httpOptions, resolve, reject);
		} catch (err) {
			reject(err);
		}
	});
};

module.exports = fileGetContents;
