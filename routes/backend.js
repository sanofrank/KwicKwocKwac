const router = require('express').Router();
const fs = require('fs');
const fgc = require('file-get-contents');

const dir = 'public/files';
const src = /src=(["|\'])(?!http)/g;
const href = /href=(["|\'])(?!http)/g;
const out = [];

let listing = new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
        if (err) return console.log('ERROR',err);
        else {
            files.forEach(file => {
                if (!file.includes('.', 0)) {
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

router.get('/list', async (req, res) => {
    try {
        listing.then(
            res.send(out)
        );
    } catch (err) {
        res.status(400).send(err);
    }
});

router.get('/load', async (req, res) => {
    try {
        let files = 'files/';
        let fileName = req.query.file;
        let content = await fgc(`${dir}/${fileName}/index.html`);
        
        content = content.replace(src,`src=$1${files}${fileName}/`);
        content = content.replace(href,`href=$1${files}${fileName}/`);
        
        res.set('Content-Type: text/html');
        res.send(content);
    } catch (err) {
        res.status(400).send(err);
    }
});

router.post('/upload', async (req,res) => {
    
});

module.exports = router; 