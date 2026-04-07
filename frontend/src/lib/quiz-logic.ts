/**
 * Client-side path derivation from quiz answers.
 * Mirrors backend/path_logic.py — keep in sync.
 */
import type { QuizAnswers } from "@/types";

const MOU_NATIONALITIES = new Set(["MM", "LA", "KH"]);
const BOI_NATIONALITIES = new Set(["US", "GB", "AU", "CA", "DE", "FR", "NL", "SE", "DK", "NO"]);

export function derivePath(answers: QuizAnswers): string {
  const { intent, work_type, nationality = "", has_job_offer, current_visa, urgency, special } = answers;
  const nat = nationality.toUpperCase();

  if (MOU_NATIONALITIES.has(nat) && work_type === "manual") return "mou_worker";
  if (intent === "own_business") return "non_b_self_employed";
  if (special === "thai_spouse") return "non_o_dependent";
  if (work_type === "creative" && intent === "work_remote") return "ltr_visa";
  if (work_type === "professional" && BOI_NATIONALITIES.has(nat) && (has_job_offer === "yes_thai" || has_job_offer === "yes_foreign")) return "smart_visa";
  if (work_type === "professional" && (has_job_offer === "yes_thai" || has_job_offer === "yes_foreign")) return "non_b_to_wp_professional";
  if (intent === "work_remote" && (work_type === "professional" || work_type === "creative")) return "ltr_visa";
  if ((current_visa === "tourist" || current_visa === "none") && urgency === "urgent") return "border_run_strategy";
  if ((intent === "work_remote" || intent === "exploring") && work_type === "creative") return "digital_nomad_grey";

  return "non_b_to_wp_professional";
}

export const PATH_LABELS: Record<string, string> = {
  mou_worker: "MOU Migrant Worker",
  non_b_to_wp_professional: "Non-B Visa + Work Permit (Employee)",
  non_b_self_employed: "Non-B Visa + Work Permit (Own Company)",
  ltr_visa: "Long-Term Resident (LTR) Visa",
  smart_visa: "SMART Visa",
  digital_nomad_grey: "Digital Nomad (Grey Area / TR60)",
  border_run_strategy: "Visa Exempt Extension Strategy",
  non_o_dependent: "Dependent / Spouse of Thai National",
};
