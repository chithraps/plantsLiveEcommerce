const isLogin = async (req, res, next) => {
    try {
        if (req.session.userData) {
            next();

        } else {
            res.redirect('/login')
        }

    } catch (error) {
        console.log(error.message) 
    }
}

const isLogout = async (req, res, next) => {
    try {

        if (req.session.userData) {
            res.redirect('/home');
        } else {
            next();
        }

    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    isLogin,
    isLogout
}