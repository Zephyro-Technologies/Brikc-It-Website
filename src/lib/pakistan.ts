/**
 * Where we deliver, as a picker rather than a text box.
 *
 * Typed addresses were the weak point in hand delivery: "Islamabad", "isb" and
 * a typo all had to be matched against the towns TEAM HQ covers. Picking from a
 * list makes that exact, and spares people spelling Rawalpindi.
 *
 * The city lists are the places couriers actually serve, not every settlement in
 * the country — so every list ends with an escape hatch. OTHER_CITY reveals a
 * free text box, because a shop that refuses an order over a missing town name
 * has chosen tidy data over a sale.
 */

export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
] as const

export type Province = (typeof PROVINCES)[number]

/** Sentinel for "my town isn't listed" — never stored, only a UI state. */
export const OTHER_CITY = "__other__"

export const CITIES: Record<Province, string[]> = {
  Punjab: [
    "Lahore",
    "Rawalpindi",
    "Faisalabad",
    "Multan",
    "Gujranwala",
    "Sialkot",
    "Bahawalpur",
    "Sargodha",
    "Sheikhupura",
    "Jhelum",
    "Gujrat",
    "Sahiwal",
    "Okara",
    "Rahim Yar Khan",
    "Wah Cantonment",
    "Kasur",
    "Chiniot",
    "Jhang",
    "Dera Ghazi Khan",
    "Attock",
    "Khanewal",
    "Muzaffargarh",
    "Chakwal",
    "Mandi Bahauddin",
    "Hafizabad",
    "Narowal",
    "Vehari",
    "Toba Tek Singh",
    "Mianwali",
    "Bahawalnagar",
    "Pakpattan",
    "Lodhran",
    "Layyah",
    "Khushab",
    "Bhakkar",
    "Rajanpur",
    "Nankana Sahib",
    "Murree",
    "Taxila",
    "Kamoke",
    "Daska",
    "Gojra",
    "Jaranwala",
    "Burewala",
  ],
  Sindh: [
    "Karachi",
    "Hyderabad",
    "Sukkur",
    "Larkana",
    "Nawabshah",
    "Mirpur Khas",
    "Jacobabad",
    "Shikarpur",
    "Khairpur",
    "Dadu",
    "Thatta",
    "Badin",
    "Ghotki",
    "Sanghar",
    "Tando Allahyar",
    "Tando Adam",
    "Umerkot",
    "Jamshoro",
    "Matiari",
    "Kashmore",
    "Kandhkot",
    "Qambar Shahdadkot",
    "Sujawal",
    "Mithi",
  ],
  "Khyber Pakhtunkhwa": [
    "Peshawar",
    "Mardan",
    "Abbottabad",
    "Mingora",
    "Kohat",
    "Dera Ismail Khan",
    "Nowshera",
    "Charsadda",
    "Swabi",
    "Mansehra",
    "Bannu",
    "Haripur",
    "Batkhela",
    "Timergara",
    "Chitral",
    "Hangu",
    "Karak",
    "Lakki Marwat",
    "Tank",
    "Buner",
    "Shangla",
    "Dir",
    "Malakand",
    "Battagram",
  ],
  Balochistan: [
    "Quetta",
    "Turbat",
    "Khuzdar",
    "Hub",
    "Chaman",
    "Gwadar",
    "Sibi",
    "Zhob",
    "Loralai",
    "Dera Murad Jamali",
    "Kharan",
    "Mastung",
    "Nushki",
    "Panjgur",
    "Pishin",
    "Qila Abdullah",
    "Qila Saifullah",
    "Lasbela",
    "Jaffarabad",
    "Kalat",
    "Awaran",
    "Barkhan",
    "Dera Bugti",
    "Usta Mohammad",
  ],
  "Islamabad Capital Territory": ["Islamabad"],
  "Gilgit-Baltistan": [
    "Gilgit",
    "Skardu",
    "Hunza",
    "Chilas",
    "Ghizer",
    "Astore",
    "Ghanche",
    "Shigar",
    "Kharmang",
    "Nagar",
    "Diamer",
  ],
  "Azad Jammu & Kashmir": [
    "Muzaffarabad",
    "Mirpur",
    "Rawalakot",
    "Kotli",
    "Bhimber",
    "Bagh",
    "Pallandri",
    "Hattian Bala",
    "Haveli",
    "Neelum",
    "Sudhanoti",
  ],
}

export function isProvince(value: string): value is Province {
  return (PROVINCES as readonly string[]).includes(value)
}

export function citiesIn(province: string): string[] {
  return isProvince(province) ? CITIES[province] : []
}
