const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const verify = require('./verifyToken');
//const { pool } = require('../dbConfig');
const User = require('../model/User');
const { loginValidation, registerValidation } = require('../validation');

router.get('/index', verify, (req,res) => {
    res.render("index.html");
})

router.post('/login', async (req,res) => {

    const login = req.body;
    
    //MONGODB LOGIN
    //Validate data
    const {error} = loginValidation(login);
    if(error) return res.status(400).send(error.details[0].message); //bad request to show just the message error

    //Checking if username exist
    const user = await User.findOne({name: req.body.username}); //check in the DB
    if(!user) return res.status(400).send('Il nome utente o la password non sono validi.');

    //Password is correct
    const validPass = await bcrypt.compare(req.body.password,user.password); //combine the password gave vs the one we stored
    if(!validPass) return res.status(400).send('Il nome utente o la password non sono validi.');

    //Create and assign token
    const token = jwt.sign({id: user._id, username: user.name},process.env.TOKEN_SECRET); //pass some data to the token
    //res.header('auth-token',token).send(token);
    res.cookie('auth_token', token, 
    {
        expires: new Date(Date.now() + 9000000),        
        httpOnly: true,
        //secure: true
    })
    return res.send(user.name);
});

router.post('/register', async (req,res) => { // async finchè aspettiamo il salvataggio 
    //VALEDATE DATA
    const {error} = registerValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message); //bad request to show just the message error

    //CHECKING USER ALREADY IN DATABASE
    const emailExist = await User.findOne({email: req.body.email}); //check in the DB
    if(emailExist) return res.status(400).send('Email already exists');
    
    //HASH PASSWORDS
    const salt = await bcrypt.genSalt(10); //random generated data
    const hashPassword = await bcrypt.hash(req.body.password,salt); //combines salt to hashes password

    //CREATE A NEW USER
    const user = new User ({
        name: req.body.name,
        email: req.body.email,
        password: hashPassword 
    });
    try{
    const savedUser = await user.save();
    return res.send('Registered');
    }catch(err){
        res.status(400).send("catch error",err);
    }
});

router.get('/verify', verify, (req,res) => {
    res.json({editmode: true});
});

module.exports = router;


// POSTGRES LOGIN
    // pool.query(
    //     `SELECT * FROM users WHERE name = $1`, [login.username], (error,result) =>{
    //         if(error) throw error;

    //         if(result.rows.length > 0){
    //             const user = result.rows[0];

    //             bcrypt.compare(login.password, user.password, (error, isMatch) => {
    //                 if(error) throw error;

    //                 if(isMatch){
    //                     //Create and assign token
    //                     const token = jwt.sign({uuid: user.uuid},process.env.TOKEN_SECRET); //pass some data to the token
    //                     console.log(user);
    //                     //res.header('auth-token',token).send(token);
    //                     res.cookie('auth_token', token, 
    //                     {
    //                         maxAge: 3600,
    //                         httpOnly: true,
    //                         //secure: true
    //                     })
    //                     res.send('Logged in');
    //                 }else{
    //                     return res.status(400).send('Invalid password');
    //                 }
    //             });
    //         }else{
    //             return res.status(400).send('Username incorrect');
    //         };
    //     }
    // );