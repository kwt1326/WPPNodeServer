const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const { verifyPassword } = require('../../middlewares/util');

// DB Table
const user = require('../../models/index').user;

// routers
const router = express.Router(); // INDEX ROUTER

router.post('/', async (req, res) => {

    const email = req.query.email;
    const password = req.query.password;
    const username = req.query.name;
    const nickname = req.query.nickname;

    if(verifyPassword(password)) {
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
        await bcrypt.genSalt(10, async (err, salt) => {
            if(err) {
                res.status(403).send(err);
            }
            else {
                await bcrypt.hash(password, salt, null, async (err, hash) =>
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
        })
    }
});

module.exports = router;