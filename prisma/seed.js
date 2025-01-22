const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Hash des mots de passe pour les utilisateurs
  const passwordHash = await bcrypt.hash('password123', 10);

  // Création des utilisateurs
//   const users = await prisma.user.createMany({
//     data: [
//       { fullName: 'Admin User', email: 'admin@example.com', password: passwordHash, role: 'ADMIN' },
//       { fullName: 'Recruiter Tech', email: 'techrecruiter@example.com', password: passwordHash, role: 'RECRUITER' },
//       { fullName: 'Recruiter Marketing', email: 'markrecruiter@example.com', password: passwordHash, role: 'RECRUITER' },
//       { fullName: 'Regular User', email: 'user@example.com', password: passwordHash, role: 'USER' }
//     ],
//     // skipDuplicates: true,
//   });

  console.log(`Users created successfully!`);

  // Création des offres d'emploi
  await prisma.job.createMany({
    data: [
      {
        title: 'Développeur Full Stack',
        description: 'Nous recherchons un développeur expérimenté en React et Node.js.',
        location: 'Paris',
        salary: 50000,
        jobType: 'CDI',
        isPremium: false,
        userId: 2,
      },
      {
        title: 'UX/UI Designer',
        description: 'Expérience en conception d\'interfaces utilisateur et Adobe XD.',
        location: 'Lyon',
        salary: 40000,
        jobType: 'CDI',
        isPremium: true,
        userId: 3,
      },
      {
        title: 'Chef de projet IT',
        description: 'Gestion de projet agile, coordination des équipes techniques.',
        location: 'Marseille',
        salary: 55000,
        jobType: 'CDI',
        isPremium: true,
        userId: 2,
      },
      {
        title: 'Data Scientist',
        description: 'Expertise en Machine Learning et manipulation de données massives.',
        location: 'Toulouse',
        salary: 60000,
        jobType: 'CDI',
        isPremium: false,
        userId: 2,
      },
      {
        title: 'Consultant SEO',
        description: 'Optimisation du référencement web, analyse de performance SEO.',
        location: 'Bordeaux',
        salary: 45000,
        jobType: 'FREELANCE',
        isPremium: false,
        userId: 3,
      },
      {
        title: 'Marketing Digital',
        description: 'Stratégie de contenu, campagnes publicitaires et analyse de marché.',
        location: 'Nantes',
        salary: 48000,
        jobType: 'CDI',
        isPremium: true,
        userId: 3,
      },
      {
        title: 'Administrateur Système',
        description: 'Gestion des serveurs, cybersécurité et maintenance des infrastructures.',
        location: 'Strasbourg',
        salary: 52000,
        jobType: 'CDI',
        isPremium: false,
        userId: 2,
      },
      {
        title: 'Développeur Mobile Flutter',
        description: 'Création d\'applications mobiles sous Flutter et Dart.',
        location: 'Lille',
        salary: 47000,
        jobType: 'CDI',
        isPremium: false,
        userId: 2,
      },
      {
        title: 'Community Manager',
        description: 'Gestion des réseaux sociaux, engagement et contenu créatif.',
        location: 'Nice',
        salary: 40000,
        jobType: 'FREELANCE',
        isPremium: true,
        userId: 3,
      },
      {
        title: 'Technicien Réseau',
        description: 'Installation, maintenance et surveillance des réseaux d\'entreprise.',
        location: 'Rennes',
        salary: 43000,
        jobType: 'CDI',
        isPremium: false,
        userId: 2,
      }
    ],
  });

  console.log('Jobs seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
