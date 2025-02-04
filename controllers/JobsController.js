const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient()

const getJobs =async(_,res) =>{
    const jobs = await prisma.job.findMany({
        orderBy: {
            createdAt: 'desc'
        }
    });
    return res.status(200).json({jobs:jobs});
}

const getJob =async(req,res) =>{
    const {id} = req.params
    try {
        const jobs = await prisma.job.findUnique({
            where: {id:parseInt(id)},
            include:{
                user:true
            }
        });
        if(!jobs){
            return res.status(404).json({message:"Erreur lors de la recuperation du job"});
        }
        return res.status(200).json({jobs:jobs});
    } catch (error) {
        console.log(error);
        res.status(500).json({error:error});
    }
}

const addJob = async(req,res)=>{
    const {title,
        description,
        location,
        salary,
        jobType,
        isPremium,
        } = req.body

    try {
        const createJob = await prisma.job.create({
            data:{
                title,
                description,
                location,
                salary,
                jobType,
                isPremium,
                userId:req.user.id
            }
        });
        return res.status(201).json({message:"l'annonce a été creer avec succes", createJob});
    } catch (error) {
        console.log(error)
        return res.status(500).json({erreur:"errer server"})
    }
}


const updateJob = async(req,res) => {
    const { id } = req.params;
    const {title,
        description,
        location,
        salary,
        jobType,
        isPremium,
        } = req.body

    try {
        const update = await prisma.job.update({
            where:{id:parseInt(id)},
            data:{
                title,
                description,
                location,
                salary,
                jobType,
                isPremium,
            }
        });
        return res.status(201).json({message:"l'annonce a été modifier avec succes", update});


    } catch (error) {
        console.log(error);
        return req.status(409).json(error);
    }
}

const deleteJobs = async(req,res)=>{
    const {id} = req.params;
    try {
        const job = await prisma.job.delete({
            where:{id:id}
        });
        await getJobs();
        return res.status(200).json({message:"le job a été supprimer avec succes",job});
    } catch (error) {
        console.log(error)
        return res.status(500).json({error:error});
    }
}


const addToFavorie = async (req, res) => {
    const { jobId } = req.params;

    if (!req.user) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
        if (!jobId) {
            return res.status(400).json({ message: "L'identifiant de l'offre d'emploi est requis." });
        }

        // Vérifier si l'offre est déjà en favoris
        const isExist = await prisma.favoris.findUnique({
            where: {
                userId_jobId: {
                    jobId: parseInt(jobId),
                    userId: req.user.id
                }
            }
        });

        if (isExist) {
            await prisma.favoris.delete({
                where: {
                    userId_jobId: {
                        jobId: parseInt(jobId),
                        userId: req.user.id
                    }
                }
            });
            return res.status(200).json({ message: "Offre supprimée des favoris" });
        }

        await prisma.favoris.create({
            data: {
                userId: req.user.id,
                jobId: parseInt(jobId),
            }
        });

        return res.status(201).json({ message: "Offre ajoutée aux favoris" });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
};


const getFavoris = async (req, res) => {
    // const { userId } = await req.params;
    if (!req.user) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
    }
    try {
        const isExist = await prisma.user.findUnique({
            where: {id: req.user.id}
        });

        if (!isExist) {
            return res.status(200).json({ message: "Utilisateur non authentifié"  });
        }
        const favoris = await prisma.favoris.findMany({
            where:{userId:req.user.id},
            include: {
                job: true,
            },
        });
        return res.status(200).json({favoris});
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

module.exports = {getJobs,getJob,addJob,updateJob,deleteJobs, addToFavorie, getFavoris};