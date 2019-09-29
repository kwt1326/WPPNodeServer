const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt-nodejs');

// DB Table
const user = require('../../models/index').user;

// routers
const router = express.Router(); // INDEX ROUTER

router.get('/', function(req, res) {
    res.render('join.ejs', {result : ''});
});

router.post('/', async (req, res) => {
    const email = req.body.email;
    const password = req.body.pw;
    const re_pw = req.body.re_pw;
    const username = req.body.username;
    const nickname = req.body.nickname;

    try {
        if(!req.isAuthenticated()) {
            const exist_user = await user.findOne({ where : {email} });
            if(exist_user) {
                req.flash('Already joined user');
                res.redirect('/');
            }
            else {
                await bcrypt.hash(password, null, null, async (err, hash) =>
                {
                    try {
                        const user_list = await user.findAll();
                        if (bcrypt.compareSync(re_pw, hash)) {
                            console.log('pass check pw!');
                            await user.create({
                                email,
                                nickname,
                                username,
                                password: hash,
                                numjoin: user_list.length,
                            });
                            res.render('join.ejs', { result: username + ' Account has been successfly created.' });
                        }
                        else {
                            console.log('Inputed infos Not Compared');
                            res.redirect('/join');
                        }    
                    }
                    catch (err) {
                        console.log(err);
                    }
                });
            }
        }
    }
    catch (err) {
        console.log(err);
    }
});

module.exports = router;