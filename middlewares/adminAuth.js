const isLogin = async (req, res, next) => {
    try {
        if (req.session.data) {
            next();

        } else {
            res.redirect('/admin')
        }

    } catch (error) {
        console.log(error.message) 
    }
}

const isLogout = async (req, res, next) => {
    try {

        if (req.session.data) {
            res.redirect('/admin/adminHome');
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