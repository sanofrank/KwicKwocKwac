const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const verify = require('./routes/verifyToken');
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

app.set('views', './public')
app.engine('html', require('ejs').renderFile);


app.get('/index', verify, (req,res) => {
    res.render('index.html')
})

app.get('/login', (req,res) =>{
    res.render("login.html");
})

app.get('/register', (req,res) =>{
    res.render("register.html");
})

app.get('/', verify , function( req, res ) {
    console.log("login");
    res.redirect('/index')
   });

app.use(express.static('public'))


//Middleware
app.use(express.json({limit: '20mb'})); //json parser per mandare post request
app.use(fileUpload());
app.use(express.urlencoded( {extended : false})); //allow us to send data from front end to server
//Route Middleware
app.use('/api',listRoute);
app.use('/api',authRoute);

app.listen(PORT,() => console.log(`Server listening on port ${PORT}`));
