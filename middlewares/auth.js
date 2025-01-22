const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken =async(req,res,next)=>{
    const token = req.headers['Authorization'];

    if(!token) return res.status(403).json({error:'Acces refuser'});

    try {
        const decode = await jwt.decode(token.split(' ')[1], JWT_SECRET);
        req.user =decode;
        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({error:'token non valide'});
    }
}


const verifyRole =(roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return res.status(403).json({error:'Non Authoriser'});
        }
        next();
    }
}

module.exports = {verifyRole, verifyToken}