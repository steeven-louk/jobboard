const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


const getAllApplication = async (req, res) => {
    try {
        // Vérification que l'utilisateur est authentifié
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Utilisateur non authentifié" });
        }

        // Vérifier si l'utilisateur existe dans la base de données
        const existingUser = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!existingUser) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Récupérer les applications de l'utilisateur
        const applications = await prisma.application.findMany({
            where: { userId: existingUser.id },
            include: {
                job: true,  // Inclure les détails de l'offre d'emploi
                user: {      // Inclure les détails de l'utilisateur
                    select: {
                        fullName: true,
                        email: true,
                        sexe: true,
                        phone: true,
                        city:true
                    }
                }
            }
        });

        return res.status(200).json({ applications });
    } catch (error) {
        console.error("Erreur lors de la récupération des applications :", error);
        return res.status(500).json({ message: "Erreur lors de la récupération des applications", error: error.message });
    }
};



const sumbitApplication = async(req,res)=>{
    const {jobId} = req.params;
    const {coverLetter,cv_url} = req.body


    try {
        if (!jobId) {
            return res.status(400).json({ message: "L'identifiant de l'offre d'emploi est requis." });
        }

        // Vérifier si les champs requis sont bien fournis
        if (!coverLetter || !cv_url) {
            return res.status(400).json({ message: "Tous les champs sont requis." });
        }

        // Vérifier si l'utilisateur a déjà postulé
        const isExist = await prisma.application.findUnique({
            where: {
                userId_jobId:{jobId:parseInt(jobId), userId:1}     
            },
        });

        if (isExist) {
            return res.status(200).json({ message: "Vous avez déjà postulé à cette offre." });
        }
        const applyJob = await prisma.application.create({
            data:{
                userId:req.user.id,
                jobId:parseInt(jobId),
                coverLetter,
                cv_url
            }
        });
        return res.status(201).json({
            message: "Votre candidature a été envoyée avec succès.",
            applyJob,
        });
    } catch (error) {
        console.error("Erreur lors de l'envoi de la candidature :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
}

module.exports = { sumbitApplication,getAllApplication };