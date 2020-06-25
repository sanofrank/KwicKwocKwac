const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const verify = require('./verifyToken');
//const { pool } = require('../dbConfig');
const User = require('../model/User');
const { loginValidation } = require('../validation');

router.post('/login', async (req,res) => {

    const login = req.body;
    
    //MONGODB LOGIN
    //Validate data
    const {error} = loginValidation(login);
    if(error) return res.status(400).send(error.details[0].message); //bad request to show just the message error

    //Checking if username exist
    const user = await User.findOne({name: req.body.username}); //check in the DB
    if(!user) return res.status(400).send('Username incorrect');

    //Password is correct
    const validPass = await bcrypt.compare(req.body.password,user.password); //combine the password gave vs the one we stored
    if(!validPass) return res.status(400).send('Invalid password');

    //Create and assign token
    const token = jwt.sign({uuid: user.uuid},process.env.TOKEN_SECRET); //pass some data to the token
    //res.header('auth-token',token).send(token);
    res.cookie('auth_token', token, 
    {
        maxAge: 3600,
        httpOnly: true,
        //secure: true
    })
    res.send('Logged in');

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
});

router.get('/verify', verify, (req,res) => {
    res.json({editmode: true});
});

module.exports = router;