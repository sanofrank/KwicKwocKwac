const fileGetContents = require('./index.js');

(async () => {
	try {
		const data = await fileGetContents('/tmp/foo/bar');

		console.log(data);
	} catch (err) {
		console.error('Unable to load data from /tmp/foo/bar', err);
	}
})();

// Or a HTTP request

fileGetContents('https://pokeapi.co/api/v2/pokemon/1/').then(json => {
	const firstPokemon = JSON.parse(json);

	console.log(`Name of first pokemon is ${firstPokemon.name}`);
}).catch(err => {
	console.error(`Unable to get content from PokeAPI. Reason:  ${err.message}`);
});

// Or better: HTTP POST request

fileGetContents('https://httpbin.org/post', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json'
	},
	content: JSON.stringify({
		Hello: 'World!'
	})
}).then(json => {
	const data = JSON.parse(json);

	console.log(data.json);
}).catch(() => {
	console.error('Unable to perform a HTTP request');
});
