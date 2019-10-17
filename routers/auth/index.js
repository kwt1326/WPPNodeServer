const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const url = require('url');
const { isLogined } = require('../passport/checklogin');

// routers
const router = express.Router(); // INDEX ROUTER

router.get('/', isLogined, function(req,res,next) {
    console.log("Immideate logined");
});

// local login
router.post('/login', (req, res) => {
    passport.authenticate('local-login', { // options
        failureRedirect: (process.env.NODE_ENV === "production") ? process.env.CLIENT_PATH + 'login' : "http://localhost:3000/login",
        successFlash: 'Welcome!',
        failureFlash: 'Fail login!',
        session : false // JWT used
        }, 
        function successRedirect (err, user, info) { // callback redirect (back to origin)
            if(err || !user) {
                return res.status(400).send("Can't Login process : " + err);
            }
    
            req.logIn(user, {session : false}, (err) => {
                if(err) {
                    return res.status(400).send("Can't Login process : " + err);
                }
    
                const token = jwt.sign({payload : user.id}, (process.env.NODE_ENV === "production") ? process.env.JWT_SECRET : 'jwt_lo_secret');

                return res.json({user : user.id, token});
                //return res.send({user : user.id, token});
    
                // if(req.session["redirect"] !== undefined && req.session["redirect-post"] !== undefined){ 
                //     const redirect = req.session["redirect"];
                //     const post = req.session["redirect-post"];
                //     req.session["redirect"] = '';   // used data delete
                //     req.session["redirect-post"] = {};  // used data delete
                //     req.session.save(function (err) { 
                //         if(err) {
                //             console.log(err);
                //             return next(err);
                //         }
                //         if(post) // if during post auth, prev post load for after login success. 
                //         {
                //             res.redirect(url.format({
                //                 pathname : (process.env.NODE_ENV === "production") ? process.env.CLIENT_PATH + redirect : "http://localhost:3000/" + redirect,
                //                 query : { "post" : post }
                //             }));  
                //         }
                //         else {
                //             console.log('Redirect To : ' + redirect);
                //             res.redirect((process.env.NODE_ENV === "production") ? process.env.CLIENT_PATH + redirect : "http://localhost:3000/" + redirect);  
                //         }
                //     });
                // };
            });           
    });
});

// logout & session destroy
router.get('/logout', isLogined, (req, res) => {
    req.logOut();
    //req.session.destroy(); // not use session
    //res.send({ redirect : '/' });
    res.redirect((process.env.NODE_ENV === "production") ? process.env.CLIENT_PATH : "http://localhost:3000");  
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

    // async function process () {
    //     // create reusable transporter object using the default SMTP transport
    //     let transporter = nodemailer.createTransport({
    //         // host: testAccount.smtp.host,
    //         // port: testAccount.smtp.port,
    //         // secure: testAccount.smtp.secure, // true for 465, false for other ports
    //         service : 'gmail',
    //         auth: {
    //             user: "fake", // generated ethereal user
    //             pass: "fakepass" // generated ethereal password
    //         },
    //     });
        
    //     // send mail with defined transport object
    //     const message = {
    //         from: '"E-mail forgot authentication" <no-reqly@aquaclub.club>', // sender address
    //         to: to_email, // list of receivers
    //         subject: 'E-mail authentication at aquaclub.club ✔', // Subject line
    //         text: 'Hello world?', // plain text body
    //         html: '<b>Hello world?</b>' // html body
    //     }

    //     await transporter.sendMail(message, (error, info) => {
    //         if (error) {
    //             console.log('Error occurred');
    //             console.log(error.message);
    //             return process.exit(1);
    //         }
    
    //         console.log('Message sent successfully!');
    //         console.log(nodemailer.getTestMessageUrl(info));
    
    //         // only needed when using pooled connections
    //         transporter.close();
    //     });
    // };

    //process();
})

module.exports = router;