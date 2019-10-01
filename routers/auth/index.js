const express = require('express');
const passport = require('passport');
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


module.exports = router;