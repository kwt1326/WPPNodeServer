const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const url = require('url');
const { verifyToken } = require('../passport/checklogin');

// routers
const router = express.Router(); // INDEX ROUTER

router.get('/', verifyToken, function(req,res,next) {
    console.log("Immideate logined");
});

// local login
router.post('/login', function(req,res,next) {
    passport.authenticate('local', { // options
        failureRedirect: (process.env.NODE_ENV === "production") ? process.env.CLIENT_PATH + '/login' : "http://localhost:3000/login",
        successFlash: 'Welcome!',
        failureFlash: 'Fail login!',
        session : false // JWT used
    }, 
    function successRedirect (err, user, info) { // callback redirect (back to origin)
        if(err || !user) {
            return res.status(500).send("Can't Login process : " + err);
        }

        req.logIn(user, {session : false}, (err) => {
            if(err) {
                return res.status(500).send("Can't Login process : " + err);
            }

            const token = jwt.sign({
                id : user.id,
                level : user.level,
            }, (process.env.NODE_ENV === "production") ? process.env.JWT_SECRET : 'jwt_lo_secret', {
                expiresIn : '1h',
            });

            res.cookie('jwttoken', token ); 
            res.redirect(process.env.CLIENT_PATH);

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
        failureRedirect: process.env.CLIENT_PATH,
        session : false,
    }), (req,res) => {
        console.log("SUCCESS FACEBOOK LOGGED : ");
        res.cookie('userdata', req.user.id ); 
        res.redirect(String(process.env.CLIENT_PATH));
    }
);

router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: process.env.CLIENT_PATH,
        session : false,
    }), (req,res) => {
        console.log("SUCCESS GOOGLE_OAUTH20 LOGGED : ");
        res.cookie('userdata', req.user.id ); 
        res.redirect(String(process.env.CLIENT_PATH));
    }
);

// logout & session destroy
router.get('/logout', verifyToken, (req, res) => {
    req.logOut();
    res.clearCookie('userdata');
    res.clearCookie('jwttoken');
    res.redirect(process.env.CLIENT_PATH);  
    return;
});

router.post('/mailing', (req, res) => 
{
    const to_email = req.query.email;

    // Generate SMTP service account from ethereal.email
    nodemailer.createTestAccount((err, account) => {
        if (err) {
            console.error('Failed to create a testing account. ' + err.message);
            return process.exit(1);
        }

        console.log('Credentials obtained, sending message...');

        // Create a SMTP transporter object
        let transporter = nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: {
                user: account.user,
                pass: account.pass
            }
        });

        // Message object
        let message = {
            from: 'E-mail forgot authentication <no-reqly@aquaclub.club>',
            to: to_email,
            subject: 'E-mail forgot authentication click to Success ✔',
            text: 'Hello to myself!',
            html: "<p></p><a href='http://localhost:3500/api/auth/?email="+ to_email +"&token=abcdefg'>인증하기</a>"
        };

        transporter.sendMail(message, (err, info) => {
            if (err) {
                console.log('Error occurred. ' + err.message);
                return process.exit(1);
            }

            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        });
    });
})

module.exports = router;