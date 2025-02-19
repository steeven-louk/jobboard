const jwt = require('jsonwebtoken');
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
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

const verifyToken = async(req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Accès refusé, token manquant" });
    }

    try {
        const decoded = jwt.decode(token.split(" ")[1], process.env.JWT_SECRET);
        req.user = decoded; // Attache l'utilisateur à req.user

          // Si l'utilisateur est un recruteur, récupérer l'ID de sa company
    if (req.user.role === "RECRUITER") {
        const recruiter = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { company:{select:{id:true}}}, // Récupère uniquement l'ID de la company
        });
  
        if (recruiter) {
          req.user.companyId = recruiter.company.id;
        }
      }
  
        next();
    } catch (error) {
        return res.status(403).json({ message: "Token invalide" });
    }
};

// module.exports = verifyToken;


const verifyRole =(roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return res.status(403).json({error:'Non Authoriser'});
        }
        next();
    }
}

module.exports = {verifyRole, verifyToken}