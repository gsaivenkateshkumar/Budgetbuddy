import { apiFetch } from "./client";
import { getToken } from "@/lib/auth/session";

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type Stage = "idea" | "validation" | "planning" | "pre_launch" | "launched" | "operating";
export type DeliveryMode = "online" | "offline" | "hybrid";
export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type EntryType = "revenue" | "expense";
export type Confidence = "Low" | "Medium" | "High";

export interface BusinessProject {
  id: number;
  name: string;
  description: string | null;
  industry: string | null;
  location: string | null;
  stage: Stage;
  startup_budget: string | null;
  currency: string;
  target_customer: string | null;
  business_model: string | null;
  experience_level: string | null;
  delivery_mode: DeliveryMode | null;
  time_commitment: string | null;
  goals: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessProjectInput {
  name: string;
  description?: string;
  industry?: string;
  location?: string;
  startup_budget?: string;
  target_customer?: string;
  business_model?: string;
  experience_level?: string;
  delivery_mode?: DeliveryMode;
  time_commitment?: string;
  goals?: string;
}

export function createBusiness(input: BusinessProjectInput): Promise<BusinessProject> {
  return apiFetch<BusinessProject>("/businesses", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
}

export function listBusinesses(): Promise<BusinessProject[]> {
  return apiFetch<BusinessProject[]>("/businesses", { headers: authHeaders() });
}

export function getBusiness(id: number): Promise<BusinessProject> {
  return apiFetch<BusinessProject>(`/businesses/${id}`, { headers: authHeaders() });
}

export function updateBusiness(id: number, patch: Partial<BusinessProjectInput & { stage: Stage }>): Promise<BusinessProject> {
  return apiFetch<BusinessProject>(`/businesses/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
}

export interface ValidationScores {
  demand: number;
  differentiation: number;
  business_model: number;
  capital: number;
  operational: number;
  gtm: number;
  total: number;
}

export interface ValidationReportSections {
  business_summary: string;
  target_customer: string;
  problem_being_solved: string;
  revenue_model: string;
  startup_requirements: string;
  estimated_cost_areas: string[];
  operational_complexity: string;
  competition_considerations: string;
  differentiation_opportunities: string;
  major_risks: string[];
  questions_to_validate: string[];
  recommended_next_actions: string[];
}

export interface ValidationReport {
  id: number;
  business_project_id: number;
  scores: ValidationScores;
  confidence: Confidence;
  verdict: string;
  missing_info: string[];
  sections: ValidationReportSections;
  created_at: string;
}

export function validateBusiness(id: number): Promise<ValidationReport> {
  return apiFetch<ValidationReport>(`/businesses/${id}/validate`, { method: "POST", headers: authHeaders() });
}

export function getLatestValidation(id: number): Promise<ValidationReport> {
  return apiFetch<ValidationReport>(`/businesses/${id}/validation`, { headers: authHeaders() });
}

export interface BudgetItem {
  id: number;
  category: string;
  amount: string;
  notes: string | null;
}

export interface BudgetItemInput {
  category: string;
  amount: string;
  notes?: string;
}

export interface Budget {
  items: BudgetItem[];
  total: string;
}

export function getBudget(businessId: number): Promise<Budget> {
  return apiFetch<Budget>(`/businesses/${businessId}/budget`, { headers: authHeaders() });
}

export function putBudget(businessId: number, items: BudgetItemInput[]): Promise<Budget> {
  return apiFetch<Budget>(`/businesses/${businessId}/budget`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ items }),
  });
}

export interface BusinessTask {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  week: number | null;
  order_index: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export function listTasks(businessId: number): Promise<BusinessTask[]> {
  return apiFetch<BusinessTask[]>(`/businesses/${businessId}/tasks`, { headers: authHeaders() });
}

export function createTask(
  businessId: number,
  input: { title: string; description?: string; category?: string; priority?: TaskPriority; week?: number }
): Promise<BusinessTask> {
  return apiFetch<BusinessTask>(`/businesses/${businessId}/tasks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
}

export function updateTask(businessId: number, taskId: number, patch: { status?: TaskStatus }): Promise<BusinessTask> {
  return apiFetch<BusinessTask>(`/businesses/${businessId}/tasks/${taskId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
}

export function generateRoadmap(businessId: number): Promise<BusinessTask[]> {
  return apiFetch<BusinessTask[]>(`/businesses/${businessId}/tasks/generate-roadmap`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export interface FinancialEntry {
  id: number;
  type: EntryType;
  amount: string;
  category: string | null;
  description: string | null;
  entry_date: string;
  created_at: string;
}

export function listFinancials(businessId: number): Promise<FinancialEntry[]> {
  return apiFetch<FinancialEntry[]>(`/businesses/${businessId}/financials`, { headers: authHeaders() });
}

export function createFinancialEntry(
  businessId: number,
  input: { type: EntryType; amount: string; category?: string; description?: string; entry_date: string }
): Promise<FinancialEntry> {
  return apiFetch<FinancialEntry>(`/businesses/${businessId}/financials`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
}

export interface FinancialSummary {
  total_revenue: string;
  total_expenses: string;
  net_result: string;
  expense_breakdown: { category: string; total: string }[];
  entry_count: number;
}

export function getFinancialSummary(businessId: number): Promise<FinancialSummary> {
  return apiFetch<FinancialSummary>(`/businesses/${businessId}/financials/summary`, { headers: authHeaders() });
}

// ---- Calculators (stateless, no auth) --------------------------------------

export interface BreakEvenResult {
  contribution_per_unit: string;
  break_even_units: string | null;
  break_even_revenue: string | null;
  is_viable: boolean;
  explanation: string;
}

export function calculateBreakEven(input: {
  fixed_costs: string;
  selling_price: string;
  variable_cost_per_unit: string;
}): Promise<BreakEvenResult> {
  return apiFetch<BreakEvenResult>("/calculators/break-even", { method: "POST", body: JSON.stringify(input) });
}

export interface MarginResult {
  gross_profit: string;
  gross_margin_pct: string | null;
  operating_profit: string;
  operating_margin_pct: string | null;
  explanation: string;
}

export function calculateMargin(input: {
  revenue: string;
  cogs: string;
  operating_expenses: string;
}): Promise<MarginResult> {
  return apiFetch<MarginResult>("/calculators/margin", { method: "POST", body: JSON.stringify(input) });
}

export interface PricingResult {
  suggested_price: string;
  profit_per_unit: string;
  explanation: string;
}

export function calculatePricing(input: {
  cost_per_unit: string;
  desired_margin_pct: string;
  fees_pct?: string;
}): Promise<PricingResult> {
  return apiFetch<PricingResult>("/calculators/pricing", { method: "POST", body: JSON.stringify(input) });
}

export interface WhatIfResult {
  current_profit: string;
  projected_profit: string;
  change: string;
  explanation: string;
}

export function calculateWhatIf(input: {
  current_monthly_profit: string;
  additional_monthly_cost?: string;
  additional_monthly_revenue?: string;
}): Promise<WhatIfResult> {
  return apiFetch<WhatIfResult>("/calculators/what-if", { method: "POST", body: JSON.stringify(input) });
}
