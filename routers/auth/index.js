const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt-nodejs');
const { verifyToken } = require('../passport/checklogin');

// routers
const router = express.Router(); // INDEX ROUTER

const db_user = require('../../models/index').user;

// Create a SMTP transporter object (mailing)
const transporter = nodemailer.createTransport({
    service : 'Gmail',
    auth: {
        user: process.env.GMAIL_MAIL,
        pass: process.env.GMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

let verifyCode = null;
let host = null;

router.get('/', verifyToken, function(req,res,next) {
    console.log("Immideate logined");
});

// local login
router.post('/login', function(req,res,next) {
    passport.authenticate('local', { // options
        failureRedirect: process.env.CLIENT_PATH + 'login',
        successFlash: 'Welcome!',
        failureFlash: 'Fail login!',
    }, 
    function successRedirect (err, user, info) { // callback redirect (back to origin)
        if(err || !user) {
            console.log("Can't Login process : " + err);
            return res.redirect(process.env.CLIENT_PATH + 'login');
        }

        req.logIn(user, null, (err) => {
            if(err) {
                console.log("Can't Login process : " + err);
                return res.redirect(process.env.CLIENT_PATH + 'login');
            }

            const token = jwt.sign({
                id : user.id,
                level : user.level,
            }, 
            process.env.JWT_SECRET, 
            { expiresIn : '1h', });

            req.session['jwttoken'] = token; 
            req.session.save(err => {
                if(err) console.log(err);
                console.log(req.sessionID);
                res.redirect(String(process.env.CLIENT_PATH) + `?sid=${req.sessionID}`);
            });
        });   
    })(req,res);        
});

// social login strategy
router.get('/social/facebook', passport.authenticate('facebook'));
router.get('/social/google', passport.authenticate('google', 
    { scope: ['profile'] }
));

router.get('/facebook/callback', 
    passport.authenticate('facebook', { 
        failureRedirect: process.env.CLIENT_PATH
    }), (req,res) => {
        console.log("SUCCESS FACEBOOK LOGGED : ");
        req.session['userdata'] = req.user.id; 
        req.session.save(err => {
            if(err) console.log(err);
            res.redirect(String(process.env.CLIENT_PATH) + `?sid=${req.sessionID}`);
        });
    }
);

router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: process.env.CLIENT_PATH
    }), (req,res) => {
        console.log("SUCCESS GOOGLE_OAUTH20 LOGGED : ");
        req.session['userdata'] = req.user.id; 
        req.session.save(err => {
            if(err) console.log(err);
            res.redirect(String(process.env.CLIENT_PATH) + `?sid=${req.sessionID}`);
        });
    }
);

// logout & session destroy
router.get('/logout', verifyToken, (req, res) => {
    req.logOut();
    req.session.destroy(() => {
        res.redirect(process.env.CLIENT_PATH);
    });
    return;
});

// change password (local account)
router.patch('/cpw', async (req, res) => {
    const hashkey = req.query.verify;
    const pw = req.query.pw;
    const pwCheck = req.query.pwCheck;

    if(pw === pwCheck) {
        const result = await bcrypt.compareSync(verifyCode, hashkey);
        if(result) {
            const data = verifyCode.split(process.env.EMAIL_AUTH_SECRET);
            const email = data[0];
            let hashedPW = null;

            console.log(verifyCode);
            console.log(email);

            await bcrypt.genSalt(10, (err, salt) => {
                if(err) {
                    res.status(403).send(err);
                }
                else {
                    bcrypt.hash(verifyCode, salt, null, async (err, hash) => {
                        hashedPW = hash;
                    });
                }
            })

            console.log(hashedPW);

            await db_user.update({ password : hashedPW }, { where : {email : email} })
            .then(result => {
                res.send({result : result});
            })
            .catch(err => {
                res.status(403).send("invalid user");
            })
        }
    }
    else {
        res.status(403).send("Failed Compare Password");
    }
});

router.get('/mail/verify', async (req, res) => 
{
    console.log(req.protocol + "://" + req.get('host'));

    if ((req.protocol + "://" + req.get('host')) === ("http://" + host)) {

        // 인증 키 복호화
        const result = await bcrypt.compareSync( verifyCode, req.query.key );
        if(result) {
            res.redirect(`${process.env.CLIENT_PATH}auth/cpw?verify=${req.query.key}`)
        }
        else {
            res.end("<h1>Failed Compare verify keys</h1>");
        }
    }
    else {
        res.end("<h1>Request is from unknown source</h1>");
    }
});

router.post('/mail/send', async (req, res) => 
{
    const to_email = req.body.email;
    verifyCode = String(to_email) + String(process.env.EMAIL_AUTH_SECRET) + String(Math.floor((Math.random() * 100) + 77)); // original key
    let sendCode = null;

    // 인증 키 암호화
    await bcrypt.genSalt(10, (err, salt) => {
        if(err) {
            res.status(403).send(err);
        }
        else {
            bcrypt.hash(verifyCode, salt, null, async (err, hash) => {
                try {
                    sendCode = hash;
                }
                catch (err) {
                    console.log(err);
                    return res.status(404).send(err);
                }
            });
        }
    })

    host = req.get('host');
    const link = `${process.env.API_PATH}api/auth/mail/verify?key=${sendCode}`;

    // Message object
    let message = {
        from: 'E-mail forgot authentication <no-reqly@aquaclub.club>',
        to: to_email,
        subject: 'E-mail forgot authentication click to Success ✔',
        text: 'Hello to myself!',
        html: `<p><h1>A/Q/U/A E-mail Verify Mail Authentication Page</h1></p>
            <a href='${link}'>이메일 인증하기</a>`
    };

    transporter.sendMail(message, (err, info) => {
        if (err) {
            console.log('Error occurred. ' + err.message);
            return process.exit(1);
        }
        //console.log('Message sent: %s', info.messageId);
        res.redirect(`${process.env.CLIENT_PATH}auth/e-mail?result=true`);
    });
});

module.exports = router;