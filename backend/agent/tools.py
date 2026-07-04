"""Deterministic tools — pure functions, no LLM inside. Dates and codes in,
booleans and numbers out. The agent never does arithmetic itself; the trace
shows the exact inputs and outputs of every call.
"""

import json
from datetime import date, datetime, timedelta

from backend import config

_DAYS_PER_MONTH = 30.4375  # average Gregorian month


def _parse(value: str) -> date:
    return datetime.strptime(value.strip(), "%Y-%m-%d").date()


def date_window_calculator(start_date: str, end_date: str, required_weeks: float) -> dict:
    """Duration between two dates, in days and weeks, vs a required minimum."""
    start, end = _parse(start_date), _parse(end_date)
    days = (end - start).days
    weeks = round(days / 7, 1)
    required = float(required_weeks)
    return {
        "start_date": start_date,
        "end_date": end_date,
        "days": days,
        "weeks": weeks,
        "required_weeks": required,
        "satisfied": weeks >= required,
    }


def months_since(event_date: str, reference_date: str) -> dict:
    """Elapsed time from an event to a reference date, in months and days."""
    event, reference = _parse(event_date), _parse(reference_date)
    days = (reference - event).days
    months = round(days / _DAYS_PER_MONTH, 1)
    return {
        "event_date": event_date,
        "reference_date": reference_date,
        "days": days,
        "months": months,
    }


def code_consistency_check(cpt: str, icd10: str) -> dict:
    """Whether a CPT/ICD-10 pairing is consistent per the reference table."""
    reference = json.loads((config.CORPUS_DIR / "cpt_icd_reference.json").read_text())
    entry = reference.get(cpt)
    if entry is None:
        return {
            "cpt": cpt,
            "icd10": icd10,
            "consistent": False,
            "cpt_description": None,
            "allowed_icd10": [],
            "reason": f"CPT {cpt} not found in reference table",
        }
    consistent = icd10 in entry["consistent_icd10"]
    return {
        "cpt": cpt,
        "icd10": icd10,
        "consistent": consistent,
        "cpt_description": entry["description"],
        "allowed_icd10": entry["consistent_icd10"],
    }


def appeal_deadline(denial_date: str, window_days: int, today: str | None = None) -> dict:
    """Filing deadline and days remaining for an appeal window."""
    deadline = _parse(denial_date) + timedelta(days=window_days)
    reference = _parse(today) if today else date.today()
    days_remaining = (deadline - reference).days
    return {
        "denial_date": denial_date,
        "window_days": window_days,
        "deadline": deadline.isoformat(),
        "reference_date": reference.isoformat(),
        "days_remaining": days_remaining,
        "expired": days_remaining < 0,
    }
