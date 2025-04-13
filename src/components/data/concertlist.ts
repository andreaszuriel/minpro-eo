export interface ConcertEvent {
    id: number;
    title: string;
    artist: string;
    genre: string;
    startDate: string;
    endDate: string;
    time: string;
    location: string;
    seats: number;
    tiers: string[];
    price: {
      [tier: string]: number; 
    };
    image: string;
    description: string;
    organizer: string;
    currency: string; 
  }
  
  export const concertList: ConcertEvent[] = [
    {
      id: 1,
      title: "Vans Warped Tour 2025 – Washington, D.C.",
      artist: "Variety",
      genre: "Alternative Rock",
      startDate: "2025-06-14",
      endDate: "2025-06-15",
      time: "4:00 PM",
      location: "Festival Grounds at RFK Stadium, Washington, D.C.",
      seats: 20000,
      tiers: ["VIP", "General Admission", "Lawn"],
      price: {
        VIP: 1500000,
        "General Admission": 1000000,
        Lawn: 600000
      },
      currency: "IDR",
      image: "https://i.pinimg.com/1200x/33/9c/20/339c207729a108fa0402c3d9c73f7f75.jpg",
      description: "Celebrate the 30th anniversary of the iconic Vans Warped Tour at the Festival Grounds at RFK Stadium in Washington, D.C., where two days of punk, rock, and alternative music await. This milestone event brings together a diverse lineup of artists under the banner of 'Variety,' ensuring a high-energy experience that honors the tour’s legacy of raw, rebellious sound. From June 14 to 15, 2025, starting at 4:00 PM, fans can choose from VIP, General Admission, or Lawn tiers to immerse themselves in a festival atmosphere that has defined generations of music lovers. Organized by Vans and the Kevin Lyman Group, this event promises not only performances but also a vibrant community celebration, complete with 20,000 seats to accommodate the massive turnout expected for this historic occasion.",
      organizer: "Vans / Kevin Lyman Group"
    },
    {
      id: 2,
      title: "BAND-MAID – WORLD DOMINATION Tour",
      artist: "BAND-MAID",
      genre: "Rock",
      startDate: "2025-04-18",
      endDate: "2025-04-18",
      time: "8:00 PM",
      location: "LINE CUBE SHIBUYA, Tokyo, Japan",
      seats: 2000,
      tiers: ["Premium", "Standard", "Balcony"],
      price: {
        Premium: 1200000,
        Standard: 800000,
        Balcony: 500000
      },
      currency: "IDR",
      image: "https://i.pinimg.com/736x/77/9e/fd/779efdd7ffe4e58169ef71a6b5739855.jpg",
      description: "Experience the powerful performance of BAND-MAID as they bring their WORLD DOMINATION Tour to LINE CUBE SHIBUYA in Tokyo, Japan, on April 18, 2025, at 8:00 PM. Known for their unique blend of hard rock and maid café aesthetics, this all-female band delivers electrifying shows that captivate audiences with intricate musicianship and infectious energy. With only 2,000 seats available, this intimate concert offers Premium, Standard, and Balcony tiers, catering to fans eager to witness BAND-MAID’s commanding stage presence. Organized by Crown Records, the event promises a night of relentless rock anthems, showcasing why the band continues to conquer global stages with their unapologetic sound and charismatic performances.",
      organizer: "Crown Records"
    },
    {
      id: 3,
      title: "Falling In Reverse – Popular MonsTOUR II",
      artist: "Falling In Reverse",
      genre: "Post-Hardcore",
      startDate: "2025-04-19",
      endDate: "2025-04-19",
      time: "7:30 PM",
      location: "United Center, Chicago, IL",
      seats: 23000,
      tiers: ["Floor", "Lower Bowl", "Upper Bowl"],
      price: {
        Floor: 1000000,
        "Lower Bowl": 700000,
        "Upper Bowl": 400000
      },
      currency: "IDR",
      image: "https://i.pinimg.com/1200x/45/73/6f/45736fa59bce05d445a1eda03a28e008.jpg",
      description: "Join Falling In Reverse for their Popular MonsTOUR II at the United Center in Chicago, IL, on April 19, 2025, at 7:30 PM, for a night of post-hardcore intensity. Accompanied by special guests, the band, led by their dynamic frontman, will deliver a setlist packed with fan favorites and new tracks, ensuring an unforgettable experience for the 23,000 attendees expected to fill the venue. Fans can choose from Floor, Lower Bowl, or Upper Bowl seating to get up close or soak in the massive energy from above, all under the expert production of Live Nation. This concert builds on Falling In Reverse’s reputation for theatrical performances and raw emotion, making it a must-see event for those craving a visceral connection to music that pushes boundaries.",
      organizer: "Live Nation"
    },
    {
        id: 4,
        title: "YOASOBI: Asia Tour 2025",
        artist: "YOASOBI",
        genre: "J-Pop",
        startDate: "2025-04-15",
        endDate: "2025-04-15",
        time: "7:00 PM",
        location: "Jakarta Convention Center, Jakarta, Indonesia",
        seats: 5000,
        tiers: ["VIP", "Floor", "Seated"],
        price: {
            VIP: 3000000,
            Floor: 1800000,
            Seated: 1000000
        },
        currency: "IDR",
        image: "https://i.pinimg.com/1200x/76/4a/31/764a31eaab43abb11770d0dd0c13404f.jpg",
        description: "YOASOBI lights up the Jakarta Convention Center in Jakarta, Indonesia, on April 15, 2025, at 7:00 PM, as part of their Asia Tour 2025, bringing their signature J-Pop sound to 5,000 fans. Known for their storytelling through heartfelt lyrics and vibrant melodies, the duo will perform hits that have resonated worldwide, creating an intimate yet electrifying atmosphere in this highly anticipated show. With ticket options including VIP, Floor, and Seated tiers, attendees can tailor their experience to feel every beat of YOASOBI’s dynamic setlist, organized by PK Entertainment. This concert promises a night of emotional anthems and stunning visuals, showcasing why YOASOBI has become a global sensation in the J-Pop scene.",
        organizer: "PK Entertainment"
    },
    {
      id: 5,
      title: "Coachella Valley Music and Arts Festival 2025",
      artist: "Variety",
      genre: "Indie / Alternative",
      startDate: "2025-04-11",
      endDate: "2025-04-13",
      time: "10:00 AM",
      location: "Empire Polo Club, Indio, CA",
      seats: 125000,
      tiers: ["VIP", "General Admission", "Camping"],
      price: {
        VIP: 4500000,
        "General Admission": 2500000,
        Camping: 1500000
      },
      currency: "IDR",
      image: "https://i.pinimg.com/1200x/09/ec/51/09ec51915cf3af55a7156c332f9dabe5.jpg",
      description: "Experience the eclectic mix of music and art at Coachella 2025, featuring top indie and alternative artists from around the world.",
      organizer: "Goldenvoice"
    },
    {
      id: 6,
      title: "Glastonbury Festival 2025",
      artist: "Variety",
      genre: "Rock / Pop / Electronic",
      startDate: "2025-06-25",
      endDate: "2025-06-29",
      time: "11:00 AM",
      location: "Worthy Farm, Pilton, Somerset, UK",
      seats: 210000,
      tiers: ["VIP", "Standard", "Camping"],
      price: {
        VIP: 5000000,
        Standard: 3000000,
        Camping: 2000000
      },
      currency: "IDR",
      image: "https://i.pinimg.com/1200x/c2/d4/43/c2d443d0ba35331e876c858807985dc6.jpg",
      description: "Join the legendary Glastonbury Festival for five days of diverse music genres, including rock, pop, and electronic performances.",
      organizer: "Glastonbury Festivals Ltd"
    },
    {
      id: 7,
      title: "Lollapalooza 2025",
      artist: "Variety",
      genre: "Alternative / Hip-Hop / EDM",
      startDate: "2025-08-01",
      endDate: "2025-08-04",
      time: "9:00 AM",
      location: "Grant Park, Chicago, IL",
      seats: 100000,
      tiers: ["VIP", "General Admission", "Lounge"],
      price: {
        VIP: 4000000,
        "General Admission": 2000000,
        Lounge: 3000000
      },
      currency: "IDR",
      image: "https://i.pinimg.com/1200x/f4/55/71/f455717ce8bddc16e6e21da4ce321d3e.jpg",
      description: "Lollapalooza returns to Chicago with a stellar lineup spanning alternative, hip-hop, and EDM genres.",
      organizer: "C3 Presents"
    },
    {
      id: 8,
      title: "Primavera Sound 2025",
      artist: "Variety",
      genre: "Indie / Rock / Electronic",
      startDate: "2025-06-05",
      endDate: "2025-06-07",
      time: "6:00 PM",
      location: "Parc del Fòrum, Barcelona, Spain",
      seats: 60000,
      tiers: ["VIP", "Standard", "Day Pass"],
      price: {
        VIP: 3500000,
        Standard: 2000000,
        "Day Pass": 1000000
      },
      currency: "IDR",
      image: "https://i.pinimg.com/1200x/70/09/de/7009ded5dd2bd423f78587358a8d3d5b.jpg",
      description: "Primavera Sound offers a diverse lineup of indie, rock, and electronic artists in the heart of Barcelona.",
      organizer: "Primavera Sound"
    },
    {
      id: 9,
      title: "Rock am Ring 2025",
      artist: "Variety",
      genre: "Rock / Metal",
      startDate: "2025-06-07",
      endDate: "2025-06-09",
      time: "7:00 PM",
      location: "Nürburgring, Nürburg, Germany",
      seats: 90000,
      tiers: ["VIP", "Standard", "Camping"],
      price: {
        VIP: 3800000,
        Standard: 2200000,
        Camping: 1200000
      },
      currency: "IDR",
      image: "https://i.pinimg.com/1200x/03/b9/6e/03b96ef88824fdee8463de03dbe09fbf.jpg",
      description: "Rock am Ring brings together the best of rock and metal for an electrifying weekend in Germany.",
      organizer: "Live Nation"
    },
    {
        id: 10,
        title: "TWICE: Fifth World Tour: Ready To Be",
        artist: "TWICE",
        genre: "K-POP",
        startDate: "2025-08-16",
        endDate: "2025-08-17",
        time: "7:00 PM",
        location: "Nissan Stadium Lemino, Yokohama, Japan",
        seats: 110000,
        tiers: ["VIP", "Standard", "One-Day Pass"],
        price: {
          VIP: 3000000,
          Standard: 1800000,
          "One-Day Pass": 1000000
        },
        currency: "IDR",
        image: "https://i.pinimg.com/1200x/cf/99/fb/cf99fba50fbc79a8357d7e25a014eb1a.jpg",
        description: "Experience TWICE final leg of their world tour at Nissan Stadium in Yokohama, Japan.",
        organizer: "JYP Entertainment"
      },
      {
        id: 11,
        title: "Beyoncé: Cowboy Carter Tour",
        artist: "Beyoncé",
        genre: "Pop / R&B",
        startDate: "2025-05-15",
        endDate: "2025-05-15",
        time: "8:00 PM",
        location: "SoFi Stadium, Los Angeles, CA",
        seats: 70000,
        tiers: ["VIP", "Floor", "Lower Bowl", "Upper Bowl"],
        price: {
            VIP: 5000000,
            Floor: 3000000,
            "Lower Bowl": 1500000,
            "Upper Bowl": 1000000
        },
        currency: "IDR",
        image: "https://i.pinimg.com/1200x/2b/5e/d1/2b5ed189ef186b46c23ada3d3a58f481.jpg",
        description: "Join Beyoncé for an electrifying night on her Cowboy Carter Tour, showcasing hits from her latest album with stunning visuals.",
        organizer: "Parkwood Entertainment"
    },
    {
        id: 12,
        title: "Coldplay: Music of the Spheres World Tour",
        artist: "Coldplay",
        genre: "Rock / Pop",
        startDate: "2025-06-20",
        endDate: "2025-06-20",
        time: "7:00 PM",
        location: "Wembley Stadium, London, UK",
        seats: 90000,
        tiers: ["VIP", "General Admission", "Seated"],
        price: {
            VIP: 4000000,
            "General Admission": 2000000,
            Seated: 1500000
        },
        currency: "IDR",
        image: "https://i.pinimg.com/1200x/03/76/86/0376863e9c777379f74b65888091e01d.jpg",
        description: "Experience Coldplay’s immersive Music of the Spheres Tour, featuring vibrant performances and eco-friendly production.",
        organizer: "Live Nation"
    },
    {
        id: 13,
        title: "AC/DC: Power Up Tour",
        artist: "AC/DC",
        genre: "Rock",
        startDate: "2025-07-10",
        endDate: "2025-07-10",
        time: "8:00 PM",
        location: "MetLife Stadium, East Rutherford, NJ",
        seats: 82000,
        tiers: ["VIP", "Floor", "Lower Level", "Upper Level"],
        price: {
            VIP: 4500000,
            Floor: 2500000,
            "Lower Level": 1800000,
            "Upper Level": 1200000
        },
        currency: "IDR",
        image: "https://i.pinimg.com/1200x/8f/16/39/8f1639161f678488d5e615f057ca12dc.jpg",
        description: "Rock out with AC/DC on their Power Up Tour, delivering high-energy performances of classic hits and new tracks.",
        organizer: "TEG Live"
    },
    {
        id: 14,
        title: "Metallica: M72 World Tour",
        artist: "Metallica",
        genre: "Metal / Rock",
        startDate: "2025-08-05",
        endDate: "2025-08-05",
        time: "4:00 PM",
        location: "Levi's Stadium, Santa Clara, CA",
        seats: 68000,
        tiers: ["VIP", "Pit", "Reserved Seating"],
        price: {
            VIP: 5000000,
            Pit: 3000000,
            "Reserved Seating": 1500000
        },
        currency: "IDR",
        image: "https://i.pinimg.com/1200x/02/af/1e/02af1ed2b79ca6a8924feed0fa157184.jpg",
        description: "Metallica brings their M72 World Tour to Santa Clara with a raw, powerful setlist spanning their iconic career.",
        organizer: "Live Nation"
    },
    {
        id: 15,
        title: "Post Malone: Big Ass Stadium Tour",
        artist: "Post Malone",
        genre: "Hip-Hop / Rock",
        startDate: "2025-09-12",
        endDate: "2025-09-12",
        time: "5:30 PM",
        location: "AT&T Stadium, Arlington, TX",
        seats: 80000,
        tiers: ["VIP", "Floor", "Lower Bowl", "Upper Bowl"],
        price: {
            VIP: 3500000,
            Floor: 2000000,
            "Lower Bowl": 1200000,
            "Upper Bowl": 1000000
        },
        currency: "IDR",
        image: "https://i.pinimg.com/1200x/bd/70/f8/bd70f8d035a389cd22626efcdbf86e31.jpg",
        description: "Catch Post Malone’s Big Ass Stadium Tour for a genre-blending night of hip-hop, rock, and heartfelt performances.",
        organizer: "Live Nation"
    },
    {
        id: 16,
        title: "The Weeknd: After Hours Til Dawn Tour",
        artist: "The Weeknd",
        genre: "R&B / Pop",
        startDate: "2025-10-01",
        endDate: "2025-10-01",
        time: "6:00 PM",
        location: "Scotiabank Arena, Toronto, ON",
        seats: 19000,
        tiers: ["VIP", "Floor", "Lower Bowl", "Upper Bowl"],
        price: {
            VIP: 4000000,
            Floor: 2500000,
            "Lower Bowl": 1500000,
            "Upper Bowl": 1000000
        },
        currency: "IDR",
        image: "https://i.pinimg.com/1200x/f2/05/7f/f2057f1ecc1625ef88e417feda5801d8.jpg",
        description: "The Weeknd delivers a cinematic After Hours Til Dawn Tour experience with hits from Dawn FM and beyond.",
        organizer: "Live Nation"
    },
    {
        id: 17,
        title: "Kendrick Lamar: To Pimp a Butterfly Anniversary Tour",
        artist: "Kendrick Lamar",
        genre: "Hip-Hop",
        startDate: "2025-11-15",
        endDate: "2025-11-15",
        time: "11:00 AM",
        location: "Crypto.com Arena, Los Angeles, CA",
        seats: 20000,
        tiers: ["VIP", "Floor", "Lower Level", "Upper Level"],
        price: {
            VIP: 4500000,
            Floor: 2500000,
            "Lower Level": 1500000,
            "Upper Level": 1000000
        },
        currency: "IDR",
        image: "https://i.pinimg.com/1200x/f8/7e/52/f87e529445da80e064f7187d43a45959.jpg",
        description: "Kendrick Lamar celebrates the 10th anniversary of To Pimp a Butterfly with a powerful performance of his seminal album.",
        organizer: "Top Dawg Entertainment"
    },
    {
        id: 18,
        title: "The Black Keys: No Rain, No Flowers Tour",
        artist: "The Black Keys",
        genre: "Rock / Blues",
        startDate: "2025-12-05",
        endDate: "2025-12-05",
        time: "2:00 PM",
        location: "United Center, Chicago, IL",
        seats: 23500,
        tiers: ["VIP", "Floor", "Lower Level", "Upper Level"],
        price: {
            VIP: 3000000,
            Floor: 1800000,
            "Lower Level": 1200000,
            "Upper Level": 1000000
        },
        currency: "IDR",
        image: "https://i.pinimg.com/1200x/8d/16/c7/8d16c796db82de3e49f504335754aa19.jpg",
        description: "The Black Keys bring their gritty No Rain, No Flowers Tour to Chicago with blues-infused rock anthems.",
        organizer: "Live Nation"
    },
    {
        id: 19,
        title: "Deafheaven: MONO",
        artist: "Deafheaven",
        genre: "Black Meetal / Blackgaze",
        startDate: "2025-04-19",
        endDate: "2025-04-20",
        time: "5:00 PM",
        location: "Guadalajara Arena, Guadalajara, Mexico",
        seats: 1600,
        tiers: ["VIP", "General Admission"],
        price: {
            VIP: 1500000,
            "General Admission": 800000
        },
        currency: "IDR",
        image: "https://i.pinimg.com/1200x/c0/06/50/c00650911ba74ecbbd58996a654b5918.jpg",
        description: "Deafheaven’s NA Tour brings their transcendent Lonely People With Power to life, fusing black metal's raw intensity with shoegaze’s ethereal beauty for a cathartic night of sonic exploration.",
        organizer: "Live Nation"
    },
    {
        id: 20,
        title: "Knocked Loose: You Won’t Go Before You’re Supposed To Tour",
        artist: "Knocked Loose",
        genre: "Post-Hardcore / Metalcore",
        startDate: "2025-06-10",
        endDate: "2025-06-10",
        time: "6:00 PM",
        location: "The Fillmore, Philadelphia, PA",
        seats: 3300,
        tiers: ["VIP", "Floor", "Balcony"],
        price: {
            VIP: 2000000,
            Floor: 1200000,
            Balcony: 900000
        },
        currency: "IDR",
        image: "https://i.pinimg.com/1200x/e2/a6/fa/e2a6fa27d7b920b0f1d60479db0109a2.jpg",
        description: "Knocked Loose unleashes their intense post-hardcore sound on the You Won’t Go Before You’re Supposed To Tour, with crushing riffs and visceral energy.",
        organizer: "Live Nation"
    },
    {
        id: 21,
        title: "Epica: The Nordic Principle Tour",
        artist: "Epica",
        genre: "Symphonic Metal",
        startDate: "2025-04-15",
        endDate: "2025-04-15",
        time: "7:00 PM",
        location: "Athambra, Paris, France",
        seats: 10000,
        tiers: ["VIP", "Standing", "Seated"],
        price: {
            VIP: 2500000,
            Standing: 1500000,
            Seated: 1000000
        },
        currency: "IDR",
        image: "https://i.pinimg.com/1200x/6f/70/f1/6f70f1cdccdba32f5603853f7b374cbe.jpg",
        description: "Experience the intensity of Epica's new album Aspiral on the Nordic Principle Tour, combining symphonic melody and metal's raw power.",
        organizer: "Live Nation"
    },
    {
        id: 22,
        title: "Turnover: Peripheral Vision Anniversary Tour",
        artist: "Turnover",
        genre: "Shoegaze / Pop-Punk",
        startDate: "2025-04-27",
        endDate: "2025-04-27",
        time: "5:00 PM",
        location: "The Danforth Music Hall, Toronto, Canada",
        seats: 7000,
        tiers: ["VIP", "General Admission"],
        price: {
            VIP: 1200000,
            "General Admission": 700000
        },
        currency: "IDR",
        image: "https://i.pinimg.com/1200x/96/b5/4c/96b54c90b30dad66042796b40dc1e386.jpg",
        description: "Turnover's Peripheral Vision Tour takes us on a captivating journey through the world of hazy shoegaze and nostalgia.",
        organizer: "Goldenvoice"
    },
    {
        id: 23,
        title: "Paramore: This Is Why Tour",
        artist: "Paramore",
        genre: "Indie Rock / Pop-Punk",
        startDate: "2025-07-10",
        endDate: "2025-07-10",
        time: "7:00 PM",
        location: "Brooklyn Steel, Brooklyn, NY",
        seats: 40000,
        tiers: ["VIP", "General Admission", "Balcony"],
        price: {
            VIP: 1800000,
            "General Admission": 1000000,
            Balcony: 800000
        },
        currency: "IDR",
        image: "https://i.pinimg.com/1200x/d4/2e/03/d42e032fade49663200a6bcc33102d21.jpg",
        description: "Bright Eyes returns with their heartfelt Five Dice, All Threes Tour, weaving indie folk and raw emotion in an intimate Brooklyn setting.",
        organizer: "Bowery Presents"
    },
    {
        id: 24,
        title: "Dreamcatcher: Under The Moonlight",
        artist: "Dreamcatcher",
        genre: "K-POP / Rock",
        startDate: "2025-08-20",
        endDate: "2025-08-20",
        time: "1:00 PM", 
        location: "New Frontier Theater, Manila, Philippines",
        seats: 25000,
        tiers: ["VIP", "Floor", "Lower Bowl", "Upper Bowl"],
        price: {
            VIP: 4000000,
            Floor: 2500000,
            "Lower Bowl": 1500000,
            "Upper Bowl": 1000000
        },
        currency: "IDR",
        image: "https://i.pinimg.com/1200x/8f/d3/76/8fd3762a8f6d1259f281ea5ecb1db160.jpg",
        description: "BLACKPINK lights up Goyang with their high-energy 2025 World Tour, delivering iconic K-pop anthems and stunning choreography.",
        organizer: "Random Minds Inc."
    }
  ];
  
  // Helper function to format prices for display
  export function formatPrice(price: number, currency: string = "IDR"): string {
    return `${currency} ${price.toLocaleString()}`;
  }
 
  // Helper function to separate genres
  export function getGenres(genreString: string): string[] {
    return genreString.split('/').map(genre => genre.trim());
  }

  // Example of how to use the formatting function
  // const vipPrice = concertList[0].price.VIP;
  // const formattedPrice = formatPrice(vipPrice, concertList[0].currency);
  // Will display "IDR 1,500,000"