const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient()

const getJobs =async(_,res) =>{
    const jobs = await prisma.job.findMany({});
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
    }
}

module.exports = {getJobs,getJob,addJob,updateJob,deleteJobs};