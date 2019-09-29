// local login strategy
const passport_local = require('passport-local').Strategy;

// crypt
const bcrypt = require('bcrypt-nodejs');

// DB table
const db_user = require('../../models/index').user;

module.exports = (passport) => {

    // session serialize
    passport.serializeUser(function (user, done) {
        //console.log('passport session save : ', user);
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        //console.log('passport session get id : ', id);
        db_user.findOne({ where: id })
            .then(find_user => done(null, find_user))
            .catch(err => done(err));
    });


    // login-local logic
    passport.use('local-login', new passport_local({
        usernameField: 'email',     // input = email
        passwordField: 'password',  // input = password
        passReqToCallback: true,
    },

        async (req, email, password, done) => {
            try {
                console.log("login Check Start!");
                const exist_user = await db_user.findOne({
                    where: { email },
                });
                if (exist_user) {
                    const result = await bcrypt.compareSync(password, exist_user.password);
                    if (result) {
                        console.log(req.session);
                        console.log('Success login');
                        return done(null, exist_user);
                    }
                    else {
                        return done(null, false, { message: "Not Compare Password" });
                    }
                }
                else {
                    return done(null, false, { message: "Not exist User" });
                }
            } catch (err) {
                console.log(err);
                return done(err);
            }
        }
    ));
}