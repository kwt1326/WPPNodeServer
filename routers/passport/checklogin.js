const jwt = require('jsonwebtoken');

exports.islogged = (req, res, next) => {
    if(res.isAuthenticated()) {
        return next();
    }
    // if(req.session.passport.user !== undefined || req.session.passport.user !== null) {
    //     return next();
    // }
    else {
        return res.status(419).send();
    }
}

exports.isNotlogged = (req, res, next) => {
    if(res.isUnauthenticated()) {
        return next();
    }
    else {
        return res.status(419).send();
    }
}

// session cookie login check
exports.verifyToken = (req, res, next) => {
    try {
        const id = req.session.userdata;
        if(id !== undefined && id !== null) {
            req.decoded = { id : id };
            return next();
        }
        else {
            if(req.session.jwttoken === undefined || req.session.jwttoken === null)
                return res.status(419).send("Not exist token : error 419");

            // first value is innertext
            let firstparse = req.session.jwttoken.split('"');
            let token = "";
            firstparse.forEach(elem => {
                token = (token.length < elem.length) ? elem : token;
            });

            const secret = (process.env.NODE_ENV === "production") ? process.env.JWT_SECRET : "jwt_lo_secret";
            req.decoded = jwt.verify(token, secret);
            return next();
        }
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