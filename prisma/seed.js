import { PrismaClient, UserRole, Sexe, JobType, ApplicationStatus, SubscriptionPlan, SubscriptionStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Hash du mot de passe
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Création des utilisateurs
  const user1 = await prisma.user.upsert({
    where: { email: "user1@example.com" },
    update: {},
    create: {
      email: "user1@example.com",
      password: hashedPassword,
      fullName: "Jean Dupont",
      role: UserRole.USER,
      sexe: Sexe.Homme,
      phone: "0612345678",
      city: "Paris",
      domaine: "Informatique",
      picture: "https://via.placeholder.com/150",
      birthdate: new Date("1990-05-15")
    }
  });

  const user2 = await prisma.user.upsert({
    where: { email: "user2@example.com" },
    update: {},
    create: {
      email: "user2@example.com",
      password: hashedPassword,
      fullName: "Sophie Martin",
      role: UserRole.RECRUITER,
      sexe: Sexe.Femme,
      phone: "0678901234",
      city: "Lyon",
      domaine: "RH",
      picture: "https://via.placeholder.com/150",
      birthdate: new Date("1985-09-20")
    }
  });

  // Création d'expériences
  await prisma.experience.createMany({
    data: [
      {
        title: "Développeur Full Stack",
        entreprise: "TechCorp",
        location: "Paris",
        contract: JobType.CDI,
        date: "2020-01-01 - 2023-12-31",
        en_cours: false,
        description: "Développement d'applications web en React et Node.js",
        competence: "React, Node.js, TypeScript",
        userId: user1.id
      },
      {
        title: "Chef de projet RH",
        entreprise: "GreenHR",
        location: "Lyon",
        contract: JobType.FULL_TIME,
        date: "2018-06-01 - 2022-08-15",
        en_cours: false,
        description: "Gestion des recrutements et de la stratégie RH",
        competence: "Gestion de projet, Recrutement",
        userId: user2.id
      }
    ]
  });

  // Création de formations
  await prisma.formation.createMany({
    data: [
      {
        title: "Master en Informatique",
        level: "Master",
        school: "Université Paris Saclay",
        location: "Paris",
        date: "2015-09-01 - 2020-06-30",
        description: "Spécialisation en développement logiciel et IA",
        competence: "Programmation, Machine Learning",
        userId: user1.id
      },
      {
        title: "Licence en Gestion RH",
        level: "Licence",
        school: "Université Lyon 3",
        location: "Lyon",
        date: "2012-09-01 - 2015-06-30",
        description: "Formation en gestion des ressources humaines",
        competence: "RH, Management",
        userId: user2.id
      }
    ]
  });

  // Création d'offres d'emploi
  const job1 = await prisma.job.create({
    data: {
      title: "Développeur Front-End",
      description: "Recherche d'un développeur React avec 3 ans d'expérience",
      skill: "React, TypeScript",
      requirement: "Expérience avec Next.js est un plus",
      location: "Paris",
      salary: 45000,
      duration: "CDI",
      jobType: JobType.CDI,
      isPremium: true,
      userId: user2.id,
      expiration_date: new Date("2025-06-30")
    }
  });

  // Création de candidatures
  await prisma.application.create({
    data: {
      userId: user1.id,
      jobId: job1.id,
      coverLetter: "Je suis passionné par le développement front-end et souhaite postuler.",
      cv_url: "https://example.com/cv.pdf",
      status: ApplicationStatus.PENDING
    }
  })
}


main()
  .catch((e) => {
    console.error("Error while seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });