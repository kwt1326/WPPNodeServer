// passport strategis
const localStrategy = require('passport-local').Strategy;
const jwtStrategy = require('passport-jwt').Strategy;
const extStrategy = require('passport-jwt').ExtractJwt;
const facebookStrategy = require('passport-facebook').Strategy;
const googleStrategy = require('passport-google-oauth20').Strategy;

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
    passport.use(new jwtStrategy({
            jwtFromRequest: extStrategy.fromAuthHeaderAsBearerToken(),
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
    passport.use(new localStrategy({
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
                    // if not local, forced cancel login
                    if(exist_user.provider !== 'local') {
                        console.log("Can't login for this account");
                        return callback(null, false, { message: "Can't login for this account" });
                    }

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
    passport.use(new facebookStrategy({
        clientID: process.env.FACEBOOK_ID,
        clientSecret: process.env.FACEBOOK_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK,
        profileFields: ['id', 'displayName', 'photos', 'email']
    },
        // 로그인 기능만 사용시 accessToken, refreshToken 사용 불필요
        async (accessToken, refreshToken, profile, callback) => {
            try {
                const email = (profile.email) ? profile.email : profile.id + "@facebook.com.fakemail";
                const snsID = profile.id;
                const provider = "facebook";
                const nickname = (profile.displayName) ? profile.displayName : "Facebook-" + profile.id;
                const username = nickname;
                const profileimg = profile.photos[0].value;
    
                await db_user.findOrCreate({ where: { email : email }, 
                    defaults: {
                        nickname, 
                        username,
                        provider, 
                        snsID, 
                        profileimg 
                    }})
                  .spread((find_user, created) => {
                    callback(null, find_user);
                    console.log(created)
                  })
            }
            catch (err) {
                console.log(err);
            }
        }
    ));    

    // login-google oauth20
    passport.use(new googleStrategy({
        clientID: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK,
        profileFields: ['id', 'displayName', 'photos', 'email']
    },
        async (accessToken, refreshToken, profile, callback) => {
            try {
                const email = (profile.email) ? profile.email : profile.id + "@google.com.fakemail";
                const snsID = profile.id;
                const provider = "google";
                const nickname = (profile.displayName) ? profile.displayName : "google-" + profile.id;
                const username = nickname;
                const profileimg = profile.photos[0].value;
    
                await db_user.findOrCreate({ where: { email : email }, 
                    defaults: {
                        nickname, 
                        username,
                        provider, 
                        snsID, 
                        profileimg 
                    }})
                  .spread((find_user, created) => {
                    callback(null, find_user);
                    console.log(created)
                  })
            }
            catch (err) {
                console.log(err);
            }
        }
    ));        
}