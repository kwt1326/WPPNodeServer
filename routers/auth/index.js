const express = require('express');
const passport = require('passport');
const nodemailer = require('nodemailer');
const url = require('url');
const { isLogined } = require('../passport/checklogin');

// routers
const router = express.Router(); // INDEX ROUTER

router.get('/', isLogined, function(req,res,next) {
    console.log("Immideate logined");
});

// local login
router.post('/login', passport.authenticate('local-login', {
    failureRedirect: (process.env.NODE_ENV === "production") ? process.env.CLIENT_PATH + 'login' : "http://localhost:3000/login",
    successFlash: 'Welcome!',
    failureFlash: 'Fail login!',
    failureFlash: true
    }),
    function successRedirect (req,res) { // callback redirect (back to origin)
        if(req.session.passport.user) {
            if(req.session["redirect"] !== undefined && req.session["redirect-post"] !== undefined){ 
                const redirect = req.session["redirect"];
                const post = req.session["redirect-post"];
                req.session["redirect"] = '';   // used data delete
                req.session["redirect-post"] = {};  // used data delete
                req.session.save(function (err) { 
                    if(err) {
                        console.log(err);
                        return next(err);
                    }
                    if(post) // if during post auth, prev post load for after login success. 
                    {
                        res.redirect(url.format({
                            pathname : (process.env.NODE_ENV === "production") ? process.env.CLIENT_PATH + redirect : "http://localhost:3000/" + redirect,
                            query : { "post" : post }
                        }));  
                    }
                    else {
                        console.log('Redirect To : ' + redirect);
                        res.redirect((process.env.NODE_ENV === "production") ? process.env.CLIENT_PATH + redirect : "http://localhost:3000/" + redirect);  
                    }
                });
            };
        }
    }
);

// logout & session destroy
router.get('/logout', isLogined, (req, res) => {
    req.logOut();
    req.session.destroy();
    //res.send({ redirect : '/' });
    res.redirect((process.env.NODE_ENV === "production") ? process.env.CLIENT_PATH : "http://localhost:3000");  
    return;
});

router.post('/mailing', (req, res) => {

    const to_email = req.query.email;

    async function main() {
        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        let testAccount = await nodemailer.createTestAccount((err, account) => {
            //console.error('Failed to create a testing account : ' + err);

            async function process () {
                // create reusable transporter object using the default SMTP transport
                let transporter = nodemailer.createTransport({
                    host: testAccount.smtp.host,
                    port: testAccount.smtp.port,
                    secure: testAccount.smtp.secure, // true for 465, false for other ports
                    auth: {
                        user: testAccount.user, // generated ethereal user
                        pass: testAccount.pass // generated ethereal password
                    },
                    logger : true,
                    debug : false           
                    },
                    {
                        from: '"E-mail forgot authentication" <no-reqly@aquaclub.club>',
                        headers: {
                            'X-Laziness-level': 1000 // just an example header, no need to use this
                        }
                    }
                );
                
                // send mail with defined transport object
                const message = {
                    from: '"E-mail forgot authentication" <no-reqly@aquaclub.club>', // sender address
                    to: to_email, // list of receivers
                    subject: 'E-mail authentication at aquaclub.club ✔', // Subject line
                    text: 'Hello world?', // plain text body
                    html: '<b>Hello world?</b>' // html body
                }

                await transporter.sendMail(message, (error, info) => {
                    if (error) {
                        console.log('Error occurred');
                        console.log(error.message);
                        return process.exit(1);
                    }
            
                    console.log('Message sent successfully!');
                    console.log(nodemailer.getTestMessageUrl(info));
            
                    // only needed when using pooled connections
                    transporter.close();
                });
            };

            process();
        });
    }
    
    main().catch(console.error);
})

module.exports = router;