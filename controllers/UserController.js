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

const updateProfile =async(req, res)=>{
    const {email,phone,sexe,fullName,birthdate,domaine} =await req.body
    try {
        if(!req.user || !req.user.id){
            return res.status(401).json({message:"Utilisateur non authentifié"});
        }
        const updateUser = await prisma.user.update({
            where: {id:req.user.id},
            data:{
                email,
                phone,
                sexe,
                fullName,
                birthdate,
               domaine 
            }
        });
        // await getProfil();
        if(!updateUser){
            return res.status(401).json({message:"Utilisateur non authentifié"});
        }
        return res.status(200).json({message:"Profil mis à jour avec succes"});

    } catch (error) {
        console.log("Erreur lors de la modification du profile", error);
        res.status(500).json({message:"Erreur lors de la modification du profile", error:error});
    }
}

const updateExperience =async(req, res)=>{
    const {id} = await req.params;
    const {location,
        entreprise,
        title,
        contract,
        date,
        description,
        en_cours,
        competence} =await req.body;
    try {
        if(!req.user || !req.user.id){
            return res.status(401).json({message:"Utilisateur non authentifié"});
        }
         // Vérifier si l'expérience existe
         const existingExperience = await prisma.experience.findUnique({
            where: { id: Number(id) },
        });

        if (!existingExperience) {
            return res.status(404).json({ error: "Expérience non trouvée" });
        }

         // Mettre à jour l'expérience
         const updatedExperience = await prisma.experience.update({
            where: { id: Number(id) },
            data: {
                location,
                entreprise,
                title,
                contract,
                date,
                description,
                en_cours,
                competence, // Assure-toi d'envoyer une chaîne si c'est stocké en texte
            },
        });

        return res.status(200).json({ message: "Expérience mise à jour avec succès", updatedExperience });
    } catch (error) {
        console.log("Erreur lors de la modification de l'experience", error);
        return res.status(500).json({message:"Erreur lors de la modification du l'experience", error:error});
    }
}

const updateDiplome =async(req, res)=>{
    const {id} = await req.params;
    const {title,
        level,
        school,
        location,
        date,
        description,
        competence} =await req.body;
    try {
        if(!req.user || !req.user.id){
            return res.status(401).json({message:"Utilisateur non authentifié"});
        }
         // Vérifier si l'expérience existe
         const existingDiplome = await prisma.formation.findUnique({
            where: { id: Number(id) },
        });

        if (!existingDiplome) {
            return res.status(404).json({ error: "Diplome non trouvée" });
        }

         // Mettre à jour l'expérience
         const updatedDiplome = await prisma.formation.update({
            where: { id: Number(id) },
            data: {
                title,
                level,
                school,
                location,
                date,
                description,
                competence
            },
        });

        return res.status(200).json({ message: "Diplome mise à jour avec succès", updatedDiplome });
    } catch (error) {
        console.log("Erreur lors de la modification de diplome", error);
        return res.status(500).json({message:"Erreur lors de la modification du diplome", error:error});
    }
}

const addExperience =async(req,res)=>{
    const {location,
        entreprise,
        title,
        contract,
        date,
        description,
        en_cours,
        competence} =await req.body;
    try {
        if(!req.user || !req.user.id){
            return res.status(401).json({message:"Utilisateur non authentifié"});
        }

        if(!location || !entreprise || !title || !contract || !competence){
            return res.status(401).json({message:"Tout les champs sont requis"});
        }
        const addExperience = await prisma.experience.create({
            // where: { user: req.user.id },
            data: {
                userId:req.user.id,
                location,
                entreprise,
                title,
                contract,
                date,
                description,
                en_cours,
                competence, // Assure-toi d'envoyer une chaîne si c'est stocké en texte
            },
        });
        return res.status(200).json({ message: "Expérience ajouter avec succès", addExperience });

    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"Erreur lors de l'ajout de l'experience", error:error})
    }
}

module.exports= {getProfil, updateProfile, updateExperience, updateDiplome,addExperience}