const express = require('express');
const bcrypt = require('bcrypt-nodejs');

// DB Table
const user = require('../../models/index').user;

// routers
const router = express.Router(); // INDEX ROUTER

router.post('/', async (req, res) => {

    const email = req.query.email;
    const password = req.query.password;
    const username = req.query.name;
    const nickname = req.query.nickname;

    const kr_pat_include = /[가-힣]/;
    const pw_pat1 = /[a-zA-Z]/;
    const pw_pat2 = /[0-9]/;
    const pw_pat3 = /[!@#$%^&*()]/;

    if(pw_pat1.test(password) && pw_pat2.test(password) && pw_pat3.test(password) && !kr_pat_include.test(password) &&
        (password.length >= 6 && password.length <= 14 ))
        {
            if(!req.isAuthenticated()) { // logged check
                const exist_user = await user.findOne({ where : {email} });
                if(exist_user) {
                    req.flash('Already joined user');
                    res.status(403).send('Already joined user');
                }
                else {
                    console.log("PASS VALID PASSWORD!");
                    createuser();
                }
            }    
        }
    else {
        res.status(403).send('invalid password');
    }

    async function createuser () {
        await bcrypt.hash(password, null, null, async (err, hash) =>
        {
            try {
                await user.create({
                    email,
                    nickname,
                    username,
                    password: hash
                });
                const msg = "Success joined";
                console.log(msg);
                res.send({
                    result : msg
                });
            }
            catch (err) {
                console.log(err);
            }
        });    
    }
});

module.exports = router;