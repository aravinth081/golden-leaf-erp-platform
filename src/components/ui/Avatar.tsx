// ──────────────────────────────────────────────────
// Golden Leaf Finance — Avatar Component
// ──────────────────────────────────────────────────

import React from 'react';
import { clsx } from 'clsx';
const maleAvatar = '/images/male-avatar.png';
const femaleAvatar = '/images/female-avatar.png';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  gender?: 'male' | 'female';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const sizeStyles: Record<string, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

// ─── 1. Title prefixes ───
const titlePrefixRegex = /^(mr|mrs|ms|miss|dr|prof|smt|shri|sri|thiru|thirumathi|selvi)\b\.?\s*/i;

// ─── 2. Definitive female full-name markers ───
// When these words appear anywhere in the name, it's overwhelmingly female
const femaleMarkers = /\b(devi|bai|ammal|ammu|selvi|kumari|rani|mary|begum|beevi|khatun|kaur|amma|ammai|akka)\b/i;

// ─── 3. Goddess first names that form MALE compound names ONLY when paired with male deity suffixes ───
// e.g. "Lakshmi Narayanan" = Male, "Meenakshi Sundaram" = Male, "Radha Krishnan" = Male, "Seetha Raman" = Male
const goddessCompoundFirstNames = new Set([
  'lakshmi', 'laxmi', 'meenakshi', 'minakshi', 'radha', 'seetha', 'sita',
  'gowri', 'gauri', 'parvathi', 'parvati', 'saraswathi', 'saraswati',
  'bhavani', 'uma', 'valli', 'shiva', 'siva', 'jaya'
]);

// ─── 4. Male deity suffixes for compound male names ───
const maleCompoundDeitySuffixes = new Set([
  'narayanan', 'narayan', 'sundaram', 'krishnan', 'krishna', 'raman', 'ram',
  'shankar', 'sankar', 'nathan', 'pathy', 'pathi', 'prasad', 'charan', 'kanth', 'kanthan',
  'kumar', 'raja', 'rajan', 'chandran', 'prakash', 'swamy', 'swami', 'moorthy', 'murthy'
]);

// ─── 5. Comprehensive list of definitive female first names ───
const femaleFirstNames = new Set([
  'priya', 'meera', 'kavitha', 'kavita', 'revathi', 'revati', 'kasthuri', 'kasturi',
  'shanthi', 'shanti', 'geetha', 'geeta', 'anitha', 'anita', 'sunitha', 'sunita',
  'lalitha', 'lalita', 'deepa', 'divya', 'durga', 'gayathri', 'gayatri', 'hema',
  'indira', 'janaki', 'kamala', 'kanchana', 'latha', 'lata', 'madhavi', 'malathi',
  'malati', 'mangala', 'mala', 'mohana', 'padma', 'prabha', 'prema', 'pushpa',
  'radha', 'rekha', 'renuka', 'rohini', 'sarala', 'saroja', 'savithri', 'savitri',
  'seetha', 'sita', 'sowmya', 'soumya', 'suganya', 'sukanya', 'sumathi', 'sumati',
  'sumitra', 'tara', 'uma', 'usha', 'vani', 'vasanthi', 'vasanti', 'vidya', 'vijaya',
  'yamuna', 'yasoda', 'yashoda', 'aishwarya', 'amudha', 'bhavani', 'chitra', 'eswari',
  'gomathi', 'gomati', 'isha', 'kala', 'mythili', 'nandini', 'pooja', 'puja',
  'preeti', 'preethi', 'sangeetha', 'sangeeta', 'shalini', 'shobha', 'swathi', 'swati',
  'thenmozhi', 'valli', 'vaijayanthi', 'vyjayanthi', 'ananya', 'archana', 'aruna',
  'bharathi', 'bhuvaneshwari', 'chandra', 'deepika', 'dhanalakshmi', 'dhivya',
  'elizabeth', 'fathima', 'fatima', 'ganga', 'harini', 'ilakiya', 'indhu', 'indumathi',
  'ishwarya', 'janani', 'jeyalakshmi', 'kalaivani', 'kalyani', 'kamakshi', 'karthika',
  'keerthana', 'keerthi', 'kokila', 'krithika', 'kousalya', 'kowsalya', 'lavanya',
  'leela', 'madhumitha', 'maha', 'maheswari', 'manjula', 'menaka', 'monika',
  'muthulakshmi', 'nandhini', 'nisha', 'nithya', 'pavithra', 'ponni', 'punitha',
  'rajeswari', 'rajeshwari', 'ramya', 'rashmi', 'reshma', 'rithika', 'sandhya',
  'saranya', 'sasikala', 'sathya', 'selvakumari', 'senthamarai', 'sharmila',
  'shilpa', 'shoba', 'shobana', 'shruti', 'sruthi', 'sneha', 'subashini',
  'subbulakshmi', 'sudha', 'sujatha', 'sukanya', 'sundari', 'surekha', 'swetha',
  'thamarai', 'umamaheswari', 'vaishnavi', 'vanaja', 'vanitha', 'varalakshmi',
  'vedhavalli', 'vennila', 'vijayalakshmi', 'vimala', 'vinodhini', 'vrinda',
  'nirmala', 'anusuya', 'aparana', 'aparna', 'bina', 'charulata', 'damayanti',
  'dharani', 'girija', 'gita', 'gowri', 'hemalatha', 'jayashree', 'jayasree',
  'kamalam', 'kanmani', 'karuna', 'loganayaki', 'madhuri', 'malini', 'manimegalai',
  'maragatham', 'meenakshi', 'menba', 'nalini', 'padmavathi', 'padmini', 'parvathi',
  'porkodi', 'radhika', 'rajalakshmi', 'roja', 'rukmani', 'rukmini',
  'sabari', 'sahana', 'sakthi', 'samundeeswari', 'santhi', 'saradhamani', 'sarojini',
  'sasirekha', 'seethalakshmi', 'selvamani', 'shanthala', 'sharmistha', 'shrimathi',
  'sivagami', 'sivaranjani', 'subhasree', 'suganthi', 'sumana', 'suseela', 'susheela',
  'tamilarasi', 'thilagavathi', 'tripurasundari', 'tulasi', 'vasudha',
  'velumani', 'vijayanthi', 'vijayarani', 'vishnupriya', 'yuvashree'
]);

// ─── 6. Comprehensive list of definitive male first names ───
const maleFirstNames = new Set([
  'sree', 'sri', 'haran', 'karan', 'anand', 'suresh', 'karthik', 'karthikeyan', 'raja', 'rajan',
  'hari', 'ravi', 'rishi', 'shiva', 'siva', 'krishna', 'aditya', 'surya', 'rama', 'ram',
  'murali', 'gopi', 'kasi', 'swami', 'swamy', 'prabhu', 'babu', 'vasu', 'raghu', 'venu',
  'raju', 'guru', 'ramu', 'indra', 'mitra', 'nanda', 'mukunda', 'srinivasa', 'srinivasan',
  'subramanya', 'subramanian', 'subramani', 'aravinth', 'aravind', 'saravanan', 'vijay',
  'kumar', 'subash', 'ganesh', 'dinesh', 'rajesh', 'manoj', 'praveen', 'naveen',
  'prasad', 'venkat', 'venkatesh', 'balaji', 'vignesh', 'selvam', 'murugan', 'ramesh',
  'senthil', 'arun', 'arjun', 'deepak', 'mohan', 'gopal', 'vinod', 'vinay', 'sanjay',
  'ajay', 'suraj', 'rahul', 'rohit', 'vivek', 'ashok', 'ashwin', 'amrit', 'bharat',
  'bala', 'deva', 'durai', 'elango', 'harish', 'jayaram', 'kamal', 'kannan',
  'madhan', 'mahesh', 'mani', 'manikandan', 'muthu', 'naga', 'pandian', 'parthiban',
  'sathish', 'sekar', 'sekhar', 'shankar', 'sankar', 'sridhar', 'thiru', 'udhaya',
  'varun', 'yuvan', 'alagappan', 'chandrasekar', 'soundararajan', 'palani', 'karuppiah',
  'arumugam', 'vel', 'velan', 'thirumalai', 'perumal', 'param', 'kathir', 'ilango',
  'kabilan', 'kumaran', 'maran', 'nagesh', 'pradeep', 'raghav', 'sambath', 'sampath',
  'saran', 'tamilselvan', 'thangaraj', 'vimal', 'wilson', 'xavier', 'yogesh', 'amit',
  'gautam', 'jai', 'kishore', 'nitin', 'om', 'pavan', 'rakesh', 'sachin', 'tushar',
  'umesh', 'vishnu', 'yash', 'kiran', 'dhanush', 'madhavan', 'sundar', 'nathan',
  'boopathi', 'dhandapani', 'elamvazhuthi', 'gunasekaran', 'inbarajan', 'jagadeesan',
  'kalidass', 'loganathan', 'marimuthu', 'natrajan', 'panneerselvam', 'radhakrishnan',
  'sivakumar', 'thanikachalam', 'ulaganathan', 'vadivel', 'veeramani', 'yugendran',
  'abdul', 'ahmed', 'ali', 'hassan', 'hussain', 'ibrahim', 'mohammed', 'muhammad',
  'syed', 'tariq', 'usman', 'anthony', 'david', 'george', 'john', 'joseph', 'michael',
  'paul', 'peter', 'robert', 'stephen', 'thomas', 'richard', 'charles'
]);

/**
 * Accurately detects gender from Indian and South Indian / Tamil names.
 * Carefully balances compound male names (e.g., Lakshmi Narayanan) against
 * female names with family surnames (e.g., Priya Nair, Deepa Krishnan, Priya Sharma).
 */
function guessGender(name: string): 'male' | 'female' {
  if (!name) return 'male';

  let cleaned = name.trim().toLowerCase().replace(/[.,]/g, ' ');

  // 1. Explicit honorific check
  if (/^(mrs|ms|miss|smt|thirumathi|selvi)\b/.test(cleaned)) {
    return 'female';
  }
  if (/^(mr|shri|thiru)\b/.test(cleaned)) {
    return 'male';
  }

  // Strip prefix
  cleaned = cleaned.replace(titlePrefixRegex, '').trim();

  // Split into tokens
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 'male';

  // Extract non-initial words (tokens with length > 1)
  const words = tokens.filter(t => t.length > 1);
  const primaryWord = words[0] || tokens[0];
  const lastWord = words.length > 1 ? words[words.length - 1] : '';

  // 2. SOUTH INDIAN COMPOUND MALE NAMES:
  // e.g. "Lakshmi Narayanan", "Meenakshi Sundaram", "Radha Krishnan", "Seetha Raman"
  // ONLY if primaryWord is in goddess list AND lastWord is in male deity suffix list
  if (goddessCompoundFirstNames.has(primaryWord) && lastWord && maleCompoundDeitySuffixes.has(lastWord)) {
    return 'male';
  }

  // Also check single-word compound male names: "radhakrishnan", "lakshminarayanan", "meenakshisundaram", "sitaraman"
  if (/^(radhakrishnan|lakshminarayanan|meenakshisundaram|sitaraman|seetharaman|sivakumar|gowrishankar|bhavanishankar)/.test(primaryWord)) {
    return 'male';
  }

  // 3. DEFINITIVE FEMALE MARKERS IN FULL NAME:
  // e.g. "Meera Devi", "Kasthuri Ammal", "Mumtaz Begum", "Stella Mary", "Tamilselvi"
  if (femaleMarkers.test(cleaned)) {
    return 'female';
  }

  // 4. CHECK FEMALE FIRST NAME:
  // e.g. "Priya Nair", "Kavitha Murugan", "Shanthi Ramesh", "Geetha Selvam", "Revathi S."
  if (femaleFirstNames.has(primaryWord)) {
    return 'female';
  }

  // Check if any word in the name is a known female name (e.g., initial preceding: "K. Priya")
  for (const word of words) {
    if (femaleFirstNames.has(word)) {
      return 'female';
    }
  }

  // 5. CHECK MALE FIRST NAME:
  // e.g. "Anand Patel", "Suresh Reddy", "Karthik Raja", "Sree Haran"
  if (maleFirstNames.has(primaryWord)) {
    return 'male';
  }

  for (const word of words) {
    if (maleFirstNames.has(word)) {
      return 'male';
    }
  }

  // 6. PATTERN & SUFFIX CHECKS:
  // Female suffixes on primaryWord:
  if (/(devi|ammal|selvi|kumari|rani|vathi|mathi|mitha|nisha|priya|lakshmi|eswari|eshwari|valli)$/.test(primaryWord)) {
    return 'female';
  }

  // Male suffixes on primaryWord or lastWord (Tamil male endings):
  if (/(an|raj|raja|rajan|kumar|vel|velan|mani|lingam|nathan|swamy|samy|chamy|moorthy|murthy|dass|das|prasad|babu)$/.test(primaryWord)) {
    return 'male';
  }
  if (lastWord && /(an|raj|raja|rajan|kumar|vel|velan|mani|lingam|nathan|swamy|samy|chamy|moorthy|murthy|dass|das|prasad|babu)$/.test(lastWord)) {
    return 'male';
  }

  // 7. General vowel ending heuristic (fallback for Indian feminine names ending in a/i/ee)
  if (/([i]|ee|ini|iya|ika|ita|ila|ira|ana|ina|tha|thi|shi)$/.test(primaryWord)) {
    return 'female';
  }

  // Default to male
  return 'male';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  gender: explicitGender,
  size = 'md',
  className,
  onClick,
}) => {
  const gender = explicitGender || (name ? guessGender(name) : 'male');
  const defaultAvatar = gender === 'female' ? femaleAvatar : maleAvatar;

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center overflow-hidden',
        'bg-slate-100 text-gold-700 font-semibold font-body shrink-0',
        'ring-1 ring-slate-200/90 shadow-2xs',
        sizeStyles[size],
        onClick && 'cursor-pointer hover:ring-gold-300 transition-all',
        className
      )}
      onClick={onClick}
    >
      <img
        src={src || defaultAvatar}
        alt={name || 'Avatar'}
        className="w-full h-full object-cover"
        loading="eager"
        onError={(e) => {
          const img = e.currentTarget;
          if (img.src !== defaultAvatar) {
            img.src = defaultAvatar;
          }
        }}
      />
    </div>
  );
};

