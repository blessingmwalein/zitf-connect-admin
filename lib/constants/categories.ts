export interface Category {
  id: number;
  name: string;
}

export const ZITF_CATEGORIES: Category[] = [
  { id: 183, name: "Banking, Insurance & Financial Services" },
  { id: 184, name: "ASAMBENI (Business Tourism)" },
  { id: 185, name: "PAKPRINT (Printing, Publishing & Stationery, Packaging, Labelling, Bottling)" },
  { id: 186, name: "SCHOLASTICA (Education, Training, Consultancy)" },
  { id: 187, name: "ULTIM8 HOME (Building, Construction, Hardware, Interior Decorating)" },
  { id: 188, name: "Advertising, Graphic Arts, Industrial Design" },
  { id: 189, name: "Agricultural Produce, Arboriculture, Horticulture, Fisheries" },
  { id: 190, name: "Agricultural & Irrigation Equipment, Water Engineering" },
  { id: 191, name: "Arts & Crafts" },
  { id: 192, name: "Automation" },
  { id: 193, name: "Automotive, Garage Equipment" },
  { id: 194, name: "Business Services: Management, Clearing & Forwarding, Courier, Consultancy, Insurance" },
  { id: 195, name: "Chemicals, Pharmaceuticals" },
  { id: 196, name: "Children's Goods" },
  { id: 197, name: "Civic Representation (Local Government)" },
  { id: 198, name: "Clothing, Textiles, Haberdashery, Upholstery, Production Machinery & Equipment" },
  { id: 199, name: "ICT, Office Equipment, Audio-Visual, Hi-Tech, Telecommunications" },
  { id: 200, name: "Consumer Goods, Gift Items, Jewellery, Accessories" },
  { id: 201, name: "Cosmetics, Toiletries, Hairdressing" },
  { id: 202, name: "Distributors and Wholesalers" },
  { id: 203, name: "Ecology, Conservation and Greening: Waste Management, Rehabilitation, Recycling" },
  { id: 204, name: "Electrical Engineering, Household Equipment" },
  { id: 205, name: "Electronics" },
  { id: 206, name: "Energy (Electric, Hydro, Solar, Thermal, Wind)" },
  { id: 207, name: "Event Management: Exhibitions, Conferences, Congresses, Meetings" },
  { id: 208, name: "Food, Food Processing, Beverages, Catering and Equipment" },
  { id: 209, name: "Footwear, Leather Goods" },
  { id: 210, name: "Furniture, Wood Products" },
  { id: 211, name: "Glassware, Porcelain, Crockery" },
  { id: 212, name: "Health: Services, Non-Pharmaceutical Products, Medical Aid Societies" },
  { id: 213, name: "Hydraulics and Lifting Equipment" },
  { id: 214, name: "Industrial Chemicals, Cleaning Materials & Equipment" },
  { id: 215, name: "Instrumentation" },
  { id: 216, name: "Light and Heavy Engineering, Tools" },
  { id: 217, name: "Media" },
  { id: 218, name: "Mining, Mineral Processing, Geology" },
  { id: 219, name: "Pharmaceuticals, Medical, Laboratory & Scientific Products, Instruments/Equipment" },
  { id: 220, name: "Plastics, Rubber" },
  { id: 221, name: "Pneumatic Equipment" },
  { id: 222, name: "Public Services (Govt): Administration, Culture, Health, Conservation, Education & Training" },
  { id: 223, name: "Refrigeration, Air-conditioning, Heating" },
  { id: 224, name: "Religious, Social Organisations, Services" },
  { id: 225, name: "Security: Manpower, Systems, Products" },
  { id: 226, name: "Transport: Aviation, Boating, Bicycles, Motorcycles, Rail, Vehicles" },
  { id: 395, name: "Legal (Corporate Law, Intellectual Property Law, Criminal Law)" },
  { id: 396, name: "Government Agencies" },
  { id: 397, name: "Sports and Culture" },
  { id: 398, name: "Manufacturing" },
  { id: 399, name: "Marketing" },
];

export function getCategoryById(id: number): Category | undefined {
  return ZITF_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryName(id: number): string {
  return getCategoryById(id)?.name ?? "Unknown";
}
