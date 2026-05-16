export function isE2eMode(source: Record<string, string | undefined> = process.env) {
  return source.ACADEMIC_HUB_E2E_MODE === "true";
}

export function getE2eQuotaBalance(quotaType: string) {
  switch (quotaType) {
    case "research_task_credits":
      return 30;
    case "paper_reading_credits":
      return 5;
    case "advanced_model_credits":
      return 2;
    default:
      return 0;
  }
}
