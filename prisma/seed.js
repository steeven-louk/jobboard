import { PrismaClient, Sexe, UserRole, JobType, ApplicationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Début du seed...");

  // 🧑‍💻 Création des utilisateurs (5 candidats et 2 recruteurs)
  // const users = await prisma.user.createMany({
  //   data: [
  //     { email: "john.doe@example.com", password: "hashedpassword", fullName: "John Doe", role: UserRole.USER, sexe: Sexe.Homme, phone: "0612345678", city: "Paris" },
  //     { email: "alice.dupont@example.com", password: "hashedpassword", fullName: "Alice Dupont", role: UserRole.RECRUITER, sexe: Sexe.Femme, phone: "0711223344", city: "Lyon" },
  //     { email: "bob.martin@example.com", password: "hashedpassword", fullName: "Bob Martin", role: UserRole.USER, sexe: Sexe.Homme, phone: "0655667788", city: "Marseille" },
  //     { email: "claire.lemoine@example.com", password: "hashedpassword", fullName: "Claire Lemoine", role: UserRole.USER, sexe: Sexe.Femme, phone: "0666778899", city: "Bordeaux" },
  //     { email: "david.nolan@example.com", password: "hashedpassword", fullName: "David Nolan", role: UserRole.USER, sexe: Sexe.Homme, phone: "0633445566", city: "Toulouse" },
  //     { email: "sophie.marchand@example.com", password: "hashedpassword", fullName: "Sophie Marchand", role: UserRole.USER, sexe: Sexe.Femme, phone: "0644332211", city: "Nice" },
  //     { email: "mike.robert@example.com", password: "hashedpassword", fullName: "Mike Robert", role: UserRole.RECRUITER, sexe: Sexe.Homme, phone: "0699887766", city: "Nantes" },
  //   ],
  // });

  const userList = await prisma.user.findMany();
  const recruiters = userList.filter(user => user.role === UserRole.RECRUITER);
  const candidates = userList.filter(user => user.role === UserRole.USER);

  // 🏢 Ajout des entreprises
  // const companies = await prisma.company.createMany({
  //   data: [
  //     { name: "TechCorp", description: "Entreprise en IA", location: "Paris", domaine: "Technologie", userId: recruiters[0].id },
  //     { name: "WebSolutions", description: "Agence web", location: "Lyon", domaine: "Développement Web", userId: recruiters[1].id },
  //   ],
  // });

  const companyList = await prisma.company.findMany();

  // 💼 Ajout des offres d'emploi
  // const jobs = await prisma.job.createMany({
  //   data: [
  //     { title: "Développeur Full Stack", description: "React et Node.js", location: "Télétravail",skill:"lorem ipsun",requirement:"requirement ipsun", salary: 45000, jobType: JobType.CDI, expiration_date: new Date("2025-06-30"), companyId: companyList[0].id, userId: recruiters[0].id },
  //     { title: "Data Analyst", description: "Analyse de données", location: "Paris",skill:"lorem, ipsun",requirement:"requirement ipsun", salary: 55000, jobType: JobType.CDD, expiration_date: new Date("2025-06-30"), companyId: companyList[0].id, userId: recruiters[0].id },
  //     { title: "DevOps Engineer", description: "Cloud & CI/CD", location: "Lyon",skill:"lorem, ipsun",requirement:"requirement ipsun", salary: 60000,duration:"5", jobType: JobType.CDI, expiration_date: new Date("2025-06-30"), companyId: companyList[1].id, userId: recruiters[1].id },
  //     { title: "UI/UX Designer", description: "Design produit", skill: "Figma, Adobe XD", requirement: "2 ans d'expérience", location: "Bordeaux", salary: 40000, jobType: JobType.CDI, expiration_date: new Date("2025-06-30"), companyId: companyList[1].id, userId: recruiters[1].id },
  //     { title: "Backend Developer", description: "API et bases de données", skill: "Node.js, Prisma, PostgreSQL", requirement: "2 ans d'expérience", location: "Toulouse", salary: 50000, jobType: JobType.CDI, expiration_date: new Date("2025-06-30"), companyId: companyList[0].id, userId: recruiters[0].id },
  //     { title: "Frontend Developer", description: "React et TypeScript", skill: "React, TypeScript, TailwindCSS", requirement: "1 an d'expérience", location: "Nice", salary: 42000, jobType: JobType.CDI, expiration_date: new Date("2025-06-30"), companyId: companyList[1].id, userId: recruiters[1].id },
  //     { title: "Product Manager", description: "Gestion de projet Agile", skill: "Scrum, Kanban", requirement: "5 ans d'expérience", location: "Télétravail", salary: 70000, jobType: JobType.CDI, expiration_date: new Date("2025-06-30"), companyId: companyList[0].id, userId: recruiters[0].id },
  //     { title: "Cybersecurity Engineer", description: "Sécurité des SI", skill: "Pentesting, OWASP", requirement: "4 ans d'expérience", location: "Paris", salary: 65000, jobType: JobType.CDI, expiration_date: new Date("2025-06-30"), companyId: companyList[1].id, userId: recruiters[1].id },
  //     { title: "Marketing Digital", description: "SEO et publicité", skill: "Google Ads, Facebook Ads", requirement: "3 ans d'expérience", location: "Marseille", salary: 50000, jobType: JobType.CDI, expiration_date: new Date("2025-06-30"), companyId: companyList[0].id, userId: recruiters[0].id },
  //     { title: "Support IT", description: "Assistance technique", skill: "Windows, Linux, Réseaux", requirement: "1 an d'expérience", location: "Lyon", salary: 35000, jobType: JobType.CDI, expiration_date: new Date("2025-06-30"), companyId: companyList[1].id, userId: recruiters[1].id },
  //   ],
  // });

  const jobList = await prisma.job.findMany();

  // 📄 Ajout des candidatures (applications)
  // const applications = await prisma.application.createMany({
  //   data: [
  //     { userId: candidates[0].id, jobId: jobList[0].id, status: ApplicationStatus.PENDING,coverLetter: "Je suis très motivé par ce poste...",cv_url: "https://example.com/john-do3-cv.pdf", },
  //     { userId: candidates[1].id, jobId: jobList[1].id, status: ApplicationStatus.ACCEPTED,cv_url: "https://example.com/john-doe2-cv.pdf", },
  //     { userId: candidates[2].id, jobId: jobList[2].id, status: ApplicationStatus.REJECTED,
  //     coverLetter: "Je suis très motivé par ce poste...",
  //     cv_url: "https://example.com/john-doe-cv.pdf", },
  //   ]
  // });

  // ⭐ Ajout des favoris (jobs sauvegardés)
  // const favorites = await prisma.favoris.createMany({
  //   data: [
  //     { userId: candidates[0].id, jobId: jobList[0].id },
  //     { userId: candidates[1].id, jobId: jobList[1].id },
  //     { userId: candidates[2].id, jobId: jobList[2].id },
  //   ],
  // });

  // 🎓 Ajout des formations
  const formations = await prisma.formation.createMany({
    data: [
      { userId: candidates[0].id, school: "Université Paris-Saclay", title: "Master en Informatique",location: "Paris",
      date: "2024-2025",
      description: "Spécialisation en développement web et data science.",
      competence: "Python, JavaScript, SQL", level:"Licence 2" },

      { userId: candidates[1].id, school: "Ecole Polytechnique", title: "Ingénieur en IA", date: "2022",location: "Paris",
      description: "Spécialisation en développement web et data science.",
      competence: "Python, PHP, SQL", level:"Licence 3" },

      { userId: candidates[2].id, school: "HEC Paris", title: "MBA en Business Analytics", level: "Bac+5",
      location: "Paris",
      date: "2015-2020",
      description: "Spécialisation en développement web et data science.",
      competence: "Python, JavaScript, SQL",},
    ],
  });

  // 🏆 Ajout des expériences professionnelles
  const experiences = await prisma.experience.createMany({
    data: [
      { userId: candidates[0].id, title: "Développeur Frontend", entreprise: "Google",contract: "CDI", location: "Dakar",
        contract: "CDI",
        date: "2022-",
        en_cours: true,
        description: "Développement d'interfaces utilisateur avec React.",
        competence: "React, TypeScript, TailwindCSS",},
      { userId: candidates[1].id, title: "Data Analyst", entreprise: "Amazon",contract: "STAGE",location: "Paris",
        date: "2020-2023",
        en_cours: false,
        description: "Développement d'interfaces utilisateur avec React.",
        competence: "React, TypeScript, TailwindCSS, NextJs", },

      { userId: candidates[2].id, title: "Chef de projet",contract: "CDD", entreprise: "Microsoft",location: "Marseille",
        date: "2021-2023",
        en_cours: false,
        description: "Développement d'interfaces utilisateur avec React.",
        competence: "React, TypeScript, TailwindCSS"},
      {
        title: "Développeur Frontend",
        entreprise: "WebAgency",
        location: "Marseille",
        contract: "CDI",
        date: "2021-2023",
        en_cours: false,
        description: "Développement d'interfaces utilisateur avec React.",
        competence: "React, TypeScript, TailwindCSS",
        userId: candidates[1].id,
      },
    ],
  });

  console.log("✅ Seed terminé !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
