export interface PaxiBranch {
  code: string;
  name: string;
  city: string;
  province: string;
  address: string;
}

export const POPULAR_PAXI_BRANCHES: PaxiBranch[] = [
  // Gauteng - Soweto & South
  {
    code: 'P4021',
    name: 'PEP Store Soweto Bara Mall',
    city: 'Soweto',
    province: 'Gauteng',
    address: 'Bara Mall, Old Potchefstroom Rd, Diepkloof, Soweto',
  },
  {
    code: 'P4105',
    name: 'PEP Store Soweto Maponya Mall',
    city: 'Soweto',
    province: 'Gauteng',
    address: 'Maponya Mall, Chris Hani Rd, Klipspruit, Soweto',
  },
  {
    code: 'P4118',
    name: 'PEP Store Soweto Jabulani Mall',
    city: 'Soweto',
    province: 'Gauteng',
    address: 'Jabulani Mall, 2601 Bolani Rd, Jabulani, Soweto',
  },
  {
    code: 'P4201',
    name: 'PEP Store Soweto Protea Glen Mall',
    city: 'Soweto',
    province: 'Gauteng',
    address: 'Protea Glen Mall, Protea Blvd, Soweto',
  },

  // Gauteng - Johannesburg Central & East
  {
    code: 'P3012',
    name: 'PEP Store Johannesburg Carlton Centre',
    city: 'Johannesburg',
    province: 'Gauteng',
    address: 'Carlton Centre, 150 Commissioner St, JHB CBD',
  },
  {
    code: 'P3055',
    name: 'PEP Store Braamfontein',
    city: 'Johannesburg',
    province: 'Gauteng',
    address: 'Biccard St, Braamfontein, Johannesburg',
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
  },
  {
    code: 'P3285',
    name: 'PEP Store Alex Mall',
    city: 'Alexandra',
    province: 'Gauteng',
    address: 'Alex Mall, London Rd, Alexandra, Sandton',
  },

  // Gauteng - Pretoria & North
  {
    code: 'P2001',
    name: 'PEP Store Pretoria Central Sammy Marks',
    city: 'Pretoria',
    province: 'Gauteng',
    address: 'Sammy Marks Square, Madiba St, Pretoria CBD',
  },
  {
    code: 'P2045',
    name: 'PEP Store Pretoria Menlyn Park',
    city: 'Pretoria',
    province: 'Gauteng',
    address: 'Menlyn Park Shopping Centre, Atterbury Rd',
  },
  {
    code: 'P2110',
    name: 'PEP Store Mamelodi Denlyn Mall',
    city: 'Mamelodi',
    province: 'Gauteng',
    address: 'Denlyn Shopping Centre, Stormvoel Rd, Mamelodi',
  },
  {
    code: 'P2150',
    name: 'PEP Store Soshanguve Plaza',
    city: 'Soshanguve',
    province: 'Gauteng',
    address: 'Soshanguve Plaza, Ruth First Rd',
  },

  // Limpopo
  {
    code: 'P7001',
    name: 'PEP Store Polokwane Savannah Mall',
    city: 'Polokwane',
    province: 'Limpopo',
    address: 'Savannah Mall, Grimbeeck St, Polokwane',
  },
  {
    code: 'P7020',
    name: 'PEP Store Polokwane Mall of the North',
    city: 'Polokwane',
    province: 'Limpopo',
    address: 'Mall of the North, R81, Bendor, Polokwane',
  },
  {
    code: 'P7110',
    name: 'PEP Store Thohoyandou Masingita Mall',
    city: 'Thohoyandou',
    province: 'Limpopo',
    address: 'Masingita Mall, Main Rd, Thohoyandou',
  },

  // Mpumalanga
  {
    code: 'P8010',
    name: 'PEP Store Nelspruit i’langa Mall',
    city: 'Mbombela',
    province: 'Mpumalanga',
    address: 'i’langa Mall, Bitterbessie St, Mbombela',
  },
  {
    code: 'P8120',
    name: 'PEP Store eMalahleni Highveld Mall',
    city: 'eMalahleni',
    province: 'Mpumalanga',
    address: 'Highveld Mall, Mandela St, Witbank',
  },

  // KwaZulu-Natal
  {
    code: 'P5001',
    name: 'PEP Store Durban Workshop',
    city: 'Durban',
    province: 'KwaZulu-Natal',
    address: 'The Workshop Shopping Centre, Commercial Rd, Durban',
  },
  {
    code: 'P5040',
    name: 'PEP Store Gateway Theatre of Shopping',
    city: 'Umhlanga',
    province: 'KwaZulu-Natal',
    address: 'Gateway, 1 Palm Blvd, Umhlanga Ridge',
  },
  {
    code: 'P5105',
    name: 'PEP Store Pietermaritzburg Liberty Mall',
    city: 'Pietermaritzburg',
    province: 'KwaZulu-Natal',
    address: 'Midlands Mall, Sanctuary Rd, Pietermaritzburg',
  },

  // Western Cape
  {
    code: 'P1001',
    name: 'PEP Store Cape Town Golden Acre',
    city: 'Cape Town',
    province: 'Western Cape',
    address: 'Golden Acre Shopping Centre, Adderley St, Cape Town CBD',
  },
  {
    code: 'P1050',
    name: 'PEP Store Canal Walk',
    city: 'Cape Town',
    province: 'Western Cape',
    address: 'Canal Walk Shopping Centre, Century City',
  },
  {
    code: 'P1120',
    name: 'PEP Store Mitchells Plain Promenade',
    city: 'Mitchells Plain',
    province: 'Western Cape',
    address: 'Liberty Promenade, AZ Berman Dr, Mitchells Plain',
  },

  // Eastern Cape
  {
    code: 'P6001',
    name: 'PEP Store Gqeberha Greenacres',
    city: 'Gqeberha',
    province: 'Eastern Cape',
    address: 'Greenacres Shopping Centre, Cape Rd, Gqeberha',
  },
  {
    code: 'P6105',
    name: 'PEP Store East London Vincent Park',
    city: 'East London',
    province: 'Eastern Cape',
    address: 'Vincent Park, Devereux Ave, East London',
  },

  // Free State
  {
    code: 'P9001',
    name: 'PEP Store Bloemfontein Mimosa Mall',
    city: 'Bloemfontein',
    province: 'Free State',
    address: 'Mimosa Mall, Kellner St, Brandwag, Bloemfontein',
  },

  // North West
  {
    code: 'P0101',
    name: 'PEP Store Rustenburg Waterfall Mall',
    city: 'Rustenburg',
    province: 'North West',
    address: 'Waterfall Mall, 1 Augrabies Ave, Cashan, Rustenburg',
  },
];
