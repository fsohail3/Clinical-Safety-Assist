export interface PhiCheckResult {
  isClean: boolean;
  blockedPatterns: string[];
}

const PHI_PATTERNS = [
  { pattern: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, name: "Social Security Number" },
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, name: "Phone Number" },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, name: "Email Address" },
  { pattern: /\b\d{1,5}\s+[A-Za-z]+(\s+[A-Za-z]+)*\s+(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|way|place|pl)\b/gi, name: "Street Address" },
  { pattern: /\b(MRN|mrn|medical record number|chart number|patient id)[\s:]*[A-Za-z0-9-]+\b/gi, name: "Medical Record Number" },
  { pattern: /\b(patient name|pt name|patient is|name is)[\s:]+[A-Za-z]+/gi, name: "Patient Name Reference" },
  { pattern: /\b(DOB|date of birth|birthday|born on)[\s:]*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi, name: "Date of Birth" },
  { pattern: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g, name: "Full Date" },
  { pattern: /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi, name: "Full Date (written)" },
  { pattern: /\b\d{5}(-\d{4})?\b/g, name: "ZIP Code" },
  { pattern: /\b(account|acct|policy)[\s#:]*\d{6,}\b/gi, name: "Account Number" },
  { pattern: /\b[A-Z]{1,2}\d{6,10}\b/g, name: "License/ID Number" },
  { pattern: /\b(admitted on|discharged on|seen on|visit date)[\s:]*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi, name: "Service Date" },
];

const COMMON_NAMES = [
  "smith", "johnson", "williams", "brown", "jones", "garcia", "miller", "davis",
  "rodriguez", "martinez", "hernandez", "lopez", "gonzalez", "wilson", "anderson",
  "thomas", "taylor", "moore", "jackson", "martin", "lee", "perez", "thompson",
  "white", "harris", "sanchez", "clark", "ramirez", "lewis", "robinson", "walker",
  "young", "allen", "king", "wright", "scott", "torres", "nguyen", "hill", "flores",
  "green", "adams", "nelson", "baker", "hall", "rivera", "campbell", "mitchell",
  "carter", "roberts"
];

export function checkForPhi(text: string): PhiCheckResult {
  const blockedPatterns: string[] = [];

  for (const { pattern, name } of PHI_PATTERNS) {
    const newPattern = new RegExp(pattern.source, pattern.flags);
    if (newPattern.test(text)) {
      if (!blockedPatterns.includes(name)) {
        blockedPatterns.push(name);
      }
    }
  }

  const words = text.toLowerCase().split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, "");
    if (COMMON_NAMES.includes(cleanWord) && cleanWord.length > 3) {
      const context = text.toLowerCase();
      if (
        context.includes(`mr. ${cleanWord}`) ||
        context.includes(`mrs. ${cleanWord}`) ||
        context.includes(`ms. ${cleanWord}`) ||
        context.includes(`dr. ${cleanWord}`) ||
        context.includes(`patient ${cleanWord}`) ||
        context.includes(`pt ${cleanWord}`)
      ) {
        if (!blockedPatterns.includes("Possible Patient Name")) {
          blockedPatterns.push("Possible Patient Name");
        }
      }
    }
  }

  return {
    isClean: blockedPatterns.length === 0,
    blockedPatterns,
  };
}
