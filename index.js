const express = require('express');

const app = express();
const port = 3000;

//Import routes
const listRoute = require('./routes/backend');

app.use(express.static('public'));

//Middleware
app.use(express.json({limit: '20mb'})); //json parser per mandare post request
//Route Middleware
app.use('/api',listRoute);

app.listen(port,() => console.log(`Server listening on port ${port}`));
