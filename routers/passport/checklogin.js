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
        let token = req.headers.authorization;
        if(token === undefined || token === null)
            return res.status(419).send("invalid token : error 419");

        // first value is innertext
        if(token.startsWith('Bearer')) {
            token = token.replace('Bearer ', '');
            if(token.startsWith('null')) {
                console.log('invalid token : null token');
                return res.status(419).send("invalid token : error 419");
            }
        }
        else
            return res.status(419).send("invalid token : error 419");

        // token parse
        const secret = process.env.JWT_SECRET;
        req.decoded = jwt.verify(token, secret);
        return next();
    }
    catch (err) {
        console.log(err);
        if(err.name === 'TokenExpiredError') { // 유효시간 초과
            console.log("expired token : error 419");
            return res.status(419).send({ expired : true, msg : "expired token : error 419" });
        }
        else {
            console.log(err);
            return res.status(419).send(err);
        }
    }
}