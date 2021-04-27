const router = require('express').Router();
const verify = require('./verifyToken');

router.get('/index', verify, (req, res) => {
    res.render('index.html')
})

router.get('/login', (req, res) => {
    res.render("login.html");
})

router.get('/documentazione', (req, res) => {
    res.render("documentation.html")
})

router.get('/send_email', (req, res) => {
    res.render("send_email.html");
})

router.get('/', verify, function (req, res) {
    res.redirect('/markup/index')
});

router.get('/read', function (req, res) {
    let file = req.query.file;

    fs.readFile(`./doc/${file}`, (err, data) => {
        if (err) throw err;
        console.log(data);

        return res.send(data);
    });
})

module.exports = router
