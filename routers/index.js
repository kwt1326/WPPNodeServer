const express = require('express');
const path = require('path');

// routers
const router = express.Router(); // INDEX ROUTER
const join = require('./join/index');
const auth = require('./auth/index');
const user = require('./user/index');
const post = require('./post/index');


router.get('/', function(req,res) {
    res.render('main', { title : "Index Page"})
    console.log("Express Router Index");
});

router.use('/join', join);
router.use('/auth', auth);
router.use('/user', user);
router.use('/post', post);

module.exports = router;