const express = require('express');
const path = require('path');

// routers
const router = express.Router(); // INDEX ROUTER


router.get('/', function(req,res) {
    // if(req.user) {
    //     res.render('main.ejs'), {
    //     }
    // }
    // else {
        res.render('main.ejs', { 
            'joinorder' : req.user,
        });
    //};
});

router.get('/logout', function(req,res) {
    req.logOut();
    res.redirect('/login');
});

module.exports = router;