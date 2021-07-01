const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const verify = require('./routes/verifyToken');
const fileUpload = require('express-fileupload');
const mongo = require('./dbConfig');
const fs = require('fs')


const app = express();
const PORT = process.env.PORT || 3001;

//Import routes
const listRoute = require('./routes/backend');
const authRoute = require('./routes/authentication');
const metadataRoute = require('./routes/metadata');
const baseRoute = require('./routes/baseRouting');
const { resolveSoa } = require('dns');

app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true
}));

mongo.connect();

app.set('views', './public')
app.engine('html', require('ejs').renderFile);

app.get('/', (req,res) => {
    res.redirect('/markup')
})

app.get('/markup/', (req,res) => {
    res.redirect('/markup/index')
})

app.use('/markup',express.static('public'))

//Middleware
app.use(express.json({limit: '100mb'})); //json parser per mandare post request
app.use(fileUpload());
app.use(express.urlencoded({limit: '50mb',extended : false})); //allow us to send data from front end to server
//Route Middleware
app.use('/markup', baseRoute);
app.use('/markup/api',listRoute);
app.use('/markup/api',authRoute);
app.use('/markup/api',metadataRoute);

app.listen(PORT,() => console.log(`Server listening on port ${PORT}`));
