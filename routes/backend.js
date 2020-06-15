const router = require('express').Router();
const fs = require('fs');
const fgc = require('file-get-contents');
const mkDir = require('make-dir');

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
    try{
        let file = req.body.filename;
        let out = req.body.content;

        let path = `${dir}/${file}`;
        let regex = new RegExp(path,'g');

        if (file !== ""){
            if(!fs.existsSync(path)){
                const newDir = await mkDir(path);
                console.log(newDir);
            }
        }

        let newPath = `${path}/index.html`;

        let content = out.replace(regex,"");
        content.replace(regex,"");
        
        if(content!== "" && !content.includes("Key Words In Context")){
            fs.writeFile(newPath,content, (err) => {
                if(err) return res.status(400).send(`File ${file} non salvato corretamente`);
            });
            return res.send(`File ${file} salvato correttamente in ${newPath}`);
        };

        return res.send('File empty');

    }catch(err){
        res.status(400).send(err);
    }
});

module.exports = router; 