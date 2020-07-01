const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const mongo = require('./dbConfig');


const app = express();
const PORT = process.env.PORT || 3000;

//Import routes
const listRoute = require('./routes/backend');
const authRoute = require('./routes/authentication');

app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

mongo.connect();

app.use(express.static('public'));

//Middleware
app.use(express.json({limit: '20mb'})); //json parser per mandare post request
app.use(fileUpload());
app.use(express.urlencoded( {extended : false})); //allow us to send data from front end to server
//Route Middleware
app.use('/api',listRoute);
app.use('/api',authRoute);

app.listen(PORT,() => console.log(`Server listening on port ${PORT}`));
