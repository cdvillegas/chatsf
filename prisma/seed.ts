import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fetch real SF neighborhood boundaries from DataSF
async function fetchSFNeighborhoods() {
  const response = await fetch('https://data.sfgov.org/resource/p5b7-5n3h.json?$limit=100');
  const data = await response.json();
  
  return data.map((item: any) => ({
    name: item.nhood,
    slug: item.nhood.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    boundary: item.the_geom, // GeoJSON geometry
    metadata: {
      description: `${item.nhood} is a neighborhood in San Francisco.`,
    }
  }));
}

// Fallback neighborhoods if API fails
const fallbackNeighborhoods = [
  {
    name: 'Mission District',
    slug: 'mission-district',
    boundary: {
      type: 'Point',
      coordinates: [-122.4194, 37.7599]
    },
    metadata: {
      description: 'Vibrant cultural hub with diverse dining, street art, and nightlife',
      aliases: ['The Mission', 'La Misión']
    }
  },
  {
    name: 'Castro',
    slug: 'castro',
    boundary: {
      type: 'Point',
      coordinates: [-122.4352, 37.7609]
    },
    metadata: {
      description: 'Historic LGBTQ+ neighborhood with iconic theaters and shops',
      aliases: ['The Castro', 'Eureka Valley']
    }
  },
  {
    name: 'North Beach',
    slug: 'north-beach',
    boundary: {
      type: 'Point',
      coordinates: [-122.4103, 37.8006]
    },
    metadata: {
      description: "San Francisco's Little Italy with Italian restaurants and cafes",
      aliases: ['Little Italy']
    }
  },
  {
    name: 'Haight-Ashbury',
    slug: 'haight-ashbury',
    boundary: {
      type: 'Point',
      coordinates: [-122.4467, 37.7692]
    },
    metadata: {
      description: 'Historic counterculture district with vintage shops and Victorian homes',
      aliases: ['The Haight', 'Upper Haight']
    }
  },
  {
    name: 'Marina District',
    slug: 'marina-district',
    boundary: {
      type: 'Point',
      coordinates: [-122.4381, 37.8021]
    },
    metadata: {
      description: 'Upscale waterfront neighborhood with shopping and dining',
      aliases: ['The Marina']
    }
  },
  {
    name: 'SoMa',
    slug: 'soma',
    boundary: {
      type: 'Point',
      coordinates: [-122.3997, 37.7786]
    },
    metadata: {
      description: 'South of Market - tech hub with museums, nightlife, and startups',
      aliases: ['South of Market', 'SOMA']
    }
  },
  {
    name: 'Financial District',
    slug: 'financial-district',
    boundary: {
      type: 'Point',
      coordinates: [-122.4011, 37.7946]
    },
    metadata: {
      description: 'Downtown business center with skyscrapers and historic architecture',
      aliases: ['FiDi', 'Downtown']
    }
  },
  {
    name: 'Chinatown',
    slug: 'chinatown',
    boundary: {
      type: 'Point',
      coordinates: [-122.4058, 37.7941]
    },
    metadata: {
      description: 'Oldest Chinatown in North America with authentic cuisine and culture',
      aliases: []
    }
  },
  {
    name: 'Pacific Heights',
    slug: 'pacific-heights',
    boundary: {
      type: 'Point',
      coordinates: [-122.4381, 37.7919]
    },
    metadata: {
      description: 'Affluent residential area with Victorian mansions and scenic views',
      aliases: ['Pac Heights']
    }
  },
  {
    name: 'Noe Valley',
    slug: 'noe-valley',
    boundary: {
      type: 'Point',
      coordinates: [-122.4319, 37.7486]
    },
    metadata: {
      description: 'Family-friendly neighborhood with boutique shops and cafes',
      aliases: ['Noe']
    }
  },
  {
    name: 'Richmond District',
    slug: 'richmond-district',
    boundary: {
      type: 'Point',
      coordinates: [-122.4786, 37.7756]
    },
    metadata: {
      description: 'Diverse residential area near Golden Gate Park with Asian and Russian influences',
      aliases: ['The Richmond', 'Inner Richmond', 'Outer Richmond']
    }
  },
  {
    name: 'Sunset District',
    slug: 'sunset-district',
    boundary: {
      type: 'Point',
      coordinates: [-122.4942, 37.7564]
    },
    metadata: {
      description: 'Quiet residential neighborhood near Ocean Beach with Asian dining',
      aliases: ['The Sunset', 'Inner Sunset', 'Outer Sunset']
    }
  },
  {
    name: 'Potrero Hill',
    slug: 'potrero-hill',
    boundary: {
      type: 'Point',
      coordinates: [-122.3980, 37.7586]
    },
    metadata: {
      description: 'Sunny hilltop neighborhood with tech workers and young families',
      aliases: ['Potrero']
    }
  },
  {
    name: 'Russian Hill',
    slug: 'russian-hill',
    boundary: {
      type: 'Point',
      coordinates: [-122.4194, 37.8011]
    },
    metadata: {
      description: 'Upscale neighborhood famous for Lombard Street and scenic views',
      aliases: []
    }
  },
  {
    name: 'Hayes Valley',
    slug: 'hayes-valley',
    boundary: {
      type: 'Point',
      coordinates: [-122.4247, 37.7756]
    },
    metadata: {
      description: 'Trendy neighborhood with boutiques, cafes, and art galleries',
      aliases: []
    }
  },
  {
    name: 'Presidio',
    slug: 'presidio',
    boundary: {
      type: 'Point',
      coordinates: [-122.4661, 37.7989]
    },
    metadata: {
      description: 'Former military base turned national park with hiking and museums',
      aliases: ['Presidio Heights']
    }
  },
  {
    name: 'Dogpatch',
    slug: 'dogpatch',
    boundary: {
      type: 'Point',
      coordinates: [-122.3889, 37.7581]
    },
    metadata: {
      description: 'Emerging neighborhood with breweries, restaurants, and waterfront access',
      aliases: []
    }
  },
  {
    name: 'Cole Valley',
    slug: 'cole-valley',
    boundary: {
      type: 'Point',
      coordinates: [-122.4511, 37.7653]
    },
    metadata: {
      description: 'Quiet residential enclave near Golden Gate Park with local shops',
      aliases: []
    }
  },
  {
    name: 'Bernal Heights',
    slug: 'bernal-heights',
    boundary: {
      type: 'Point',
      coordinates: [-122.4161, 37.7419]
    },
    metadata: {
      description: 'Hilltop neighborhood with panoramic views and community feel',
      aliases: ['Bernal']
    }
  },
  {
    name: 'Embarcadero',
    slug: 'embarcadero',
    boundary: {
      type: 'Point',
      coordinates: [-122.3931, 37.7956]
    },
    metadata: {
      description: 'Waterfront area with Ferry Building, restaurants, and Bay views',
      aliases: []
    }
  }
];

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.tagVote.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.helpfulVote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.neighborhood.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Fetch real SF neighborhoods
  console.log('🌉 Fetching SF neighborhood data from DataSF...');
  let neighborhoods;
  try {
    neighborhoods = await fetchSFNeighborhoods();
    console.log(`✅ Fetched ${neighborhoods.length} neighborhoods from DataSF`);
  } catch (error) {
    console.warn('⚠️  Failed to fetch from DataSF, using fallback data:', error);
    neighborhoods = fallbackNeighborhoods;
  }

  // Create neighborhoods
  console.log('🏘️  Creating neighborhoods...');
  for (const hood of neighborhoods) {
    await prisma.neighborhood.create({
      data: hood,
    });
  }

  console.log(`✅ Created ${neighborhoods.length} neighborhoods`);
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
