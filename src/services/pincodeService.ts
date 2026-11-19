// ──────────────────────────────────────────────────
// Golden Leaf Finance — Postal Pincode & City Resolution Service
// Ultra-fast instant offline lookup + Live India Post API integration
// ──────────────────────────────────────────────────

export interface PincodeDetails {
  city: string;
  state: string;
  district?: string;
  taluk?: string;
  options?: string[];
  source: 'local_exact' | 'local_prefix' | 'api';
}

// 1. High-precision exact PIN code dictionary (Tamil Nadu & major nodes)
const EXACT_PINCODE_MAP: Record<string, { city: string; state: string; district: string; taluk?: string }> = {
  // Erode District — Gobichettipalayam Region
  '638451': { city: 'Gobichettipalayam', state: 'Tamil Nadu', district: 'Erode', taluk: 'Gobichettipalayam' },
  '638452': { city: 'Gobichettipalayam', state: 'Tamil Nadu', district: 'Erode', taluk: 'Gobichettipalayam' },
  '638453': { city: 'Gobichettipalayam', state: 'Tamil Nadu', district: 'Erode', taluk: 'Gobichettipalayam' },
  '638454': { city: 'Gobichettipalayam', state: 'Tamil Nadu', district: 'Erode', taluk: 'Gobichettipalayam' },
  '638455': { city: 'Gobichettipalayam', state: 'Tamil Nadu', district: 'Erode', taluk: 'Gobichettipalayam' },
  '638456': { city: 'Gobichettipalayam', state: 'Tamil Nadu', district: 'Erode', taluk: 'Gobichettipalayam' },
  '638457': { city: 'Gobichettipalayam', state: 'Tamil Nadu', district: 'Erode', taluk: 'Gobichettipalayam' },
  '638458': { city: 'Gobichettipalayam', state: 'Tamil Nadu', district: 'Erode', taluk: 'Gobichettipalayam' },
  '638459': { city: 'Gobichettipalayam', state: 'Tamil Nadu', district: 'Erode', taluk: 'Gobichettipalayam' },
  '638476': { city: 'Gobichettipalayam', state: 'Tamil Nadu', district: 'Erode', taluk: 'Gobichettipalayam' },

  // Erode District — Sathyamangalam Region
  '638401': { city: 'Sathyamangalam', state: 'Tamil Nadu', district: 'Erode', taluk: 'Sathyamangalam' },
  '638402': { city: 'Sathyamangalam', state: 'Tamil Nadu', district: 'Erode', taluk: 'Sathyamangalam' },
  '638403': { city: 'Sathyamangalam', state: 'Tamil Nadu', district: 'Erode', taluk: 'Sathyamangalam' },
  '638503': { city: 'Sathyamangalam', state: 'Tamil Nadu', district: 'Erode', taluk: 'Sathyamangalam' },

  // Erode District — Bhavani & Anthiyur
  '638301': { city: 'Bhavani', state: 'Tamil Nadu', district: 'Erode', taluk: 'Bhavani' },
  '638302': { city: 'Bhavani', state: 'Tamil Nadu', district: 'Erode', taluk: 'Bhavani' },
  '638314': { city: 'Bhavani', state: 'Tamil Nadu', district: 'Erode', taluk: 'Bhavani' },
  '638316': { city: 'Bhavani', state: 'Tamil Nadu', district: 'Erode', taluk: 'Bhavani' },
  '638501': { city: 'Anthiyur', state: 'Tamil Nadu', district: 'Erode', taluk: 'Anthiyur' },
  '638502': { city: 'Anthiyur', state: 'Tamil Nadu', district: 'Erode', taluk: 'Anthiyur' },
  '638504': { city: 'Anthiyur', state: 'Tamil Nadu', district: 'Erode', taluk: 'Anthiyur' },

  // Erode District — Perundurai & Kodumudi
  '638051': { city: 'Perundurai', state: 'Tamil Nadu', district: 'Erode', taluk: 'Perundurai' },
  '638052': { city: 'Perundurai', state: 'Tamil Nadu', district: 'Erode', taluk: 'Perundurai' },
  '638053': { city: 'Perundurai', state: 'Tamil Nadu', district: 'Erode', taluk: 'Perundurai' },
  '638056': { city: 'Perundurai', state: 'Tamil Nadu', district: 'Erode', taluk: 'Perundurai' },
  '638151': { city: 'Kodumudi', state: 'Tamil Nadu', district: 'Erode', taluk: 'Kodumudi' },
  '638152': { city: 'Kodumudi', state: 'Tamil Nadu', district: 'Erode', taluk: 'Kodumudi' },

  // Erode City
  '638001': { city: 'Erode', state: 'Tamil Nadu', district: 'Erode', taluk: 'Erode' },
  '638002': { city: 'Erode', state: 'Tamil Nadu', district: 'Erode', taluk: 'Erode' },
  '638003': { city: 'Erode', state: 'Tamil Nadu', district: 'Erode', taluk: 'Erode' },
  '638004': { city: 'Erode', state: 'Tamil Nadu', district: 'Erode', taluk: 'Erode' },
  '638009': { city: 'Erode', state: 'Tamil Nadu', district: 'Erode', taluk: 'Erode' },
  '638011': { city: 'Erode', state: 'Tamil Nadu', district: 'Erode', taluk: 'Erode' },
  '638012': { city: 'Erode', state: 'Tamil Nadu', district: 'Erode', taluk: 'Erode' },

  // Coimbatore & Tiruppur Hubs
  '641001': { city: 'Coimbatore', state: 'Tamil Nadu', district: 'Coimbatore' },
  '641002': { city: 'Coimbatore', state: 'Tamil Nadu', district: 'Coimbatore' },
  '641018': { city: 'Coimbatore', state: 'Tamil Nadu', district: 'Coimbatore' },
  '641028': { city: 'Coimbatore', state: 'Tamil Nadu', district: 'Coimbatore' },
  '641035': { city: 'Coimbatore', state: 'Tamil Nadu', district: 'Coimbatore' },
  '641301': { city: 'Mettupalayam', state: 'Tamil Nadu', district: 'Coimbatore', taluk: 'Mettupalayam' },
  '641305': { city: 'Mettupalayam', state: 'Tamil Nadu', district: 'Coimbatore', taluk: 'Mettupalayam' },
  '642001': { city: 'Pollachi', state: 'Tamil Nadu', district: 'Coimbatore', taluk: 'Pollachi' },
  '642002': { city: 'Pollachi', state: 'Tamil Nadu', district: 'Coimbatore', taluk: 'Pollachi' },
  '641601': { city: 'Tiruppur', state: 'Tamil Nadu', district: 'Tiruppur' },
  '641602': { city: 'Tiruppur', state: 'Tamil Nadu', district: 'Tiruppur' },
  '641604': { city: 'Tiruppur', state: 'Tamil Nadu', district: 'Tiruppur' },
  '642126': { city: 'Udumalpet', state: 'Tamil Nadu', district: 'Tiruppur', taluk: 'Udumalpet' },
  '642128': { city: 'Udumalpet', state: 'Tamil Nadu', district: 'Tiruppur', taluk: 'Udumalpet' },

  // Salem & Namakkal Hubs
  '636001': { city: 'Salem', state: 'Tamil Nadu', district: 'Salem' },
  '636002': { city: 'Salem', state: 'Tamil Nadu', district: 'Salem' },
  '636004': { city: 'Salem', state: 'Tamil Nadu', district: 'Salem' },
  '636007': { city: 'Salem', state: 'Tamil Nadu', district: 'Salem' },
  '636102': { city: 'Attur', state: 'Tamil Nadu', district: 'Salem', taluk: 'Attur' },
  '636401': { city: 'Mettur', state: 'Tamil Nadu', district: 'Salem', taluk: 'Mettur' },
  '637001': { city: 'Namakkal', state: 'Tamil Nadu', district: 'Namakkal' },
  '637002': { city: 'Namakkal', state: 'Tamil Nadu', district: 'Namakkal' },
  '637211': { city: 'Tiruchengode', state: 'Tamil Nadu', district: 'Namakkal', taluk: 'Tiruchengode' },
  '637408': { city: 'Rasipuram', state: 'Tamil Nadu', district: 'Namakkal', taluk: 'Rasipuram' },
  '639001': { city: 'Karur', state: 'Tamil Nadu', district: 'Karur' },
  '639002': { city: 'Karur', state: 'Tamil Nadu', district: 'Karur' },

  // Madurai, Dindigul & Theni
  '625001': { city: 'Madurai', state: 'Tamil Nadu', district: 'Madurai' },
  '625002': { city: 'Madurai', state: 'Tamil Nadu', district: 'Madurai' },
  '625020': { city: 'Madurai', state: 'Tamil Nadu', district: 'Madurai' },
  '624001': { city: 'Dindigul', state: 'Tamil Nadu', district: 'Dindigul' },
  '624601': { city: 'Palani', state: 'Tamil Nadu', district: 'Dindigul', taluk: 'Palani' },
  '624101': { city: 'Kodaikanal', state: 'Tamil Nadu', district: 'Dindigul', taluk: 'Kodaikanal' },
  '625531': { city: 'Theni', state: 'Tamil Nadu', district: 'Theni' },
  '625516': { city: 'Cumbum', state: 'Tamil Nadu', district: 'Theni', taluk: 'Cumbum' },

  // Trichy, Thanjavur & Central TN
  '620001': { city: 'Tiruchirappalli', state: 'Tamil Nadu', district: 'Tiruchirappalli' },
  '620002': { city: 'Tiruchirappalli', state: 'Tamil Nadu', district: 'Tiruchirappalli' },
  '620006': { city: 'Srirangam', state: 'Tamil Nadu', district: 'Tiruchirappalli' },
  '613001': { city: 'Thanjavur', state: 'Tamil Nadu', district: 'Thanjavur' },
  '612001': { city: 'Kumbakonam', state: 'Tamil Nadu', district: 'Thanjavur', taluk: 'Kumbakonam' },
  '610001': { city: 'Tiruvarur', state: 'Tamil Nadu', district: 'Tiruvarur' },
  '611001': { city: 'Nagapattinam', state: 'Tamil Nadu', district: 'Nagapattinam' },
  '609001': { city: 'Mayiladuthurai', state: 'Tamil Nadu', district: 'Mayiladuthurai' },
  '622001': { city: 'Pudukkottai', state: 'Tamil Nadu', district: 'Pudukkottai' },
  '621212': { city: 'Perambalur', state: 'Tamil Nadu', district: 'Perambalur' },
  '621704': { city: 'Ariyalur', state: 'Tamil Nadu', district: 'Ariyalur' },

  // South TN
  '627001': { city: 'Tirunelveli', state: 'Tamil Nadu', district: 'Tirunelveli' },
  '627002': { city: 'Palayamkottai', state: 'Tamil Nadu', district: 'Tirunelveli' },
  '627811': { city: 'Tenkasi', state: 'Tamil Nadu', district: 'Tenkasi' },
  '628001': { city: 'Thoothukudi', state: 'Tamil Nadu', district: 'Thoothukudi' },
  '628501': { city: 'Kovilpatti', state: 'Tamil Nadu', district: 'Thoothukudi', taluk: 'Kovilpatti' },
  '629001': { city: 'Nagercoil', state: 'Tamil Nadu', district: 'Kanniyakumari' },
  '629702': { city: 'Kanyakumari', state: 'Tamil Nadu', district: 'Kanniyakumari' },
  '626001': { city: 'Virudhunagar', state: 'Tamil Nadu', district: 'Virudhunagar' },
  '626123': { city: 'Sivakasi', state: 'Tamil Nadu', district: 'Virudhunagar', taluk: 'Sivakasi' },
  '626117': { city: 'Rajapalayam', state: 'Tamil Nadu', district: 'Virudhunagar', taluk: 'Rajapalayam' },
  '630001': { city: 'Karaikudi', state: 'Tamil Nadu', district: 'Sivaganga', taluk: 'Karaikudi' },
  '630561': { city: 'Sivaganga', state: 'Tamil Nadu', district: 'Sivaganga' },
  '623501': { city: 'Ramanathapuram', state: 'Tamil Nadu', district: 'Ramanathapuram' },
  '623526': { city: 'Rameswaram', state: 'Tamil Nadu', district: 'Ramanathapuram' },

  // North TN
  '600001': { city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai' },
  '600002': { city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai' },
  '600028': { city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai' },
  '600040': { city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai' },
  '600044': { city: 'Chromepet', state: 'Tamil Nadu', district: 'Chengalpattu' },
  '600045': { city: 'Tambaram', state: 'Tamil Nadu', district: 'Chengalpattu' },
  '600102': { city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai' },
  '602001': { city: 'Tiruvallur', state: 'Tamil Nadu', district: 'Tiruvallur' },
  '603001': { city: 'Chengalpattu', state: 'Tamil Nadu', district: 'Chengalpattu' },
  '631501': { city: 'Kanchipuram', state: 'Tamil Nadu', district: 'Kanchipuram' },
  '632001': { city: 'Vellore', state: 'Tamil Nadu', district: 'Vellore' },
  '632401': { city: 'Ranipet', state: 'Tamil Nadu', district: 'Ranipet' },
  '635601': { city: 'Tirupattur', state: 'Tamil Nadu', district: 'Tirupattur' },
  '635001': { city: 'Krishnagiri', state: 'Tamil Nadu', district: 'Krishnagiri' },
  '635109': { city: 'Hosur', state: 'Tamil Nadu', district: 'Krishnagiri', taluk: 'Hosur' },
  '636701': { city: 'Dharmapuri', state: 'Tamil Nadu', district: 'Dharmapuri' },
  '606601': { city: 'Tiruvannamalai', state: 'Tamil Nadu', district: 'Tiruvannamalai' },
  '605601': { city: 'Villupuram', state: 'Tamil Nadu', district: 'Villupuram' },
  '606202': { city: 'Kallakurichi', state: 'Tamil Nadu', district: 'Kallakurichi' },
  '607001': { city: 'Cuddalore', state: 'Tamil Nadu', district: 'Cuddalore' },
  '607801': { city: 'Neyveli', state: 'Tamil Nadu', district: 'Cuddalore' },
  '608001': { city: 'Chidambaram', state: 'Tamil Nadu', district: 'Cuddalore' },
  '605001': { city: 'Puducherry', state: 'Puducherry', district: 'Puducherry' },

  // Nilgiris
  '643001': { city: 'Udhagamandalam', state: 'Tamil Nadu', district: 'Nilgiris' },
  '643101': { city: 'Coonoor', state: 'Tamil Nadu', district: 'Nilgiris' },
  '643217': { city: 'Kotagiri', state: 'Tamil Nadu', district: 'Nilgiris' },

  // National Key Cities
  '560001': { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban' },
  '570001': { city: 'Mysuru', state: 'Karnataka', district: 'Mysuru' },
  '575001': { city: 'Mangaluru', state: 'Karnataka', district: 'Dakshina Kannada' },
  '500001': { city: 'Hyderabad', state: 'Telangana', district: 'Hyderabad' },
  '520001': { city: 'Vijayawada', state: 'Andhra Pradesh', district: 'Krishna' },
  '530001': { city: 'Visakhapatnam', state: 'Andhra Pradesh', district: 'Visakhapatnam' },
  '682001': { city: 'Kochi', state: 'Kerala', district: 'Ernakulam' },
  '695001': { city: 'Thiruvananthapuram', state: 'Kerala', district: 'Thiruvananthapuram' },
  '400001': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai' },
  '411001': { city: 'Pune', state: 'Maharashtra', district: 'Pune' },
  '440001': { city: 'Nagpur', state: 'Maharashtra', district: 'Nagpur' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad' },
  '395001': { city: 'Surat', state: 'Gujarat', district: 'Surat' },
  '302001': { city: 'Jaipur', state: 'Rajasthan', district: 'Jaipur' },
  '110001': { city: 'New Delhi', state: 'Delhi', district: 'New Delhi' },
  '122001': { city: 'Gurugram', state: 'Haryana', district: 'Gurugram' },
  '201301': { city: 'Noida', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar' },
  '226001': { city: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow' },
  '700001': { city: 'Kolkata', state: 'West Bengal', district: 'Kolkata' },
  '800001': { city: 'Patna', state: 'Bihar', district: 'Patna' },
  '160001': { city: 'Chandigarh', state: 'Chandigarh', district: 'Chandigarh' },
};

// 2. Comprehensive 3-digit prefix mapping (covers all postal divisions)
const PREFIX_MAP_3DIGIT: Record<string, { city: string; state: string }> = {
  // Tamil Nadu
  '600': { city: 'Chennai', state: 'Tamil Nadu' },
  '601': { city: 'Tiruvallur', state: 'Tamil Nadu' },
  '602': { city: 'Tiruvallur', state: 'Tamil Nadu' },
  '603': { city: 'Chengalpattu', state: 'Tamil Nadu' },
  '604': { city: 'Tindivanam', state: 'Tamil Nadu' },
  '605': { city: 'Puducherry', state: 'Puducherry' },
  '606': { city: 'Tiruvannamalai', state: 'Tamil Nadu' },
  '607': { city: 'Cuddalore', state: 'Tamil Nadu' },
  '608': { city: 'Chidambaram', state: 'Tamil Nadu' },
  '609': { city: 'Mayiladuthurai', state: 'Tamil Nadu' },
  '610': { city: 'Tiruvarur', state: 'Tamil Nadu' },
  '611': { city: 'Nagapattinam', state: 'Tamil Nadu' },
  '612': { city: 'Kumbakonam', state: 'Tamil Nadu' },
  '613': { city: 'Thanjavur', state: 'Tamil Nadu' },
  '614': { city: 'Pattukkottai', state: 'Tamil Nadu' },
  '620': { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  '621': { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  '622': { city: 'Pudukkottai', state: 'Tamil Nadu' },
  '623': { city: 'Ramanathapuram', state: 'Tamil Nadu' },
  '624': { city: 'Dindigul', state: 'Tamil Nadu' },
  '625': { city: 'Madurai', state: 'Tamil Nadu' },
  '626': { city: 'Virudhunagar', state: 'Tamil Nadu' },
  '627': { city: 'Tirunelveli', state: 'Tamil Nadu' },
  '628': { city: 'Thoothukudi', state: 'Tamil Nadu' },
  '629': { city: 'Kanniyakumari', state: 'Tamil Nadu' },
  '630': { city: 'Sivaganga', state: 'Tamil Nadu' },
  '631': { city: 'Kanchipuram', state: 'Tamil Nadu' },
  '632': { city: 'Vellore', state: 'Tamil Nadu' },
  '635': { city: 'Krishnagiri', state: 'Tamil Nadu' },
  '636': { city: 'Salem', state: 'Tamil Nadu' },
  '637': { city: 'Namakkal', state: 'Tamil Nadu' },
  '638': { city: 'Erode', state: 'Tamil Nadu' },
  '639': { city: 'Karur', state: 'Tamil Nadu' },
  '641': { city: 'Coimbatore', state: 'Tamil Nadu' },
  '642': { city: 'Pollachi', state: 'Tamil Nadu' },
  '643': { city: 'Udhagamandalam', state: 'Tamil Nadu' },

  // Kerala
  '670': { city: 'Kannur', state: 'Kerala' },
  '671': { city: 'Kasaragod', state: 'Kerala' },
  '673': { city: 'Kozhikode', state: 'Kerala' },
  '676': { city: 'Malappuram', state: 'Kerala' },
  '678': { city: 'Palakkad', state: 'Kerala' },
  '679': { city: 'Shoranur', state: 'Kerala' },
  '680': { city: 'Thrissur', state: 'Kerala' },
  '682': { city: 'Kochi', state: 'Kerala' },
  '683': { city: 'Aluva', state: 'Kerala' },
  '685': { city: 'Idukki', state: 'Kerala' },
  '686': { city: 'Kottayam', state: 'Kerala' },
  '688': { city: 'Alappuzha', state: 'Kerala' },
  '689': { city: 'Pathanamthitta', state: 'Kerala' },
  '691': { city: 'Kollam', state: 'Kerala' },
  '695': { city: 'Thiruvananthapuram', state: 'Kerala' },

  // Karnataka
  '560': { city: 'Bengaluru', state: 'Karnataka' },
  '561': { city: 'Chikkaballapur', state: 'Karnataka' },
  '562': { city: 'Bengaluru Rural', state: 'Karnataka' },
  '563': { city: 'Kolar', state: 'Karnataka' },
  '570': { city: 'Mysuru', state: 'Karnataka' },
  '571': { city: 'Mandya', state: 'Karnataka' },
  '572': { city: 'Tumakuru', state: 'Karnataka' },
  '573': { city: 'Hassan', state: 'Karnataka' },
  '574': { city: 'Udupi', state: 'Karnataka' },
  '575': { city: 'Mangaluru', state: 'Karnataka' },
  '576': { city: 'Kundapura', state: 'Karnataka' },
  '577': { city: 'Shivamogga', state: 'Karnataka' },
  '580': { city: 'Hubballi', state: 'Karnataka' },
  '581': { city: 'Karwar', state: 'Karnataka' },
  '583': { city: 'Ballari', state: 'Karnataka' },
  '585': { city: 'Kalaburagi', state: 'Karnataka' },
  '590': { city: 'Belagavi', state: 'Karnataka' },

  // Telangana & Andhra Pradesh
  '500': { city: 'Hyderabad', state: 'Telangana' },
  '501': { city: 'Ranga Reddy', state: 'Telangana' },
  '502': { city: 'Sangareddy', state: 'Telangana' },
  '503': { city: 'Nizamabad', state: 'Telangana' },
  '505': { city: 'Karimnagar', state: 'Telangana' },
  '506': { city: 'Warangal', state: 'Telangana' },
  '515': { city: 'Anantapur', state: 'Andhra Pradesh' },
  '516': { city: 'Kadapa', state: 'Andhra Pradesh' },
  '517': { city: 'Tirupati', state: 'Andhra Pradesh' },
  '518': { city: 'Kurnool', state: 'Andhra Pradesh' },
  '520': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  '522': { city: 'Guntur', state: 'Andhra Pradesh' },
  '524': { city: 'Nellore', state: 'Andhra Pradesh' },
  '530': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '533': { city: 'Kakinada', state: 'Andhra Pradesh' },
  '534': { city: 'Eluru', state: 'Andhra Pradesh' },

  // Maharashtra & Goa
  '400': { city: 'Mumbai', state: 'Maharashtra' },
  '401': { city: 'Thane', state: 'Maharashtra' },
  '403': { city: 'Panaji', state: 'Goa' },
  '410': { city: 'Lonavala', state: 'Maharashtra' },
  '411': { city: 'Pune', state: 'Maharashtra' },
  '413': { city: 'Solapur', state: 'Maharashtra' },
  '414': { city: 'Ahmednagar', state: 'Maharashtra' },
  '415': { city: 'Satara', state: 'Maharashtra' },
  '416': { city: 'Kolhapur', state: 'Maharashtra' },
  '421': { city: 'Kalyan', state: 'Maharashtra' },
  '422': { city: 'Nashik', state: 'Maharashtra' },
  '424': { city: 'Dhule', state: 'Maharashtra' },
  '425': { city: 'Jalgaon', state: 'Maharashtra' },
  '431': { city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra' },
  '440': { city: 'Nagpur', state: 'Maharashtra' },
  '444': { city: 'Amravati', state: 'Maharashtra' },

  // Gujarat
  '360': { city: 'Rajkot', state: 'Gujarat' },
  '361': { city: 'Jamnagar', state: 'Gujarat' },
  '364': { city: 'Bhavnagar', state: 'Gujarat' },
  '370': { city: 'Bhuj', state: 'Gujarat' },
  '380': { city: 'Ahmedabad', state: 'Gujarat' },
  '382': { city: 'Gandhinagar', state: 'Gujarat' },
  '384': { city: 'Mehsana', state: 'Gujarat' },
  '388': { city: 'Anand', state: 'Gujarat' },
  '390': { city: 'Vadodara', state: 'Gujarat' },
  '392': { city: 'Bharuch', state: 'Gujarat' },
  '395': { city: 'Surat', state: 'Gujarat' },
  '396': { city: 'Valsad', state: 'Gujarat' },

  // Rajasthan
  '301': { city: 'Alwar', state: 'Rajasthan' },
  '302': { city: 'Jaipur', state: 'Rajasthan' },
  '305': { city: 'Ajmer', state: 'Rajasthan' },
  '311': { city: 'Bhilwara', state: 'Rajasthan' },
  '313': { city: 'Udaipur', state: 'Rajasthan' },
  '324': { city: 'Kota', state: 'Rajasthan' },
  '334': { city: 'Bikaner', state: 'Rajasthan' },
  '342': { city: 'Jodhpur', state: 'Rajasthan' },

  // North India
  '110': { city: 'New Delhi', state: 'Delhi' },
  '121': { city: 'Faridabad', state: 'Haryana' },
  '122': { city: 'Gurugram', state: 'Haryana' },
  '131': { city: 'Sonipat', state: 'Haryana' },
  '132': { city: 'Panipat', state: 'Haryana' },
  '141': { city: 'Ludhiana', state: 'Punjab' },
  '143': { city: 'Amritsar', state: 'Punjab' },
  '144': { city: 'Jalandhar', state: 'Punjab' },
  '160': { city: 'Chandigarh', state: 'Chandigarh' },
  '171': { city: 'Shimla', state: 'Himachal Pradesh' },
  '180': { city: 'Jammu', state: 'Jammu and Kashmir' },
  '190': { city: 'Srinagar', state: 'Jammu and Kashmir' },

  // Uttar Pradesh & Uttarakhand
  '201': { city: 'Noida / Ghaziabad', state: 'Uttar Pradesh' },
  '208': { city: 'Kanpur', state: 'Uttar Pradesh' },
  '221': { city: 'Varanasi', state: 'Uttar Pradesh' },
  '226': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '248': { city: 'Dehradun', state: 'Uttarakhand' },
  '249': { city: 'Haridwar', state: 'Uttarakhand' },
  '250': { city: 'Meerut', state: 'Uttar Pradesh' },
  '282': { city: 'Agra', state: 'Uttar Pradesh' },

  // Eastern & Central India
  '452': { city: 'Indore', state: 'Madhya Pradesh' },
  '462': { city: 'Bhopal', state: 'Madhya Pradesh' },
  '474': { city: 'Gwalior', state: 'Madhya Pradesh' },
  '482': { city: 'Jabalpur', state: 'Madhya Pradesh' },
  '492': { city: 'Raipur', state: 'Chhattisgarh' },
  '700': { city: 'Kolkata', state: 'West Bengal' },
  '711': { city: 'Howrah', state: 'West Bengal' },
  '734': { city: 'Siliguri', state: 'West Bengal' },
  '751': { city: 'Bhubaneswar', state: 'Odisha' },
  '753': { city: 'Cuttack', state: 'Odisha' },
  '800': { city: 'Patna', state: 'Bihar' },
  '834': { city: 'Ranchi', state: 'Jharkhand' },
  '831': { city: 'Jamshedpur', state: 'Jharkhand' },
  '781': { city: 'Guwahati', state: 'Assam' },
};

// 3. Fallback 2-digit state resolver
const STATE_2DIGIT_MAP: Record<string, { city: string; state: string }> = {
  '11': { city: 'New Delhi', state: 'Delhi' },
  '12': { city: 'Haryana City', state: 'Haryana' },
  '13': { city: 'Haryana City', state: 'Haryana' },
  '14': { city: 'Punjab City', state: 'Punjab' },
  '15': { city: 'Punjab City', state: 'Punjab' },
  '16': { city: 'Chandigarh', state: 'Chandigarh' },
  '17': { city: 'Himachal City', state: 'Himachal Pradesh' },
  '18': { city: 'Jammu', state: 'Jammu and Kashmir' },
  '19': { city: 'Srinagar', state: 'Jammu and Kashmir' },
  '20': { city: 'UP West City', state: 'Uttar Pradesh' },
  '21': { city: 'UP Central City', state: 'Uttar Pradesh' },
  '22': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '23': { city: 'UP City', state: 'Uttar Pradesh' },
  '24': { city: 'Uttarakhand City', state: 'Uttarakhand' },
  '25': { city: 'Meerut', state: 'Uttar Pradesh' },
  '26': { city: 'Bareilly', state: 'Uttar Pradesh' },
  '27': { city: 'Gorakhpur', state: 'Uttar Pradesh' },
  '28': { city: 'Agra', state: 'Uttar Pradesh' },
  '30': { city: 'Jaipur', state: 'Rajasthan' },
  '31': { city: 'Udaipur', state: 'Rajasthan' },
  '32': { city: 'Kota', state: 'Rajasthan' },
  '33': { city: 'Bikaner', state: 'Rajasthan' },
  '34': { city: 'Jodhpur', state: 'Rajasthan' },
  '36': { city: 'Rajkot', state: 'Gujarat' },
  '37': { city: 'Bhuj', state: 'Gujarat' },
  '38': { city: 'Ahmedabad', state: 'Gujarat' },
  '39': { city: 'Surat', state: 'Gujarat' },
  '40': { city: 'Mumbai', state: 'Maharashtra' },
  '41': { city: 'Pune', state: 'Maharashtra' },
  '42': { city: 'Nashik', state: 'Maharashtra' },
  '43': { city: 'Aurangabad', state: 'Maharashtra' },
  '44': { city: 'Nagpur', state: 'Maharashtra' },
  '45': { city: 'Indore', state: 'Madhya Pradesh' },
  '46': { city: 'Bhopal', state: 'Madhya Pradesh' },
  '47': { city: 'Gwalior', state: 'Madhya Pradesh' },
  '48': { city: 'Jabalpur', state: 'Madhya Pradesh' },
  '49': { city: 'Raipur', state: 'Chhattisgarh' },
  '50': { city: 'Hyderabad', state: 'Telangana' },
  '51': { city: 'Tirupati', state: 'Andhra Pradesh' },
  '52': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  '53': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '56': { city: 'Bengaluru', state: 'Karnataka' },
  '57': { city: 'Mysuru', state: 'Karnataka' },
  '58': { city: 'Hubballi', state: 'Karnataka' },
  '59': { city: 'Belagavi', state: 'Karnataka' },
  '60': { city: 'Chennai', state: 'Tamil Nadu' },
  '61': { city: 'Thanjavur', state: 'Tamil Nadu' },
  '62': { city: 'Madurai', state: 'Tamil Nadu' },
  '63': { city: 'Salem', state: 'Tamil Nadu' },
  '64': { city: 'Coimbatore', state: 'Tamil Nadu' },
  '67': { city: 'Kozhikode', state: 'Kerala' },
  '68': { city: 'Kochi', state: 'Kerala' },
  '69': { city: 'Thiruvananthapuram', state: 'Kerala' },
  '70': { city: 'Kolkata', state: 'West Bengal' },
  '71': { city: 'Howrah', state: 'West Bengal' },
  '72': { city: 'Kharagpur', state: 'West Bengal' },
  '73': { city: 'Siliguri', state: 'West Bengal' },
  '74': { city: 'Asansol', state: 'West Bengal' },
  '75': { city: 'Bhubaneswar', state: 'Odisha' },
  '76': { city: 'Rourkela', state: 'Odisha' },
  '77': { city: 'Sambalpur', state: 'Odisha' },
  '78': { city: 'Guwahati', state: 'Assam' },
  '79': { city: 'Shillong', state: 'Meghalaya' },
  '80': { city: 'Patna', state: 'Bihar' },
  '81': { city: 'Deoghar', state: 'Jharkhand' },
  '82': { city: 'Dhanbad', state: 'Jharkhand' },
  '83': { city: 'Ranchi', state: 'Jharkhand' },
  '84': { city: 'Muzaffarpur', state: 'Bihar' },
  '85': { city: 'Bhagalpur', state: 'Bihar' },
};

/**
 * Synchronous local resolver — returns immediately in 0ms.
 */
export const getPincodeDetailsSync = (pincode: string): PincodeDetails | null => {
  const cleanPin = (pincode || '').replace(/\D/g, '').trim();
  if (cleanPin.length !== 6) return null;

  // 1. Check exact match
  if (EXACT_PINCODE_MAP[cleanPin]) {
    const entry = EXACT_PINCODE_MAP[cleanPin];
    const opts = Array.from(new Set([entry.city, entry.district, entry.taluk].filter(Boolean) as string[]));
    return {
      city: entry.city,
      state: entry.state,
      district: entry.district,
      taluk: entry.taluk,
      options: opts,
      source: 'local_exact',
    };
  }

  // 2. Check 3-digit prefix
  const prefix3 = cleanPin.slice(0, 3);
  if (PREFIX_MAP_3DIGIT[prefix3]) {
    const entry = PREFIX_MAP_3DIGIT[prefix3];
    return {
      city: entry.city,
      state: entry.state,
      options: [entry.city],
      source: 'local_prefix',
    };
  }

  // 3. Check 2-digit prefix
  const prefix2 = cleanPin.slice(0, 2);
  if (STATE_2DIGIT_MAP[prefix2]) {
    const entry = STATE_2DIGIT_MAP[prefix2];
    return {
      city: entry.city,
      state: entry.state,
      options: [entry.city],
      source: 'local_prefix',
    };
  }

  return null;
};

export const lookupPincode = getPincodeDetailsSync;

/**
 * Asynchronous resolver — checks India Post API for complete authoritative details.
 * Falls back to sync local resolver on failure or timeout.
 */
export const fetchPincodeDetails = async (
  pincode: string,
  timeoutMs = 6000
): Promise<PincodeDetails | null> => {
  const cleanPin = (pincode || '').replace(/\D/g, '').trim();
  if (cleanPin.length !== 6) return null;

  const localSync = getPincodeDetailsSync(cleanPin);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return localSync;
    }

    const json = await res.json();
    if (Array.isArray(json) && json.length > 0 && json[0].Status === 'Success' && Array.isArray(json[0].PostOffice)) {
      const offices = json[0].PostOffice;
      if (offices.length > 0) {
        const first = offices[0];
        const block = (first.Block && first.Block !== 'NA' && first.Block !== 'N/A') ? first.Block : '';
        const district = (first.District && first.District !== 'NA' && first.District !== 'N/A') ? first.District : '';
        const state = (first.State && first.State !== 'NA' && first.State !== 'N/A') ? first.State : (localSync?.state || 'Tamil Nadu');

        // Preferred city name: Block if specified and valid, otherwise District, otherwise Name
        let resolvedCity = block || district || first.Name || localSync?.city || '';

        // If localSync had an exact match like 'Gobichettipalayam', prefer that over generic District
        if (localSync?.source === 'local_exact') {
          resolvedCity = localSync.city;
        }

        const candidateOptions = new Set<string>();
        if (localSync?.city) candidateOptions.add(localSync.city);
        if (block) candidateOptions.add(block);
        if (district) candidateOptions.add(district);
        offices.forEach((o: any) => {
          if (o.Block && o.Block !== 'NA') candidateOptions.add(o.Block);
          if (o.District && o.District !== 'NA') candidateOptions.add(o.District);
        });

        return {
          city: resolvedCity,
          state,
          district: district || localSync?.district,
          taluk: block || localSync?.taluk,
          options: Array.from(candidateOptions),
          source: 'api',
        };
      }
    }
    return localSync;
  } catch (e) {
    clearTimeout(timer);
    return localSync;
  }
};
