import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const IMG = {
  svaneti: "https://images.unsplash.com/photo-1605647540924-9fc698876a7a?w=1200&q=80",
  tbilisi: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80",
  kazbegi: "https://images.unsplash.com/photo-1518548419970-4476bbf09b03?w=1200&q=80",
  batumi: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&q=80",
  kakheti: "https://images.unsplash.com/photo-1506377247377-2ccd5a1b6b4a?w=1200&q=80",
  kutaisi: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=1200&q=80",
  borjomi: "https://images.unsplash.com/photo-1441974231530-c3167bd88e37?w=1200&q=80",
  ushguli: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
  mtskheta: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=80",
  vardzia: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
  blog1: "https://images.unsplash.com/photo-1609137144816-9d0f7e4a5f1d?w=1200&q=80",
  blog2: "https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80",
  blog3: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80",
};

const DESTINATIONS: Array<{
  title: string;
  subtitle: string;
  imageKey: keyof typeof IMG;
  price: number;
  isTrending: boolean;
  sortOrder: number;
}> = [
  { title: "Svaneti", subtitle: "Medieval towers and alpine peaks", imageKey: "svaneti", price: 450, isTrending: true, sortOrder: 1 },
  { title: "Tbilisi", subtitle: "Old town charm and sulfur baths", imageKey: "tbilisi", price: 280, isTrending: true, sortOrder: 2 },
  { title: "Kazbegi", subtitle: "Gergeti Trinity Church at 5,000m", imageKey: "kazbegi", price: 320, isTrending: false, sortOrder: 3 },
  { title: "Batumi", subtitle: "Black Sea coast and botanical gardens", imageKey: "batumi", price: 350, isTrending: true, sortOrder: 4 },
  { title: "Kakheti", subtitle: "Wine country and ancient monasteries", imageKey: "kakheti", price: 290, isTrending: false, sortOrder: 5 },
  { title: "Kutaisi", subtitle: "Bagrati Cathedral and Prometheus Cave", imageKey: "kutaisi", price: 260, isTrending: false, sortOrder: 6 },
  { title: "Borjomi", subtitle: "Mineral springs and national park", imageKey: "borjomi", price: 240, isTrending: false, sortOrder: 7 },
  { title: "Ushguli", subtitle: "Europe's highest permanently inhabited village", imageKey: "ushguli", price: 480, isTrending: true, sortOrder: 8 },
  { title: "Mtskheta", subtitle: "UNESCO heritage and ancient capital", imageKey: "mtskheta", price: 180, isTrending: false, sortOrder: 9 },
  { title: "Vardzia", subtitle: "Cave city carved into the cliff", imageKey: "vardzia", price: 310, isTrending: false, sortOrder: 10 },
];

async function main() {
  const georgia = await prisma.country.findFirst({ where: { code: "GE" } });
  if (!georgia) {
    console.error("Georgia country not found — run db:seed first");
    process.exit(1);
  }

  const existingDests = await prisma.featuredDestination.findMany();
  for (const dest of existingDests) {
    const match = DESTINATIONS.find((d) => d.title === dest.title);
    if (match) {
      await prisma.featuredDestination.update({
        where: { id: dest.id },
        data: {
          imageUrl: IMG[match.imageKey],
          subtitle: match.subtitle,
          price: match.price,
          isTrending: match.isTrending,
          sortOrder: match.sortOrder,
          isPublished: true,
        },
      });
    }
  }

  if (existingDests.length === 0) {
    for (const d of DESTINATIONS) {
      await prisma.featuredDestination.create({
        data: {
          title: d.title,
          subtitle: d.subtitle,
          imageUrl: IMG[d.imageKey],
          price: d.price,
          currency: "USD",
          isTrending: d.isTrending,
          sortOrder: d.sortOrder,
          isPublished: true,
        },
      });
    }
  }

  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "asc" } });
  const blogImages = [IMG.blog1, IMG.blog2, IMG.blog3, IMG.kazbegi, IMG.tbilisi, IMG.svaneti, IMG.batumi, IMG.kakheti, IMG.borjomi, IMG.vardzia];
  for (let i = 0; i < posts.length; i++) {
    const daysAgo = (posts.length - i) * 7;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    await prisma.blogPost.update({
      where: { id: posts[i].id },
      data: {
        imageUrl: blogImages[i % blogImages.length],
        createdAt,
        isPublished: true,
      },
    });
  }

  const packages = [
    {
      name: "Tbilisi City Break",
      slug: "tbilisi-city-break",
      description: "3 days exploring old town, sulfur baths, and local cuisine.",
      city: "Tbilisi",
      price: 299,
      durationDays: 3,
      highlights: "Old Tbilisi, Narikala, sulfur baths, wine tasting",
    },
    {
      name: "Kazbegi Mountain Escape",
      slug: "kazbegi-mountain-escape",
      description: "Day trip to Gergeti Trinity Church with stunning Caucasus views.",
      city: "Kazbegi",
      price: 189,
      durationDays: 2,
      highlights: "Gergeti Church, Gudauri, Ananuri fortress",
    },
    {
      name: "Kakheti Wine Tour",
      slug: "kakheti-wine-tour",
      description: "Visit vineyards and taste qvevri wines in Georgia's wine region.",
      city: "Kakheti",
      price: 249,
      durationDays: 2,
      highlights: "Sighnaghi, qvevri wine, local feast",
    },
    {
      name: "Svaneti Adventure",
      slug: "svaneti-adventure",
      description: "Medieval towers, alpine hikes, and UNESCO villages.",
      city: "Mestia",
      price: 549,
      durationDays: 5,
      highlights: "Ushguli, Mestia towers, hiking trails",
    },
    {
      name: "Batumi Seaside Retreat",
      slug: "batumi-seaside-retreat",
      description: "Black Sea beaches, botanical garden, and modern architecture.",
      city: "Batumi",
      price: 329,
      durationDays: 4,
      highlights: "Boulevard, botanical garden, cable car",
    },
  ];

  for (const pkg of packages) {
    await prisma.travelPackage.upsert({
      where: { slug: pkg.slug },
      create: { ...pkg, countryId: georgia.id, isPublished: true, sortOrder: packages.indexOf(pkg) },
      update: { ...pkg, countryId: georgia.id, isPublished: true },
    });
  }

  const routes = [
    {
      name: "Classic Tbilisi Walk",
      slug: "classic-tbilisi-walk",
      city: "Tbilisi",
      description: "Half-day walking tour through old town landmarks.",
      transport: "walk",
      timeLimit: "4h",
      interests: '["history","food"]',
    },
    {
      name: "Kazbegi Day Trip",
      slug: "kazbegi-day-trip",
      city: "Kazbegi",
      description: "Scenic drive along the Georgian Military Highway.",
      transport: "car",
      timeLimit: "1day",
      interests: '["nature","history"]',
    },
    {
      name: "Wine & Culture Kakheti",
      slug: "wine-culture-kakheti",
      city: "Kakheti",
      description: "Wine tasting and monastery visits in eastern Georgia.",
      transport: "car",
      timeLimit: "1day",
      interests: '["food","culture"]',
    },
    {
      name: "Batumi Coastal Route",
      slug: "batumi-coastal-route",
      city: "Batumi",
      description: "Seaside promenade and subtropical gardens.",
      transport: "walk",
      timeLimit: "4h",
      interests: '["nature","mixed"]',
    },
  ];

  for (const route of routes) {
    await prisma.routeTemplate.upsert({
      where: { slug: route.slug },
      create: { ...route, countryId: georgia.id, isPublished: true },
      update: { ...route, countryId: georgia.id, isPublished: true },
    });
  }

  console.log("Content fix complete:", {
    destinations: await prisma.featuredDestination.count(),
    blogPosts: await prisma.blogPost.count(),
    packages: await prisma.travelPackage.count({ where: { isPublished: true } }),
    routes: await prisma.routeTemplate.count({ where: { isPublished: true } }),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
