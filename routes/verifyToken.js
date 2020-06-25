const jwt = require('jsonwebtoken');

//Middleware function
module.exports = function(req,res,next){
    const token = req.cookies.auth_token; //Checking if the token exist in the header
    if(!token) return res.json({ editmode: false});

    try{
        const verified = jwt.verify(token,process.env.TOKEN_SECRET);
        req.user = verified; //getting the ID back
        next();
    }catch(err){
        res.status(400).send('Invalid token');
    }
}

