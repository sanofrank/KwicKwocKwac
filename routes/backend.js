const router = require('express').Router();
const fs = require('fs');
const rimraf = require('rimraf');
const fgc = require('file-get-contents');
const format = require('html-format');
const mkDir = require('make-dir');
const mammoth = require('mammoth');
const cheerio = require('cheerio');
const roman = require('romannumerals')
const jwt = require('jsonwebtoken');
const Metadata = require('../model/Metadata');

const dir = 'public/files';
//clean only src and href without #footnote or #endnote
const src = /src=(["|\'])(?!http)(?!#footnote)(?!#endnote)(?!#moronote)(?!#curatornote)/g;
const href = /href=(["|\'])(?!http)(?!#footnote)(?!#endnote)(?!#moronote)(?!#curatornote)/g;

// the poor man's interpolation function for templates. ©FV
String.prototype.tpl = function(o, removeAll) { 
    var r = this ; 
    for (var i in o) { 
        r = r.replace(new RegExp("\\{\\$"+i+"\\}", 'g'),o[i]) 
    } 
    if (removeAll) {
        r = r.replace(new RegExp("\\{\\$[^\}]+\\}", 'g'),"") 
    }
    return r 
}

//Organize footnotes in moronotes and curatornotes
let organizeFootnotes = function ($,username) {
        let moroNotes = [];
        let curatorNotes = [];
        let prop = "dcterms:creator"

        // footnote search for moro notes
        // data-alert attribute for first time alert display                
        let tplMoroList = `
            <ol id="moroNotes" type="I" data-alert="true">
                {$list}
            </ol>
            `
        let tplMoronote = `
            <li id="moronote-{$index}" typeof="moro:Footnote" about="#moronote-{$index}" property="{$prop}" resource="#AldoMoro" data-toggle="tooltip" data-placement="top" title="Nota di Aldo Moro">
                {$content}
            </li>
            `

        $("li[id^='footnote'], li[id^='endnote']").each(function(index) {
            //console.log(roman.toRoman(index + 1) + ": " + $(this).html());
            let text = $(this).text();

            //Splice text from end arrow symbol
            let noArrow = text.slice(0,text.length - 1);            
            //Trim string
            let trim = noArrow.trim();

            let newLength;
            
            if(trim.charAt(0) === '[' && trim.charAt(trim.length-1) === ']'){ // Check first and last character
                newLength = moroNotes.length + 1
                
                //console.log('Moro Notes'+$(this).text())
                //Change id
                $(this).attr('id',`moronote-${newLength}`)
                //Get ref
                let note_ref = $(this).find('a[href^="#footnote-ref-"],a[href^="#endnote-ref-"]');
                let ref_id = $(note_ref).attr('href');
                $(note_ref).attr('href',`#moronote-ref-${newLength}`);

                //Change ref
                $(`${ref_id}`).attr('href',`#moronote-${newLength}`)
                $(`${ref_id}`).text(`[${roman.toRoman(newLength)}]`)
                $(`${ref_id}`).attr('id',`moronote-ref-${newLength}`)   
            
                moroNotes.push($(this).html());
                $(this).remove()
            }else{
                if(!$(this).parent().attr('id')) $(this).parent().attr('id','curatorNotes') //Add id to curator list

                newLength = curatorNotes.length + 1

                //console.log('Curator Notes'+$(this).text())                

                //Change id
                $(this).attr('id',`curatornote-${newLength}`)

                //Add RDFa model: typeof, about attribute, property and resource value
                $(this).attr('typeof',`moro:Footnote`)
                $(this).attr('about',`#curatornote-${newLength}`)
                $(this).attr('property',prop)
                $(this).attr('resource','#'+username.replace(/\s/g, ''))

                //Get ref
                let note_ref = $(this).find('a[href^="#footnote-ref-"],a[href^="#endnote-ref-"]');
                let ref_id = $(note_ref).attr('href');
                $(note_ref).attr('href',`#curatornote-ref-${newLength}`);

                //Change ref
                $(`${ref_id}`).attr('href',`#curatornote-${newLength}`)
                $(`${ref_id}`).text(`[${newLength}]`)
                $(`${ref_id}`).attr('id',`curatornote-ref-${newLength}`)   
        
                curatorNotes.push($(this).html())
            }
        })

        //Create moronotes list
        if(moroNotes.length > 0){
            let moroNotes_li = "";
            let moroNotes_ol = "";

            //Add footnoteMeta div to contain person typeof if Aldo Moro notes have been found
            $('#headFile').append('<div id="footnoteMeta"></div>')
            $('#footnoteMeta').append('<meta about="#AldoMoro" typeof="foaf:Person">')
            $('#footnoteMeta').append('<meta about="#AldoMoro" property="rdfs:label" content="Aldo Moro">')

            for(i in moroNotes){
                let index = parseInt(i)+1;
                let moronote = tplMoronote.tpl({index: index, content: moroNotes[i], prop});                       
                moroNotes_li = moroNotes_li.concat(moronote);                        
            }

            if(moroNotes_li.length > 0){
                moroNotes_ol = tplMoroList.tpl({list: moroNotes_li});

                $('body').append(moroNotes_ol);
            }
        }
        
        //Add footnoteMeta div to contain person typeof if curator notes have been found
        if(curatorNotes.length > 0 && $('#footnoteMeta').length){
            $('#footnoteMeta').append(`<meta about="${username.replace(/\s/g, '')}" typeof="foaf:Person">`)
            $('#footnoteMeta').append(`<meta about="#${username.replace(/\s/g, '')}" property="rdfs:label" content="${username}">`)
        }else{
            if(curatorNotes.length > 0){
                $('#headFile').append('<div id="footnoteMeta"></div>')
                $('#footnoteMeta').append(`<meta about="#${username.replace(/\s/g, '')}" typeof="foaf:Person">`)
                $('#footnoteMeta').append(`<meta about="#${username.replace(/\s/g, '')}" property="rdfs:label" content="${username}">`)
            }            
        }
        
        //Return body
        return content = $('html').html();
}

// List all document from public/files
router.get('/list', async (req, res) => {
    try {
        const token = req.cookies.auth_token;
        if(!token) res.status(400).send("No token provided");

        const verified = jwt.verify(token,process.env.TOKEN_SECRET);
        const username = verified.username;
        let su = false;
        const out = [];

        if(username === "ProgettoAldoMoro") su = true; 

        fs.readdir(dir, (err,files) => {
            if (err) return console.log('ERROR',err);
            
            files.forEach(file => {
                if(file.substring(0,1) !== '.'){
                    let split = file.split("_");
                    
                    let user = split[0];
                    let sezione = split[1]
                    let volume = split[2]
                    let tomo = split[3]
                    let opera = split[4]
                    let status = split[5];

                    let obj = {
                        url: file,
                        label: opera,
                        stat: status
                    };

                    if(user === username && su == false) out.push(obj);
                    if(su == true) {
                        obj.user = user;
                        out.push(obj)}
                } 
            })

            let final = {
                su: su,
                list: out
            }

            return res.send(final);
        })
    } catch (err) {
        res.status(400).send(err);
    }
});

// Load document on the platform 
router.get('/load', async (req, res) => {
    try {
        
        const token = req.cookies.auth_token;
        if(!token) return res.status(400).send("Non è possibile visualizzare il documento perché la tua sessione è scaduta.\nSe desideri, puoi salvare le ultime modifiche apportate e ricaricare la pagina per riaccedere alla piattaforma.");

        var json = {
            "metadata" : {},
            "html" : ""
        };

        let files = 'files/';
        let fileName = req.query.file;
        let content = await fgc(`${dir}/${fileName}/index.html`);
        
        content = content.replace(src,`src=$1${files}${fileName}/`);
        content = content.replace(href,`href=$1${files}${fileName}/`);
        // content = content.replace(srcEnd,`src=$1${files}${fileName}/`);
        // content = content.replace(hrefEnd,`href=$1${files}${fileName}/`);

        json.html = content

        //res.set('Content-Type: text/html');
        //Check metadata
        let split = fileName.split('_')
        const objId = split[6];

        if(!objId || objId === "undefined") return res.send(json);

        await Metadata.findOne({_id: objId}, function(err, data){
            if(err) return res.status(404).send("ID dell'opera non valido")
            
            json.metadata = data;
            return res.send(json);
        })
    } catch (err) {
        res.status(400).send(err);
    }
});

// Upload document
router.post('/upload', async (req, res) => {
    try{
        const token = req.cookies.auth_token;
        if(!token) return res.status(400).send(`Non è possibile caricare il documento perché la tua sessione è scaduta.\nSe desideri puoi salvare le ultime modifiche apportate e ricaricare la pagina per riaccedere alla piattaforma.`);

        const verified = jwt.verify(token,process.env.TOKEN_SECRET);
        let username = '';

        if(req.body.user == '') return res.status(400).send('Compilare il nome')
        if(req.body.user != 'undefined' && req.body.user){
            username = req.body.user;
        }else{
            username = verified.username;
        } 

        const type = req.body.type; 
        const sez = req.body.sez;
        const vol = req.body.vol;
        const tom = req.body.tom;

        // Check path consistency
        if( (sez > 2 || sez <= 0) || (vol > 4 || vol <= 0 ) || (tom > 2 || tom < 0)){
            return res.status(400).send('Il percorso sezione/volume/tomo del documento è invalido.')
        }
        
        if(type === "docx"){
            if(!req.files)   return res.status(400).send('Scegliere almeno un documento da caricare')

            let filenames = req.body.filenames
            let files = req.files.file; 
            let opera, fileName, path;

            //Convert files and filenames into array if only 1 element
            if(!files.length && typeof filenames == 'string'){
                files = [files];
                filenames = [filenames];
            }

            //Check if path already exist
            for(i in filenames){
                opera = filenames[i].replace(/_+/g,' ').replace(/'/g,"’").trim();

                fileName = `${username}_sez${sez}_vol${vol}_tom${tom}_${opera}_`; //_default removed
                path = `${dir}/${fileName}`;
                console.log(fileName);
                if (opera !== ""){
                    //CHECK IF FILE ALREADY EXIST EXTRACTING THE FOLDER NAME WITHOUT OBJID   
                    const all_files = fs.readdirSync(dir);
                    
                    for(const file of all_files){
                        if(file.includes(fileName)){                                
                            return res.status(400).send(`Il documento ${opera} è già presente nella piattaforma, si prega di cambiare il titolo prima di caricarlo o rimuoverlo.`) 
                        }
                    }                    
                }
            }            

            for(i in files){
                opera = filenames[i].replace(/_+/g,' ').replace(/'/g,"’").trim();

                fileName = `${username}_sez${sez}_vol${vol}_tom${tom}_${opera}_default`;
                path = `${dir}/${fileName}`;
                let htmlPath = `${path}/index.html`;
                let content;

                if (opera !== ""){
                    if(!fs.existsSync(path)){
                        await mkDir(path);
                    }else{
                     return res.status(400).send(`Il documento ${opera} è già presente nella piattaforma, si prega di cambiare il titolo prima di caricarlo o rimuoverlo.`)
                    }
                }

                let docFile = files[i].data;

                const result = await mammoth.convertToHtml({buffer: docFile});   
                content = await result.value;
                
                let $ = cheerio.load(content)
                
                //BODY WRAPPER
                if(!$("#bodyFile").length){
                    let body = '<div id="bodyFile"></div>'
                    $('body').wrap(body);

                    content = $('html').html();
                }

                //HEAD WRAPPER
                if(!$("#headFile").length){
                    let head = `<div id="headFile">
                                    <div id="mentionMeta">
                                    </div>
                                    <div id="referenceMeta">
                                    </div>
                                </div>`
                    $('head').wrap(head);

                    content = $('html').html();
                }                

                //If has footnote or endnote
                if($("li[id^='footnote'], li[id^='endnote']").length){
                    content = organizeFootnotes($,username);                    
                }    
                                                
                if(content!== "" && !content.includes("Key Words In Context")){
                    fs.writeFile(htmlPath,content, (err) => {
                        if(err) return res.status(400).send(`File ${opera} non salvato corretamente`);
                    });
                }else{
                    return res.send(`File ${opera} vuoto`)
                };

            }
            
        }
        
        if(type === "html"){
            
            if(req.body.data.length == 0) return res.status(400).send('Scegliere almeno un documento da caricare')

            let sez = req.body.sez;
            let vol = req.body.vol;
            let tom = req.body.tom;
            let data = req.body.data;
            let opera,fileName,path

            //Check if path already exist
            data.forEach(file => {
                opera = file.filename.replace(/_+/g,' ').replace(/'/g,"’");

                fileName = `${username}_sez${sez}_vol${vol}_tom${tom}_${opera}_default`;
                path = `${dir}/${fileName}`;

                if (opera !== ""){
                    //CHECK IF FILE ALREADY EXIST EXTRACTING THE FOLDER NAME WITHOUT OBJID   
                    const all_files = fs.readdirSync(dir);
                    
                    for(const file of all_files){
                        if(file.includes(fileName)){                                
                            return res.status(400).send(`Il documento ${opera} è già presente nella piattaforma, si prega di cambiare il titolo prima di caricarlo o rimuoverlo.`) 
                        }
                    }
                }
            })
            
            //Create directories and upload html files
            data.forEach(async file => {
                opera = file.filename.replace(/_+/g,' ').replace(/'/g,"’");

                fileName = `${username}_sez${sez}_vol${vol}_tom${tom}_${opera}_default`;
                path = `${dir}/${fileName}`;
                let htmlPath = `${path}/index.html`;

                let content;

                if (opera !== ""){
                    if(!fs.existsSync(path)){
                        await mkDir(path);
                    }else{
                     return res.status(400).send(`Il documento ${opera} è già presente nella piattaforma, si prega di cambiare il titolo prima di caricarlo o rimuoverlo.`)
                    }
                }

                let newPath = `files/${fileName}`;
                
                let out = file.content;
                let regex = new RegExp(newPath,'g');

                content = out.replace(regex,"");
                content.replace(regex,"");

                let $ = cheerio.load(content)

                //BODY WRAPPER
                if(!$("#bodyFile").length){
                    let body = '<div id="bodyFile"></div>'
                    $('body').wrap(body);

                    content = $('html').html();
                }

                //HEAD WRAPPER
                if(!$("#headFile").length){
                    let head = `<div id="headFile">
                                    <div id="mentionMeta">
                                    </div>
                                    <div id="referenceMeta">
                                    </div>
                                </div>`
                    $('head').wrap(head);

                    content = $('html').html();
                }                

                //If has footnote or endnote                
                if($("li[id^='footnote'], li[id^='endnote']").length){
                    content = organizeFootnotes($,username);                    
                }                                
                                
                if(content!== "" && !content.includes("Key Words In Context")){
                    fs.writeFile(htmlPath, content , (err) => {
                        if(err) return res.status(400).send(`File ${opera} non salvato corretamente`);
                    });
                }else{
                    return res.send(`File ${opera} vuoto`)
                };
            })
        }

            return res.send('File salvati correttamente')
            
    }catch(err){
        res.status(400).send(err);
    }
});

// Save document
router.post('/save' , async (req,res) => {
    try{
        let filename = req.body.filename;
        let path = `${dir}/${filename}`;
        let htmlPath = `${path}/index.html`;
        let content;

        if (filename !== ""){
            if(!fs.existsSync(path)){
                await mkDir(path);
            }
        }

        let newPath = `files/${filename}`;
        let out = req.body.content;
        let regex;

        // Handle - charcter in regex 
        if(newPath.match(/-/g)){
            let newReg = newPath.replace(/-/g,"/-")
            regex = new RegExp(newReg,'g');    
        }else{
            regex = new RegExp(newPath,'g');
        }

        content = out.replace(regex,"");
        content.replace(regex,"");

        if(content!== "" && !content.includes("Key Words In Context")){
            fs.writeFile(htmlPath,content, (err) => {
                if(err) return res.status(400).send(`File non salvato corretamente`);
            });
            return res.send(`File salvato correttamente`);
        };

        return res.send('File empty');

    }catch(err){
        res.status(400).send(err)
    }
})

// Delete document
router.post('/delete', async (req,res) => {
    
    const token = req.cookies.auth_token;
    if(!token) return res.status(400).send(`Non è possibile eliminare i documenti perché la tua sessione è scaduta.\nSe desideri puoi salvare le ultime modifiche apportate e ricaricare la pagina per riaccedere alla piattaforma.`);

    let path;
    const filenames = req.body;
    
    if(filenames.length <= 0){
        return res.status(400).send('Non ci sono file selezionati da eliminare.')
    }

    for(filename of filenames){
        path = `${dir}/${filename}`

        if(filename !== ""){
            if(!fs.existsSync(path)){
                return res.status(400).send(`${filename} non è presente nella cartella dei file`)
            }else{
                let split = filename.split("_");
                const objId = split[6];

                if(objId && objId !== 'undefined'){
                    await Metadata.deleteOne({_id: objId}, (err) => {
                        if(err){
                            return res.status(400).send('Metadati non trovati');
                        }
                    })
                }

                rimraf(path, (err,data) => {
                    if(err){
                        return res.status(400).send(`Erorre nell'eliminazione del file ${filename}`)
                    }
                });
            }
        }
    }
    
    return res.send('File eliminati correttamente')
    
})

// Change status
router.post('/change' , (req,res) => {

    let fileName = req.body.file;
    let status = req.body.status;
    let newFileName, substring, split, old_status;

    switch(status) {
        case 'default':
            split = fileName.split('_');
            old_status = split[5];
            
            newFileName = `${split[0]}_${split[1]}_${split[2]}_${split[3]}_${split[4]}_default_${split[6]}`

            fs.rename(`${dir}/${fileName}`, `${dir}/${newFileName}` , function(err) {
                if ( err ) return res.status(400).send(`File ${fileName} non trovato`);
                return res.send(newFileName)
            });
            break
        case 'working':
            split = fileName.split('_');
            old_status = split[5];

            //substring = fileName.substring(0, fileName.length - old_status.length);
            //newFileName = substring.concat('working');
            newFileName = `${split[0]}_${split[1]}_${split[2]}_${split[3]}_${split[4]}_working_${split[6]}`

            fs.rename(`${dir}/${fileName}`, `${dir}/${newFileName}` , function(err) {
                if ( err ) return res.status(400).send(`File ${fileName} non trovato`);
                return res.send(newFileName)
            });
            break 
        case 'done':
            split = fileName.split('_');
            old_status = split[5];

            newFileName = `${split[0]}_${split[1]}_${split[2]}_${split[3]}_${split[4]}_done_${split[6]}`
            
            fs.rename(`${dir}/${fileName}`, `${dir}/${newFileName}` , function(err) {
                if ( err ) return res.status(400).send(`File ${fileName} non trovato`);
                return res.send(newFileName)
            });
            break 
    }

})

module.exports = router; 