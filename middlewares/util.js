exports.verifyPassword = (pw) => {
    const kr_pat_include = /[가-힣]/;
    const pw_pat1 = /[a-zA-Z]/;
    const pw_pat2 = /[0-9]/;
    const pw_pat3 = /[!@#$%^&*()]/;

    if(pw_pat1.test(pw) && pw_pat2.test(pw) && pw_pat3.test(pw) && !kr_pat_include.test(pw) &&
        (pw.length >= 6 && pw.length <= 14 )) {
            return true;
        }
    else {
        return false;
    }
} 