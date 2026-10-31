export interface PaxiBranch {
  code: string;
  name: string;
  city: string;
  province: string;
  address: string;
  isPopular?: boolean;
}

export const PAXI_BRANCHES: PaxiBranch[] = [
  // ─── GAUTENG: SOWETO & SOUTH ─────────────────────────────────────────────
  {
    code: 'P4021',
    name: 'PEP Store Soweto Bara Mall',
    city: 'Soweto',
    province: 'Gauteng',
    address: 'Bara Mall, Old Potchefstroom Rd, Diepkloof, Soweto',
    isPopular: true,
  },
  {
    code: 'P4105',
    name: 'PEP Store Soweto Maponya Mall',
    city: 'Soweto',
    province: 'Gauteng',
    address: 'Maponya Mall, Chris Hani Rd, Klipspruit, Soweto',
    isPopular: true,
  },
  {
    code: 'P4118',
    name: 'PEP Store Soweto Jabulani Mall',
    city: 'Soweto',
    province: 'Gauteng',
    address: 'Jabulani Mall, 2601 Bolani Rd, Jabulani, Soweto',
    isPopular: true,
  },
  {
    code: 'P4201',
    name: 'PEP Store Soweto Protea Glen Mall',
    city: 'Soweto',
    province: 'Gauteng',
    address: 'Protea Glen Mall, Protea Blvd, Soweto',
    isPopular: true,
  },
  {
    code: 'P4240',
    name: 'PEP Store Dobsonville Shopping Centre',
    city: 'Soweto',
    province: 'Gauteng',
    address: 'Dobsonville Mall, Elias Motsoaledi Rd, Soweto',
  },
  {
    code: 'P4310',
    name: 'PEP Store Southgate Mall',
    city: 'Mondeor',
    province: 'Gauteng',
    address: 'Southgate Mall, Columbine Ave & Rifle Range Rd',
  },
  {
    code: 'P4350',
    name: 'PEP Store Mall of the South',
    city: 'Aspen Hills',
    province: 'Gauteng',
    address: 'Mall of the South, Cnr Swartkoppies & Klipriver Dr',
  },

  // ─── GAUTENG: JOHANNESBURG CENTRAL & EAST ────────────────────────────────
  {
    code: 'P3012',
    name: 'PEP Store Johannesburg Carlton Centre',
    city: 'Johannesburg',
    province: 'Gauteng',
    address: 'Carlton Centre, 150 Commissioner St, JHB CBD',
    isPopular: true,
  },
  {
    code: 'P3020',
    name: 'PEP Store Johannesburg Bree Street',
    city: 'Johannesburg',
    province: 'Gauteng',
    address: 'Lilian Ngoyi St (Bree), JHB CBD',
  },
  {
    code: 'P3055',
    name: 'PEP Store Braamfontein',
    city: 'Johannesburg',
    province: 'Gauteng',
    address: 'Biccard St, Braamfontein, Johannesburg',
    isPopular: true,
  },
  {
    code: 'P3120',
    name: 'PEP Store Eastgate Shopping Centre',
    city: 'Bedfordview',
    province: 'Gauteng',
    address: 'Eastgate Shopping Centre, 43 Bradford Rd',
  },
  {
    code: 'P3240',
    name: 'PEP Store Tembisa Phumulani Mall',
    city: 'Tembisa',
    province: 'Gauteng',
    address: 'Phumulani Mall, Olifantsfontein Rd, Tembisa',
    isPopular: true,
  },
  {
    code: 'P3250',
    name: 'PEP Store Tembisa Mega Mart',
    city: 'Tembisa',
    province: 'Gauteng',
    address: 'Tembisa Mega Mart, Rev RTJ Namane Dr',
  },
  {
    code: 'P3285',
    name: 'PEP Store Alex Mall',
    city: 'Alexandra',
    province: 'Gauteng',
    address: 'Alex Mall, London Rd, Alexandra, Sandton',
    isPopular: true,
  },
  {
    code: 'P3310',
    name: 'PEP Store Sandton City',
    city: 'Sandton',
    province: 'Gauteng',
    address: 'Sandton City, Rivonia Rd, Sandown',
  },
  {
    code: 'P3350',
    name: 'PEP Store Mall of Africa',
    city: 'Midrand',
    province: 'Gauteng',
    address: 'Mall of Africa, Magwa Cres, Waterfall City',
  },
  {
    code: 'P3410',
    name: 'PEP Store Kempton Park Festival Mall',
    city: 'Kempton Park',
    province: 'Gauteng',
    address: 'Festival Mall, CR Swart Dr, Kempton Park',
  },
  {
    code: 'P3450',
    name: 'PEP Store Vosloorus Chris Hani Crossing',
    city: 'Vosloorus',
    province: 'Gauteng',
    address: 'Chris Hani Crossing, Bierman Rd, Vosloorus',
  },
  {
    code: 'P3480',
    name: 'PEP Store Katlehong Sontonga Mall',
    city: 'Katlehong',
    province: 'Gauteng',
    address: 'Sontonga Mall, Sontonga Rd, Katlehong',
  },

  // ─── GAUTENG: PRETORIA & NORTH ───────────────────────────────────────────
  {
    code: 'P2001',
    name: 'PEP Store Pretoria Central Sammy Marks',
    city: 'Pretoria',
    province: 'Gauteng',
    address: 'Sammy Marks Square, Madiba St, Pretoria CBD',
    isPopular: true,
  },
  {
    code: 'P2045',
    name: 'PEP Store Pretoria Menlyn Park',
    city: 'Pretoria',
    province: 'Gauteng',
    address: 'Menlyn Park Shopping Centre, Atterbury Rd',
    isPopular: true,
  },
  {
    code: 'P2080',
    name: 'PEP Store Centurion Mall',
    city: 'Centurion',
    province: 'Gauteng',
    address: 'Centurion Mall, Heuwel Ave, Centurion',
  },
  {
    code: 'P2110',
    name: 'PEP Store Mamelodi Denlyn Mall',
    city: 'Mamelodi',
    province: 'Gauteng',
    address: 'Denlyn Shopping Centre, Stormvoel Rd, Mamelodi',
    isPopular: true,
  },
  {
    code: 'P2125',
    name: 'PEP Store Mamelodi Square',
    city: 'Mamelodi',
    province: 'Gauteng',
    address: 'Mamelodi Square, Tsamaya Rd, Mamelodi',
  },
  {
    code: 'P2150',
    name: 'PEP Store Soshanguve Plaza',
    city: 'Soshanguve',
    province: 'Gauteng',
    address: 'Soshanguve Plaza, Ruth First Rd',
    isPopular: true,
  },
  {
    code: 'P2165',
    name: 'PEP Store Soshanguve Crossing',
    city: 'Soshanguve',
    province: 'Gauteng',
    address: 'Soshanguve Crossing, Aubrey Matlala St',
  },
  {
    code: 'P2190',
    name: 'PEP Store Mabopane Square',
    city: 'Mabopane',
    province: 'Gauteng',
    address: 'Mabopane Square, Lucas Mangope Dr',
  },
  {
    code: 'P2210',
    name: 'PEP Store Garankuwa Shopping Centre',
    city: 'Ga-Rankuwa',
    province: 'Gauteng',
    address: 'Ga-Rankuwa City, Lucas Mangope Rd',
  },

  // ─── LIMPOPO ─────────────────────────────────────────────────────────────
  {
    code: 'P7001',
    name: 'PEP Store Polokwane Savannah Mall',
    city: 'Polokwane',
    province: 'Limpopo',
    address: 'Savannah Mall, Grimbeeck St, Polokwane',
    isPopular: true,
  },
  {
    code: 'P7020',
    name: 'PEP Store Polokwane Mall of the North',
    city: 'Polokwane',
    province: 'Limpopo',
    address: 'Mall of the North, R81, Bendor, Polokwane',
    isPopular: true,
  },
  {
    code: 'P7050',
    name: 'PEP Store Polokwane CBD Market St',
    city: 'Polokwane',
    province: 'Limpopo',
    address: 'Cnr Market & Grobler St, Polokwane CBD',
  },
  {
    code: 'P7110',
    name: 'PEP Store Thohoyandou Masingita Mall',
    city: 'Thohoyandou',
    province: 'Limpopo',
    address: 'Masingita Mall, Main Rd, Thohoyandou',
  },
  {
    code: 'P7140',
    name: 'PEP Store Tzaneen Lifestyle Centre',
    city: 'Tzaneen',
    province: 'Limpopo',
    address: 'Tzaneen Lifestyle Centre, Danie Joubert St',
  },
  {
    code: 'P7170',
    name: 'PEP Store Mokopane Mall',
    city: 'Mokopane',
    province: 'Limpopo',
    address: 'Mokopane Mall, Thabo Mbeki Dr',
  },
  {
    code: 'P7200',
    name: 'PEP Store Burgersfort Tubatse Crossing',
    city: 'Burgersfort',
    province: 'Limpopo',
    address: 'Tubatse Crossing, R37, Burgersfort',
  },
  {
    code: 'P7250',
    name: 'PEP Store Giyani Landmark Plaza',
    city: 'Giyani',
    province: 'Limpopo',
    address: 'Landmark Plaza, Main Rd, Giyani',
  },

  // ─── MPUMALANGA ──────────────────────────────────────────────────────────
  {
    code: 'P8010',
    name: 'PEP Store Nelspruit i’langa Mall',
    city: 'Mbombela',
    province: 'Mpumalanga',
    address: 'i’langa Mall, Bitterbessie St, Mbombela',
    isPopular: true,
  },
  {
    code: 'P8040',
    name: 'PEP Store Nelspruit Riverside Mall',
    city: 'Mbombela',
    province: 'Mpumalanga',
    address: 'Riverside Mall, Government Blvd, Mbombela',
  },
  {
    code: 'P8120',
    name: 'PEP Store eMalahleni Highveld Mall',
    city: 'eMalahleni',
    province: 'Mpumalanga',
    address: 'Highveld Mall, Mandela St, Witbank',
    isPopular: true,
  },
  {
    code: 'P8150',
    name: 'PEP Store Middelburg Mall',
    city: 'Middelburg',
    province: 'Mpumalanga',
    address: 'Middelburg Mall, Fontein St & Samora Machel St',
  },
  {
    code: 'P8200',
    name: 'PEP Store Secunda Mall',
    city: 'Secunda',
    province: 'Mpumalanga',
    address: 'Secunda Mall, PDP Kruger St, Secunda',
  },

  // ─── KWAZULU-NATAL ───────────────────────────────────────────────────────
  {
    code: 'P5001',
    name: 'PEP Store Durban Workshop',
    city: 'Durban',
    province: 'KwaZulu-Natal',
    address: 'The Workshop Shopping Centre, Commercial Rd, Durban',
    isPopular: true,
  },
  {
    code: 'P5040',
    name: 'PEP Store Gateway Theatre of Shopping',
    city: 'Umhlanga',
    province: 'KwaZulu-Natal',
    address: 'Gateway, 1 Palm Blvd, Umhlanga Ridge',
    isPopular: true,
  },
  {
    code: 'P5070',
    name: 'PEP Store Pavilion Shopping Centre',
    city: 'Westville',
    province: 'KwaZulu-Natal',
    address: 'The Pavilion, Jack Martens Dr, Westville, Durban',
  },
  {
    code: 'P5105',
    name: 'PEP Store Pietermaritzburg Liberty Mall',
    city: 'Pietermaritzburg',
    province: 'KwaZulu-Natal',
    address: 'Midlands Mall, Sanctuary Rd, Pietermaritzburg',
    isPopular: true,
  },
  {
    code: 'P5130',
    name: 'PEP Store Umlazi Mega City',
    city: 'Umlazi',
    province: 'KwaZulu-Natal',
    address: 'Umlazi Mega City, Griffiths Mxenge Hwy, Umlazi',
  },
  {
    code: 'P5160',
    name: 'PEP Store KwaMashu Bridge City',
    city: 'KwaMashu',
    province: 'KwaZulu-Natal',
    address: 'Bridge City Shopping Centre, Nogwaja Rd',
  },
  {
    code: 'P5200',
    name: 'PEP Store Richards Bay Boardwalk',
    city: 'Richards Bay',
    province: 'KwaZulu-Natal',
    address: 'Boardwalk Inkwazi Shopping Centre, Kruger Rand',
  },
  {
    code: 'P5240',
    name: 'PEP Store Newcastle Mall',
    city: 'Newcastle',
    province: 'KwaZulu-Natal',
    address: 'Newcastle Mall, Ladysmith Rd, Newcastle',
  },

  // ─── WESTERN CAPE ────────────────────────────────────────────────────────
  {
    code: 'P1001',
    name: 'PEP Store Cape Town Golden Acre',
    city: 'Cape Town',
    province: 'Western Cape',
    address: 'Golden Acre Shopping Centre, Adderley St, Cape Town CBD',
    isPopular: true,
  },
  {
    code: 'P1050',
    name: 'PEP Store Canal Walk',
    city: 'Cape Town',
    province: 'Western Cape',
    address: 'Canal Walk Shopping Centre, Century City',
    isPopular: true,
  },
  {
    code: 'P1080',
    name: 'PEP Store V&A Waterfront',
    city: 'Cape Town',
    province: 'Western Cape',
    address: 'V&A Waterfront, Dock Rd, Cape Town',
  },
  {
    code: 'P1120',
    name: 'PEP Store Mitchells Plain Promenade',
    city: 'Mitchells Plain',
    province: 'Western Cape',
    address: 'Liberty Promenade, AZ Berman Dr, Mitchells Plain',
    isPopular: true,
  },
  {
    code: 'P1150',
    name: 'PEP Store Khayelitsha Mall',
    city: 'Khayelitsha',
    province: 'Western Cape',
    address: 'Khayelitsha Shopping Centre, Walter Sisulu Rd',
  },
  {
    code: 'P1200',
    name: 'PEP Store Bellville Middestad Mall',
    city: 'Bellville',
    province: 'Western Cape',
    address: 'Middestad Mall, Charl Malan St, Bellville',
  },
  {
    code: 'P1240',
    name: 'PEP Store Stellenbosch Eikestad Mall',
    city: 'Stellenbosch',
    province: 'Western Cape',
    address: 'Eikestad Mall, Andringa St, Stellenbosch',
  },
  {
    code: 'P1280',
    name: 'PEP Store George Garden Route Mall',
    city: 'George',
    province: 'Western Cape',
    address: 'Garden Route Mall, Knysna Rd, George',
  },

  // ─── EASTERN CAPE ────────────────────────────────────────────────────────
  {
    code: 'P6001',
    name: 'PEP Store Gqeberha Greenacres',
    city: 'Gqeberha',
    province: 'Eastern Cape',
    address: 'Greenacres Shopping Centre, Cape Rd, Gqeberha',
    isPopular: true,
  },
  {
    code: 'P6040',
    name: 'PEP Store Gqeberha Walmer Park',
    city: 'Gqeberha',
    province: 'Eastern Cape',
    address: 'Walmer Park Shopping Centre, Main Rd, Walmer',
  },
  {
    code: 'P6105',
    name: 'PEP Store East London Vincent Park',
    city: 'East London',
    province: 'Eastern Cape',
    address: 'Vincent Park, Devereux Ave, East London',
    isPopular: true,
  },
  {
    code: 'P6140',
    name: 'PEP Store East London Gillwell Mall',
    city: 'East London',
    province: 'Eastern Cape',
    address: 'Gillwell Shopping Centre, Fleet St, East London CBD',
  },
  {
    code: 'P6180',
    name: 'PEP Store Mthatha Circus Triangle',
    city: 'Mthatha',
    province: 'Eastern Cape',
    address: 'Circus Triangle Mall, Nelson Mandela Dr, Mthatha',
  },

  // ─── FREE STATE ──────────────────────────────────────────────────────────
  {
    code: 'P9001',
    name: 'PEP Store Bloemfontein Mimosa Mall',
    city: 'Bloemfontein',
    province: 'Free State',
    address: 'Mimosa Mall, Kellner St, Brandwag, Bloemfontein',
    isPopular: true,
  },
  {
    code: 'P9040',
    name: 'PEP Store Bloemfontein Loch Logan',
    city: 'Bloemfontein',
    province: 'Free State',
    address: 'Loch Logan Waterfront, Henry St, Bloemfontein',
  },
  {
    code: 'P9080',
    name: 'PEP Store Welkom Goldfields Mall',
    city: 'Welkom',
    province: 'Free State',
    address: 'Goldfields Mall, Stateway & Buiten St, Welkom',
  },

  // ─── NORTH WEST ──────────────────────────────────────────────────────────
  {
    code: 'P0101',
    name: 'PEP Store Rustenburg Waterfall Mall',
    city: 'Rustenburg',
    province: 'North West',
    address: 'Waterfall Mall, 1 Augrabies Ave, Cashan, Rustenburg',
    isPopular: true,
  },
  {
    code: 'P0140',
    name: 'PEP Store Potchefstroom MooiRivier Mall',
    city: 'Potchefstroom',
    province: 'North West',
    address: 'MooiRivier Mall, Nelson Mandela Dr, Potchefstroom',
  },
  {
    code: 'P0180',
    name: 'PEP Store Mahikeng Mega City',
    city: 'Mahikeng',
    province: 'North West',
    address: 'Mega City Shopping Centre, Sekame Rd, Mmabatho',
  },
  {
    code: 'P0220',
    name: 'PEP Store Klerksdorp Matlosana Mall',
    city: 'Klerksdorp',
    province: 'North West',
    address: 'Matlosana Mall, Joe Slovo Rd, Klerksdorp',
  },

  // ─── NORTHERN CAPE ───────────────────────────────────────────────────────
  {
    code: 'P0301',
    name: 'PEP Store Kimberley Diamond Pavilion',
    city: 'Kimberley',
    province: 'Northern Cape',
    address: 'Diamond Pavilion Mall, Oliver Rd, Monument Heights, Kimberley',
  },
  {
    code: 'P0340',
    name: 'PEP Store Upington Kalahari Mall',
    city: 'Upington',
    province: 'Northern Cape',
    address: 'Kalahari Mall, Van Riebeeck St, Upington',
  },
];

// Compatibility alias for existing imports
export const POPULAR_PAXI_BRANCHES = PAXI_BRANCHES.filter((b) => b.isPopular);

export const SA_PROVINCES = [
  'All Provinces',
  'Gauteng',
  'Limpopo',
  'KwaZulu-Natal',
  'Western Cape',
  'Mpumalanga',
  'Eastern Cape',
  'Free State',
  'North West',
  'Northern Cape',
];

/**
 * Searches PAXI branches by keyword (city, town, mall, code, address, province)
 */
export function searchPaxiBranches(query: string, provinceFilter?: string): PaxiBranch[] {
  const q = (query || '').toLowerCase().trim();
  const prov = provinceFilter && provinceFilter !== 'All Provinces' ? provinceFilter.toLowerCase() : null;

  return PAXI_BRANCHES.filter((branch) => {
    if (prov && branch.province.toLowerCase() !== prov) {
      return false;
    }
    if (!q) return true;
    return (
      branch.name.toLowerCase().includes(q) ||
      branch.city.toLowerCase().includes(q) ||
      branch.code.toLowerCase().includes(q) ||
      branch.province.toLowerCase().includes(q) ||
      branch.address.toLowerCase().includes(q)
    );
  });
}

/**
 * Validates whether a given string corresponds to a known valid PEP PAXI pickup point
 */
export function validatePaxiBranchSelection(value: string): {
  isValid: boolean;
  matchedBranch?: PaxiBranch;
  errorMessage?: string;
} {
  const val = (value || '').trim();
  if (!val || val.length < 3) {
    return {
      isValid: false,
      errorMessage: 'Please select or search your nearest PEP Store for PAXI delivery.',
    };
  }

  // Check exact code match (e.g. P4021) or contained code
  const codeMatch = val.match(/P\d{4}/i);
  if (codeMatch) {
    const found = PAXI_BRANCHES.find((b) => b.code.toUpperCase() === codeMatch[0].toUpperCase());
    if (found) {
      return { isValid: true, matchedBranch: found };
    }
  }

  // Check matching name
  const foundByName = PAXI_BRANCHES.find(
    (b) => val.toLowerCase().includes(b.name.toLowerCase()) || b.name.toLowerCase().includes(val.toLowerCase())
  );
  if (foundByName) {
    return { isValid: true, matchedBranch: foundByName };
  }

  // If user entered a custom specific PEP branch with at least 8 characters mentioning PEP or mall or town
  if (val.length >= 8 && (/pep/i.test(val) || /mall/i.test(val) || /store/i.test(val) || /centre/i.test(val))) {
    return { isValid: true };
  }

  return {
    isValid: false,
    errorMessage: 'Please select a verified PEP Store from the list or include the official PAXI branch code (e.g. P4021).',
  };
}
