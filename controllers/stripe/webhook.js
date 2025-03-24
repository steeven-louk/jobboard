const Stripe = require("stripe");
const {PrismaClient} = require("@prisma/client");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();
const enpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const Webhook = async(req,res)=>{
    const sig = req.headers["stripe-signature"];

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, enpointSecret);
    } catch (error) {
        return res.status(400).json({message:`Webhook Error:${error}`});
    }

    
    if (event.type === "checkout.session.completed"){
        const session = event.data.object;
        const userId = session.metadata.userId
        const jobData = JSON.parse(session.metadata.jobData);
   
        const user = await prisma.user.findUnique({
            where: {id:userId},
            include: {company:true},
        });

        if (!user) {
            console.error("❌ Erreur : Utilisateur introuvable avec ID", userId);
            return res.status(404).json({ message: "Utilisateur introuvable." });
          }
        
        const job = await prisma.job.create({
            data: {
              title: jobData.title,
              description: jobData.description,
              skill: jobData.skill,
              requirement: jobData.requirement,
              location: jobData.location,
              salary: parseInt(jobData.salary),
              duration: jobData.duration,
              jobType: jobData.jobType,
              expiration_date: new Date(jobData.expiration_date),
              isPublished: true,
              userId: user.id,
              companyId: user.company ? user.company.id : null,
            },
          });
// console.log("jobbb", job);
        // Associer le paiement à l'annonce
        await prisma.payment.updateMany({
            where: { stripeSessionId: session.id},
            data: { jobId: job.id, status:"COMPLETED" },
        });
    }
    return res.status(200).json({received: true});
}

module.exports = Webhook;