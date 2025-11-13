// src/data/names.ts

export type NameEntry = {
  name: string;
  gender: 'boy' | 'girl' | 'unisex';
  origin: string;
  meaning: string;
  altSpellings?: string[];
};

export const NAMES: NameEntry[] = [
  // Yoruba
  { name: 'Adebayo', gender: 'boy', origin: 'Yoruba', meaning: 'The crown meets joy' },
  { name: 'Ayomide', gender: 'unisex', origin: 'Yoruba', meaning: 'My joy has come' },
  { name: 'Temi', gender: 'unisex', origin: 'Yoruba', meaning: 'Mine' },
  { name: 'Damilola', gender: 'unisex', origin: 'Yoruba', meaning: 'Bless me with wealth' },
  { name: 'Ifunanya', gender: 'girl', origin: 'Igbo', meaning: 'Love' },

  // Arabic
  { name: 'Aaliyah', gender: 'girl', origin: 'Arabic', meaning: 'Exalted, noble', altSpellings: ['Aliyah'] },
  { name: 'Zayd', gender: 'boy', origin: 'Arabic', meaning: 'Growth, abundance', altSpellings: ['Zaid'] },
  { name: 'Iman', gender: 'unisex', origin: 'Arabic', meaning: 'Faith' },

  // English / Scottish / Irish
  { name: 'Oliver', gender: 'boy', origin: 'English', meaning: 'Olive tree' },
  { name: 'Isla', gender: 'girl', origin: 'Scottish', meaning: 'Island' },
  { name: 'Aoife', gender: 'girl', origin: 'Irish', meaning: 'Beauty, radiance' },

  // Hindi
  { name: 'Aarav', gender: 'boy', origin: 'Hindi', meaning: 'Peaceful' },
  { name: 'Diya', gender: 'girl', origin: 'Hindi', meaning: 'Lamp, light' },
  { name: 'Ishan', gender: 'boy', origin: 'Hindi', meaning: 'Sun, lord' },

  // Spanish
  { name: 'Sofia', gender: 'girl', origin: 'Spanish', meaning: 'Wisdom', altSpellings: ['Sofía', 'Sophia'] },
  { name: 'Mateo', gender: 'boy', origin: 'Spanish', meaning: 'Gift of God' },

  // French
  { name: 'Émile', gender: 'boy', origin: 'French', meaning: 'Industrious', altSpellings: ['Emile'] },
  { name: 'Amélie', gender: 'girl', origin: 'French', meaning: 'Hardworking', altSpellings: ['Amelie'] },

  // Chinese
  { name: 'Mei', gender: 'girl', origin: 'Chinese', meaning: 'Beautiful' },
  { name: 'Wei', gender: 'unisex', origin: 'Chinese', meaning: 'Great; mighty' },

  // Japanese
  { name: 'Hana', gender: 'girl', origin: 'Japanese', meaning: 'Flower' },
  { name: 'Ren', gender: 'unisex', origin: 'Japanese', meaning: 'Lotus; love' },

  // Arabic / North African
  { name: 'Amir', gender: 'boy', origin: 'Arabic', meaning: 'Prince; leader' },
  { name: 'Maya', gender: 'girl', origin: 'Various', meaning: 'Water; illusion; mother' },

  // Slavic
  { name: 'Mila', gender: 'girl', origin: 'Slavic', meaning: 'Gracious; dear' },
  { name: 'Luka', gender: 'boy', origin: 'Slavic', meaning: 'Light' },

  // West African (Akan)
  { name: 'Kofi', gender: 'boy', origin: 'Akan', meaning: 'Born on Friday' },
  { name: 'Ama', gender: 'girl', origin: 'Akan', meaning: 'Born on Saturday' },

  // Turkish
  { name: 'Deniz', gender: 'unisex', origin: 'Turkish', meaning: 'Sea' },

  // Hebrew
  { name: 'Noah', gender: 'boy', origin: 'Hebrew', meaning: 'Rest; comfort' },
  { name: 'Leah', gender: 'girl', origin: 'Hebrew', meaning: 'Weary' },

  // More seeds
  { name: 'Kai', gender: 'unisex', origin: 'Hawaiian', meaning: 'Sea' },
  { name: 'Amara', gender: 'girl', origin: 'Igbo', meaning: 'Grace' },
  { name: 'Aria', gender: 'girl', origin: 'Italian', meaning: 'Air; melody' },
  { name: 'Zara', gender: 'girl', origin: 'Arabic', meaning: 'Blooming flower' },
  { name: 'Tariq', gender: 'boy', origin: 'Arabic', meaning: 'Morning star' },
  { name: 'Kian', gender: 'boy', origin: 'Persian', meaning: 'King; ancient' },
  { name: 'Sienna', gender: 'girl', origin: 'Italian', meaning: 'Orange-red color' },
  { name: 'Aisha', gender: 'girl', origin: 'Arabic', meaning: 'Alive; prosperous' },
  { name: 'Finn', gender: 'boy', origin: 'Irish', meaning: 'Fair' },
  { name: 'Nia', gender: 'girl', origin: 'Swahili', meaning: 'Purpose' },
  { name: 'Zuri', gender: 'girl', origin: 'Swahili', meaning: 'Beautiful' },
  { name: 'Yara', gender: 'girl', origin: 'Arabic', meaning: 'Small butterfly' },
  { name: 'Ezekiel', gender: 'boy', origin: 'Hebrew', meaning: 'God strengthens' },
  { name: 'Amirra', gender: 'girl', origin: 'Arabic', meaning: 'Princess', altSpellings: ['Amira'] },
];