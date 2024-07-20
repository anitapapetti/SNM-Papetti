require("dotenv").config();
const jwt = require('jsonwebtoken');


exports.authorize = (req, res, next) => {
  const token = req.cookies.access_token;
  
  if (!token) {
    console.log("No token!");
    return res.redirect(302, "/login");
  }
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    console.log("Token ok.");
    
    req.id = data.id;
    return next();
  } catch {
    console.log("Token not ok");
    res.clearCookie("access_token");
    return res.redirect(302, "/login");
  }
};