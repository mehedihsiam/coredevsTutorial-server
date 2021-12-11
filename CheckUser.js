const CheckUser = (req, res, next) => {
    const { authorization } = req.headers;
    try {
        const token = authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SIGN_CODE)
        const { userId, email } = decoded;
        req.email = email;
        req.userId = userId;
        next();
    } catch {
        next("Authentication Failed")
    }
}

module.exports = CheckUser;