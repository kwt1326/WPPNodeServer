//const passport = require('passport');
const jwt = require('jsonwebtoken');

exports.isLogined = (req, res, next) => {
    if(req.isAuthenticated()) {
        next();
    }
    else {
        // // custom path data save to session (failed login only)
        // if(!req.session["redirect"]) {
        //     req.session["redirect"] = (!req.query.redirect) ? '' : req.query.redirect;
        // }
        // // other option
        // if(!req.session["redirect-post"]) {
        //     req.session["redirect-post"] = (!req.query.repost) ? '' : req.query.repost;
        // }

        // req.session.save(function (err) {
        //     if(err) return next(err);
        // });     

        res.status(403).send('Not yet login');
    }
}

exports.isNotLogined = (req, res, next) => {
    if(!req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/');
    }
}

exports.verifyToken = (req, res, next) => {
    try {
        // first value is innertext
        let firstparse = req.headers.authorization.split('"');
        let token = "";
        firstparse.forEach(elem => {
            token = (token.length < elem.length) ? elem : token;
        });

        const secret = (process.env.NODE_ENV === "production") ? process.env.JWT_SECRET : "jwt_lo_secret";
        req.decoded = jwt.verify(token, secret);
        return next();
    }
    catch (err) {
        if(error.name === 'TokenExpiredError') { // 유효시간 초과
            console.log("expired token : error 419");
            return res.status(419).send("expired token : error 419");
        }
        else {
            console.log("invalid token : error 401");
            return res.status(401).send("invalid token : error 401");
        }
    }
}