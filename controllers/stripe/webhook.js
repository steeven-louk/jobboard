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
        return res.status(400).json({message:`Webhook Error:${err.message}`});
    }

    if (event.type === "checkout.session.completed"){
        const session = event.data.object;
        const jobData = JSON.parse(session.metadata.jobData);

        // Créer l'annonce et la publier
        const job = await prisma.job.create({
            data: {...jobData, isPublished: true},
        });

        // Associer le paiement à l'annonce
        await prisma.payment.updateMany({
            where: { stripeSessionId: session.id},
            data: { jobId: job.id, status:"COMPLETED" },
        });
    }
    return res.status(200).json({received: true});
}

module.exports = Webhook;