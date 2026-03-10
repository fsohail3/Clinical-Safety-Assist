export interface VitalEntry {
  mode: "value" | "range";
  value?: number | null;
  value2?: number | null;
  unit?: string;
  rangeKey?: string | null;
  rangeLabel?: string | null;
  rangeBand?: { min: number | null; max: number | null; unit: string } | null;
}

export interface PatientContext {
  ageRange?: "child" | "adolescent" | "adult" | "older_adult";
  ageInputMode?: "select" | "typed";
  ageYears?: number | null;
  ageYearsGrouped?: "90+" | null;
  sexAtBirth?: "male" | "female" | "unknown";
  pregnancy?: "yes" | "no" | "unknown";
  weightRange?: "underweight" | "normal" | "overweight" | "obese";
  weightInputMode?: "select" | "typed";
  weightValue?: number | null;
  weightUnit?: "lb" | "kg" | null;
  symptoms?: string[];
  vitals?: {
    bloodPressure?: "low" | "normal" | "elevated" | "high";
    heartRate?: "bradycardia" | "normal" | "tachycardia";
    temperature?: "hypothermia" | "normal" | "fever" | "high_fever";
    oxygenSat?: "critical" | "low" | "normal";
  };
  vitalsV2?: {
    bloodPressure?: VitalEntry;
    heartRate?: VitalEntry;
    respiratoryRate?: VitalEntry;
    temperature?: VitalEntry;
    temperatureUnit?: "F" | "C";
    oxygenSat?: VitalEntry;
    weight?: VitalEntry;
    height?: VitalEntry;
    bmiCategory?: string;
  };
  allergies?: string[];
  pmh?: string[];
  medications?: string[];
  redFlagSymptoms?: string[];
  comorbidities?: string[];
  immunosuppressed?: "yes" | "no" | "unknown";
  travelRegion?: string;
  labs?: {
    wbc?: "low" | "normal" | "elevated";
    hemoglobin?: "low" | "normal" | "elevated";
    platelets?: "low" | "normal" | "elevated";
    creatinine?: "normal" | "elevated";
  };
}

export interface GenerateRequest {
  mode: "clinical_support" | "procedure_checklist";
  patientContext?: PatientContext;
  complaintText?: string;
  complaintDuration?: "hours" | "days" | "weeks" | "months";
  procedureName?: string;
  setting?: "inpatient" | "outpatient" | "ed" | "clinic";
  anesthesiaType?: "none" | "local" | "regional" | "general";
}

export type Bullet = string | { text: string; refIds?: string[] };

export interface Reference {
  number: number;
  apa: string;
  url: string;
}

export interface GenerateResponse {
  requestId: string;
  mode: string;
  output: {
    summary: string;
    sections: Array<{
      title: string;
      bullets: Bullet[];
    }>;
    codes: {
      icd10?: Array<{ code: string; label: string; rationale: string }>;
      cpt?: Array<{ code_family: string; label: string; rationale: string }>;
    };
    safety: {
      redFlags: string[];
      limitations: string[];
    };
    references?: Reference[];
    referenceNote?: string;
  };
}

export interface FollowUpTurn {
  question: string;
  answer: string;
}

export interface FollowUpRequest {
  mode: "clinical_support" | "procedure_checklist";
  originalRequest: GenerateRequest;
  originalOutput: GenerateResponse["output"];
  followUpHistory: FollowUpTurn[];
  newQuestion: string;
}

export interface FollowUpResponse {
  requestId: string;
  answer: string;
  disclaimer: string;
}

export interface UsageData {
  freeQueriesUsed: number;
  hasSubscription: boolean;
  totalQueriesUsed: number;
}

export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}
