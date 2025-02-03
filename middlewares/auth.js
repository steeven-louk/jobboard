const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// const verifyToken =async(req,res,next)=>{
//     const token = req.headers['authorization'];

//     if(!token) return res.status(403).json({error:'Acces refuser'});

//     try {
//         const decode = await jwt.decode(token.split(' ')[1], JWT_SECRET);
//         req.user =decode;
//         next();
//     } catch (error) {
//         console.log(error);
//         res.status(401).json({error:'token non valide'});
//     }
// }
// const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Accès refusé, token manquant" });
    }

    try {
        const decoded = jwt.decode(token.split(" ")[1], process.env.JWT_SECRET);
        req.user = decoded; // Attache l'utilisateur à req.user
        next();
    } catch (error) {
        return res.status(403).json({ message: "Token invalide" });
    }
};

module.exports = verifyToken;


const verifyRole =(roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return res.status(403).json({error:'Non Authoriser'});
        }
        next();
    }
}

module.exports = {verifyRole, verifyToken}