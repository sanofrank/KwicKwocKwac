# fileGetContents.js
A Node.js version of [file_get_contents](https://php.net/file_get_contents) PHP function

## Objective
Turn easy handling a request to a URL or to File System wrapping into a Promise

## Example
```js
const fileGetContents = require('file-get-contents');

// A File request

try {
	let data = await fileGetContents('/tmp/foo/bar');

	console.log(data);
} catch (err) {
	console.log('Unable to load data from /tmp/foo/bar');
}

// Or a HTTP(S) request

fileGetContents('https://pokeapi.co/api/v2/pokemon/1/').then(json => {
	const pokemon = JSON.parse(json);

	console.log(`Name of first pokemon is ${pokemon.name}`);
}).catch(err => {
	console.err(`Unable to get content from PokeAPI. Reason: ${err.message}`);
});

```
