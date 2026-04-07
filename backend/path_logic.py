"""
Quiz answer → derived immigration path mapping.
Mirrors src/lib/quiz-logic.ts on the frontend.
"""

MOU_NATIONALITIES = {"MM", "LA", "KH"}
BOI_NATIONALITIES = {"US", "GB", "AU", "CA", "DE", "FR", "NL", "SE", "DK", "NO"}


def derive_path(answers: dict) -> str:
    """
    Map quiz answers to one of the canonical immigration path IDs.

    Expected answers keys:
      intent        : work_company | work_remote | own_business | exploring
      work_type     : manual | professional | creative
      nationality   : ISO 3166-1 alpha-2 code (e.g. "US", "MM")
      has_job_offer : yes_thai | yes_foreign | no | self_employed
      current_visa  : none | tourist | non_b | other
      urgency       : exploring | planning | urgent
    """
    intent = answers.get("intent", "")
    work_type = answers.get("work_type", "")
    nationality = answers.get("nationality", "").upper()
    has_job_offer = answers.get("has_job_offer", "")
    current_visa = answers.get("current_visa", "")

    # MOU migrant worker
    if nationality in MOU_NATIONALITIES and work_type == "manual":
        return "mou_worker"

    # Own business / company formation
    if intent == "own_business":
        return "non_b_self_employed"

    # Thai spouse / dependent (flagged via quiz answer)
    if answers.get("special") == "thai_spouse":
        return "non_o_dependent"

    # LTR Visa — digital/creative remote worker
    if work_type in ("creative",) and intent == "work_remote":
        return "ltr_visa"

    # SMART Visa — professional at BOI-eligible company
    if work_type == "professional" and nationality in BOI_NATIONALITIES and has_job_offer in ("yes_thai", "yes_foreign"):
        return "smart_visa"

    # Professional employee with job offer → standard Non-B + WP route
    if work_type == "professional" and has_job_offer in ("yes_thai", "yes_foreign"):
        return "non_b_to_wp_professional"

    # Remote worker / nomad exploring grey area
    if intent == "work_remote" and work_type in ("professional", "creative"):
        return "ltr_visa"

    # Urgent on tourist / exempt visa → border run strategy
    if current_visa in ("tourist", "none") and answers.get("urgency") == "urgent":
        return "border_run_strategy"

    # Digital nomad exploring
    if intent in ("work_remote", "exploring") and work_type == "creative":
        return "digital_nomad_grey"

    # Default fallback
    return "non_b_to_wp_professional"
