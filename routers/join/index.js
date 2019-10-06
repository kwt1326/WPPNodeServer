const express = require('express');
const bcrypt = require('bcrypt-nodejs');

// DB Table
const user = require('../../models/index').user;

// routers
const router = express.Router(); // INDEX ROUTER

router.post('/', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.name;
    const nickname = req.body.nickname;
    const pw_pat = /^(?=.*?[a-zA-Z])(?=.*?[0-9])(?=.*?[!@#$%^&*()]).{6,14}$/

    if(pw_pat.test(password)) { // password valid check
        if(!req.isAuthenticated()) { // logged check
            const exist_user = await user.findOne({ where : {email} });
            if(exist_user) {
                req.flash('Already joined user');
            }
            else {
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