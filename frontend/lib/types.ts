// Mirrors backend-core's DTOs (dto/response/*.java). Keep in sync by hand —
// there are few enough of these that generating a client isn't worth it yet.

export type Role = "USER" | "ADMIN" | "MODERATOR";

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  roles: Role[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: UserResponse;
}

export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
export type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";
export type DietaryPreference = "VEGETARIAN" | "VEGAN" | "NON_VEGETARIAN" | "EGGETARIAN" | "PESCATARIAN";

export interface MedicalConditionResponse {
  code: string;
  name: string;
  severity: string | null;
  notes: string | null;
  diagnosedAt: string | null;
}

export interface HealthGoalResponse {
  code: string;
  name: string;
  targetValue: number | null;
  targetDate: string | null;
}

export interface HealthProfileResponse {
  id: number;
  age: number | null;
  gender: Gender | null;
  weightKg: number | null;
  heightCm: number | null;
  activityLevel: ActivityLevel | null;
  dietaryPreference: DietaryPreference | null;
  conditions: MedicalConditionResponse[];
  goals: HealthGoalResponse[];
  allergies: string[];
}

export type ReportType = "BLOOD" | "CBC" | "LIPID_PROFILE" | "HBA1C" | "THYROID" | "VITAMIN" | "OTHER";
export type ProcessingStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type ValueStatus = "NORMAL" | "LOW" | "HIGH" | "DEFICIENT" | "CRITICAL";

export interface MedicalReportResponse {
  id: number;
  reportType: ReportType;
  originalFilename: string;
  processingStatus: ProcessingStatus;
  failureReason: string | null;
  summary: string | null;
  suggestions: string[];
  uploadedAt: string;
  processedAt: string | null;
}

export interface ReportExtractedValueResponse {
  parameterName: string;
  value: number | null;
  unit: string | null;
  referenceRangeLow: number | null;
  referenceRangeHigh: number | null;
  status: ValueStatus;
}

export interface ProductScanResponse {
  id: number;
  processingStatus: ProcessingStatus;
  failureReason: string | null;
  productId: number | null;
  uploadedAt: string;
  processedAt: string | null;
}

export interface ProductNutritionResponse {
  servingSize: string | null;
  calories: number | null;
  proteinG: number | null;
  fatG: number | null;
  saturatedFatG: number | null;
  carbsG: number | null;
  sugarG: number | null;
  fiberG: number | null;
  sodiumMg: number | null;
  cholesterolMg: number | null;
  extraNutrients: Record<string, unknown>;
}

export interface ProductResponse {
  id: number;
  barcode: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  description: string | null;
  source: "USER_SCANNED" | "CATALOG" | "MANUAL";
  nutrition: ProductNutritionResponse | null;
  createdAt: string;
}

export interface ProductAlternativeResponse {
  productId: number;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  nutritionSimilarityPct: number;
  tasteSimilarityPct: number;
  healthScore: number;
  rank: number;
}

export interface ProductScoreResponse {
  productId: number;
  suitabilityScore: number;
  healthScore: number;
  nutritionScore: number;
  riskScore: number;
  reasoning: string[];
  recommendedDailyQuantity: string;
  maxDailyQuantity: string;
}

export interface PeopleLikeYouItemResponse {
  productId: number;
  name: string;
  brand: string | null;
  score: number;
  reasoning: string;
}

export interface ReviewResponse {
  id: number;
  userId: number;
  userFullName: string;
  reviewText: string;
  createdAt: string;
}

export interface RatingResponse {
  id: number;
  tasteRating: number;
  healthinessRating: number;
  digestibilityRating: number;
  satisfactionRating: number;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
  timestamp: string;
}