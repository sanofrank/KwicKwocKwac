const jwt = require('jsonwebtoken');

//Middleware function
module.exports = (req,res,next) => {
    const token = req.cookies.auth_token;
    if(!token){  //Checking if the token exist in the header
        return res.redirect('/markup/login');
    };

    try{
        const verified = jwt.verify(token,process.env.TOKEN_SECRET);
        req.user = verified; //getting the ID back
        next();
    }catch(err){
        res.status(400).send('Invalid token');
    }
}

