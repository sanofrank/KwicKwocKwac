const router = require('express').Router();
const fs = require('fs');

const dir = './files';
const out = [];

let listing = new Promise((resolve,reject) => {
    fs.readdir(dir, (err, files) => {
        if(err) return res.status(400).send('error on listing',err);
        else{
            files.forEach(file => {
                if(!file.includes('.',0)){
                    let obj = {
                        url: file,
                        label: file
                    };
                    out.push(obj);
                };
            });
        };  
        resolve('success');
    });
});

router.get('/list', async (req,res) => {
    try{
        listing.then(
        res.send(out)
        );
    }catch(err){
        res.status(400).send(err);
    }
});

module.exports = router; 