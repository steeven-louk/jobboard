const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getProfil =async(req,res)=>{
    try {
        if(!req.user || !req.user.id){
            return res.status(401).json({message:"Utilisateur non authentifié"});
        }
        const user = await prisma.user.findUnique({
            where: {id:req.user.id},
            include:{
                Experience:true,
                Diplome:true
            }
        });
        if(!user){
            return res.status(401).json({message:"Utilisateur non authentifié"});
        }
        return res.status(200).json({user:user});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"Erreur lors de la recupération du profil", error:error});
    }
}

module.exports= {getProfil}