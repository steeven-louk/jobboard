const { PrismaClient } = require("@prisma/client");
const { default: Stripe } = require("stripe");

const CheckoutPage =async(req, res)=>{

    const { jobData, offerId, amount } = await req.body;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const prisma = new PrismaClient();
    const userId = await req.user.id

    try {
        const user = await prisma.user.findUnique({where:{id:userId}});
        
        if(!user || user.role !== "RECRUITER"){
            return res.status(403).json({message:"Accès refusé"});
        }

        // Créer une session Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data:{
                        currency: "eur",
                        product_data: {name:`Publication ${offerId}`},
                        unit_amount: amount *100
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url:`${process.env.FRONTEND_URL}/jobs`,
            // success_url:`${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/jobs`,
            metadata: {userId: userId, jobData:JSON.stringify(jobData) },
        });

        // Stocker le paiement en base
        await prisma.payment.create({
            data:{
                userId,
                jobId:null,
                amount: amount,
                status: "PENDING",
                stripeSessionId: session.id
            },
        });
        return res.status(200).json({sessionId: session.id})
    } catch (error) {
        console.log("Erreur Stripe",error);
        return res.status(500).json({message:"Erreur serveur", error:error})
    }
}

module.exports = CheckoutPage;