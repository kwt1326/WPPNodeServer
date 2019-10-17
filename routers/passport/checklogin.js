const passport = require('passport');

exports.isLogined = (req, res, next) => {
    if(passport.authenticate ( 'jwt', {session : false })) {
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
    if(!passport.authenticate ( 'jwt', {session : false })) {
        next();
    }
    else {
        res.redirect('/');
    }
}