const express = require('express');
const path = require('path');

// routers
const router = express.Router(); // INDEX ROUTER
const join = require('./join/index');
const auth = require('./auth/index');
const main = require('./main/index');
const user = require('./user/index');
const post = require('./post/index');


router.get('/', function(err,req,res) {
    if(err) {
        console.log("Express Router ERROR : INDEX =>" + err);    
        const error = new Error("Express Router ERROR : INDEX =>" + err);
        error.status = 404;
        next(error);    
    }
    console.log("Express Router Index");
});

router.use('/main', main);
router.use('/join', join);
router.use('/auth', auth);
router.use('/user', user);
router.use('/post', post);

module.exports = router;