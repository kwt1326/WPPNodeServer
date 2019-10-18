// passport strategis
const passport_local = require('passport-local').Strategy;
const passport_jwt = require('passport-jwt').Strategy;
const passport_ext = require('passport-jwt').ExtractJwt;
const passport_facebook = require('passport-facebook').Strategy;
const passport_google = require('passport-google').Strategy;

// crypt
const bcrypt = require('bcrypt-nodejs');

// DB table
const db_user = require('../../models/index').user;

module.exports = (passport) => {

    // session serialize
    passport.serializeUser(function (user, done) {
        console.log('passport session save : ', user.id);
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        console.log('passport session get id : ', id);
        db_user.findOne({ where: id })
            .then(find_user => done(null, find_user))
            .catch(err => done(err));
    });

    // Auth jwt token
    passport.use(new passport_jwt({
            jwtFromRequest: passport_ext.fromAuthHeaderAsBearerToken(),
            secretOrKey   : (process.env.NODE_ENV === "production") ? process.env.JWT_SECRET : 'jwt_lo_secret',
            issuer : (process.env.NODE_ENV === "production") ? process.env.CLIENT_PATH : 'http://localhost:3000',
            audience : (process.env.NODE_ENV === "production") ? process.env.API_PATH : 'http://localhost:3500',
        },
        function (user, callback) {
            //console.log("PAYLOAD : " + user);
            return db_user.findOne({where : {id : user.id}})
                .then(find_user => {
                    return callback(null, find_user);
                })
                .catch(err => {
                    return callback(err);
                });
        }
    ));

    // login-local
    passport.use(new passport_local({
        usernameField: 'email',     // input = email
        passwordField: 'password',  // input = password
        passReqToCallback: true,
    },
        async (req, email, password, callback) => {
            try {
                console.log("login Check Start!");
                const exist_user = await db_user.findOne({
                    where: { email },
                });
                if (exist_user) {
                    const result = await bcrypt.compareSync(password, exist_user.password);
                    if (result) {
                        console.log('Success login');
                        return callback(null, exist_user);
                    }
                    else {
                        console.log('Not Compare Password');
                        return callback(null, false, { message: "Not Compare Password" });
                    }
                }
                else {
                    console.log('Not exist User');
                    return callback(null, false, { message: "Not exist User" });
                }
            } catch (err) {
                console.log(err);
                return callback(err);
            }
        }
    ));

    // login-facebook
    passport.use('facebook-login', new passport_facebook({
        clientID: "FACEBOOK CLIENT ID",
        clientSecret: "FACEBOOK SECRET",
        callbackURL: "CALLBACK URL"
    },

        async (accessToken, refreshToken, profile, done) => {
            //User.findOrCreate(..., function(err, user) {
            //  if (err) { return done(err); }
            //  done(null, user);
            //});
        }
    ));    
}