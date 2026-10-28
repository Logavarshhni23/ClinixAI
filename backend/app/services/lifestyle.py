"""
ClinixAI — Lifestyle-based chronic disease risk screening
=========================================================
The project title is "chronic disease detection using lifestyle data", so the
platform must reason about lifestyle, not only about symptoms.

Method (kept transparent on purpose — no hidden model, every point is visible):

* Type 2 Diabetes  -> Indian Diabetes Risk Score (IDRS, Mohan et al. 2005),
                      a published screening score built for Indian adults
                      (age, waist, physical activity, family history; max 100).
                      >= 60 high risk, 30-59 moderate risk, < 30 low risk.
* Hypertension     -> count of established modifiable / non-modifiable risk factors
* Heart disease    -> count of established risk factors
* Obesity          -> BMI with Asia-Pacific (WHO) cut-offs + waist circumference

Risk-factor counts are an educational screening aid, not a probability.
BMI uses the WHO Asia-Pacific cut-offs (overweight >= 23, obese >= 25) because
they are the ones recommended for South-Asian populations.
"""

from __future__ import annotations

from typing import List, Optional, Tuple

from app.models.schemas import (
    LifestyleAssessment,
    LifestyleCondition,
    LifestyleFactor,
    LifestyleInput,
)

LOW, ELEVATED, HIGH = "Low", "Elevated", "High"


def compute_bmi(height_cm: Optional[float], weight_kg: Optional[float]) -> Optional[float]:
    if not height_cm or not weight_kg or height_cm <= 0 or weight_kg <= 0:
        return None
    m = height_cm / 100.0
    return round(weight_kg / (m * m), 1)


def bmi_category(bmi: Optional[float]) -> Optional[str]:
    if bmi is None:
        return None
    if bmi < 18.5:
        return "Underweight"
    if bmi < 23:
        return "Normal"
    if bmi < 25:
        return "Overweight"
    return "Obese"


def has_enough_data(l: Optional[LifestyleInput]) -> bool:
    """Minimum needed for a meaningful lifestyle screening."""
    return bool(l and l.age and l.height_cm and l.weight_kg and l.sex)


def _level_from_count(count: int) -> str:
    if count >= 5:
        return HIGH
    if count >= 3:
        return ELEVATED
    return LOW


def _central_obesity(l: LifestyleInput) -> Optional[bool]:
    """South-Asian waist cut-offs (IDF): men >= 90 cm, women >= 80 cm."""
    if not l.waist_cm or not l.sex:
        return None
    return l.waist_cm >= (90 if l.sex == "male" else 80)


# ── Diabetes: IDRS ────────────────────────────────────────────────────────────

def _idrs(l: LifestyleInput) -> Tuple[int, int, List[LifestyleFactor], List[str]]:
    notes: List[str] = []
    factors: List[LifestyleFactor] = []
    score = 0
    max_score = 100

    # Age
    age = l.age or 0
    age_pts = 30 if age >= 50 else 20 if age >= 35 else 0
    score += age_pts
    factors.append(LifestyleFactor(label="Age", present=age_pts > 0,
                                   detail=f"{age} years ({age_pts} points)"))

    # Waist
    if l.waist_cm and l.sex:
        w = l.waist_cm
        if l.sex == "male":
            wp = 20 if w >= 100 else 10 if w >= 90 else 0
        else:
            wp = 20 if w >= 90 else 10 if w >= 80 else 0
        score += wp
        factors.append(LifestyleFactor(label="Waist circumference", present=wp > 0,
                                       detail=f"{w:g} cm ({wp} points)"))
    else:
        max_score -= 20
        notes.append("Waist circumference was not entered, so the diabetes score may be underestimated.")

    # Physical activity
    act_pts = {"active": 0, "moderate": 10, "sedentary": 20}.get(l.activity or "", None)
    if act_pts is None:
        max_score -= 20
        notes.append("Physical activity was not entered, so the diabetes score may be underestimated.")
    else:
        score += act_pts
        factors.append(LifestyleFactor(label="Physical inactivity", present=act_pts > 0,
                                       detail=f"{l.activity} ({act_pts} points)"))

    # Family history
    fam_pts = {"none": 0, "one_parent": 10, "both_parents": 20}.get(l.family_diabetes or "", None)
    if fam_pts is None:
        max_score -= 20
        notes.append("Family history of diabetes was not entered, so the score may be underestimated.")
    else:
        score += fam_pts
        factors.append(LifestyleFactor(label="Family history of diabetes", present=fam_pts > 0,
                                       detail=f"{(l.family_diabetes or '').replace('_', ' ')} ({fam_pts} points)"))

    return score, max_score, factors, notes


def _diabetes(l: LifestyleInput, bmi: Optional[float]) -> LifestyleCondition:
    score, max_score, factors, notes = _idrs(l)
    level = HIGH if score >= 60 else ELEVATED if score >= 30 else LOW

    # Extra (non-IDRS) context factors, shown but not added to the IDRS score
    if bmi is not None:
        factors.append(LifestyleFactor(label="BMI in overweight / obese range (>= 23)",
                                       present=bmi >= 23, detail=f"BMI {bmi}"))
    factors.append(LifestyleFactor(label="Sugary food or drinks every day", present=bool(l.sugary_food_daily)))

    summary = f"IDRS score {score} out of {max_score}."
    if l.known_high_sugar:
        notes.append("You reported a high blood-sugar reading or diagnosis. Please confirm with a fasting glucose / HbA1c test.")
        if level == LOW:
            level = ELEVATED
    if level == HIGH:
        summary += " High risk: a blood sugar test (fasting glucose or HbA1c) is recommended."
    elif level == ELEVATED:
        summary += " Moderate risk: consider a blood sugar test and lifestyle changes."
    else:
        summary += " Low risk based on these answers."
    return LifestyleCondition(condition="Type 2 Diabetes", risk_level=level, method="Indian Diabetes Risk Score (IDRS)",
                              score=score, max_score=max_score, summary=summary, factors=factors, notes=notes)


# ── Hypertension ──────────────────────────────────────────────────────────────

def _hypertension(l: LifestyleInput, bmi: Optional[float]) -> LifestyleCondition:
    f = [
        LifestyleFactor(label="Age 40 or above", present=bool(l.age and l.age >= 40), detail=f"{l.age} years" if l.age else None),
        LifestyleFactor(label="BMI in overweight / obese range (>= 23)", present=bool(bmi and bmi >= 23),
                        detail=f"BMI {bmi}" if bmi else None),
        LifestyleFactor(label="High-salt diet (pickles, papad, processed food)", present=bool(l.high_salt_diet)),
        LifestyleFactor(label="Physically inactive", present=l.activity == "sedentary"),
        LifestyleFactor(label="Current smoker", present=l.smoking == "current"),
        LifestyleFactor(label="Regular or heavy alcohol use", present=l.alcohol in ("regular", "heavy")),
        LifestyleFactor(label="Sleeps less than 6 hours", present=bool(l.sleep_hours and l.sleep_hours < 6),
                        detail=f"{l.sleep_hours:g} h" if l.sleep_hours else None),
        LifestyleFactor(label="Family history of high blood pressure", present=bool(l.family_hypertension)),
        LifestyleFactor(label="Eats few fruits and vegetables", present=l.eats_fruit_veg_daily is False),
    ]
    count = sum(1 for x in f if x.present)
    level = _level_from_count(count)
    notes: List[str] = []
    if l.known_high_bp:
        level = HIGH
        notes.append("You reported high blood pressure already. Please follow up with your doctor for regular monitoring.")
    summary = f"{count} of {len(f)} risk factors present."
    return LifestyleCondition(condition="Hypertension", risk_level=level, method="Risk-factor count",
                              score=count, max_score=len(f), summary=summary, factors=f, notes=notes)


# ── Heart disease ─────────────────────────────────────────────────────────────

def _heart(l: LifestyleInput, bmi: Optional[float]) -> LifestyleCondition:
    age_limit = 45 if l.sex == "male" else 55
    f = [
        LifestyleFactor(label=f"Age {age_limit}+ ({'men' if l.sex == 'male' else 'women'})",
                        present=bool(l.age and l.age >= age_limit), detail=f"{l.age} years" if l.age else None),
        LifestyleFactor(label="Current smoker", present=l.smoking == "current"),
        LifestyleFactor(label="BMI in overweight / obese range (>= 23)", present=bool(bmi and bmi >= 23),
                        detail=f"BMI {bmi}" if bmi else None),
        LifestyleFactor(label="Physically inactive", present=l.activity == "sedentary"),
        LifestyleFactor(label="Eats few fruits and vegetables", present=l.eats_fruit_veg_daily is False),
        LifestyleFactor(label="Family history of heart disease", present=bool(l.family_heart_disease)),
        LifestyleFactor(label="Known high blood pressure", present=bool(l.known_high_bp)),
        LifestyleFactor(label="Known high blood sugar / diabetes", present=bool(l.known_high_sugar)),
        LifestyleFactor(label="Heavy alcohol use", present=l.alcohol == "heavy"),
    ]
    count = sum(1 for x in f if x.present)
    level = _level_from_count(count)
    return LifestyleCondition(condition="Heart disease", risk_level=level, method="Risk-factor count",
                              score=count, max_score=len(f), summary=f"{count} of {len(f)} risk factors present.",
                              factors=f, notes=[])


# ── Obesity / metabolic ───────────────────────────────────────────────────────

def _obesity(l: LifestyleInput, bmi: Optional[float]) -> LifestyleCondition:
    central = _central_obesity(l)
    f = [
        LifestyleFactor(label="BMI 25 or above (obese, Asia-Pacific cut-off)", present=bool(bmi and bmi >= 25),
                        detail=f"BMI {bmi}" if bmi else None),
        LifestyleFactor(label="BMI 23 to 24.9 (overweight, Asia-Pacific cut-off)", present=bool(bmi and 23 <= bmi < 25)),
    ]
    if central is not None:
        f.append(LifestyleFactor(label="Central obesity (waist >= 90 cm men / 80 cm women)", present=central,
                                 detail=f"{l.waist_cm:g} cm"))
    f.append(LifestyleFactor(label="Physically inactive", present=l.activity == "sedentary"))
    f.append(LifestyleFactor(label="Sugary food or drinks every day", present=bool(l.sugary_food_daily)))

    if bmi is not None and bmi >= 25:
        level = HIGH
    elif (bmi is not None and bmi >= 23) or central:
        level = ELEVATED
    else:
        level = LOW
    notes: List[str] = []
    if bmi is not None and bmi < 18.5:
        notes.append("Your BMI is below 18.5 (underweight). Low body weight can also affect health, so consider a nutrition check-up.")
    summary = f"BMI {bmi} ({bmi_category(bmi)})." if bmi is not None else "BMI could not be calculated."
    return LifestyleCondition(condition="Obesity / metabolic risk", risk_level=level, method="BMI (Asia-Pacific cut-offs) + waist",
                              score=None, max_score=None, summary=summary, factors=f, notes=notes)


# ── Advice ────────────────────────────────────────────────────────────────────

def _advice(l: LifestyleInput, bmi: Optional[float], conditions: List[LifestyleCondition]) -> List[str]:
    tips: List[str] = []
    if l.activity == "sedentary":
        tips.append("Move more: aim for at least 150 minutes of moderate activity a week (for example 30 minutes of brisk walking on most days).")
    if l.high_salt_diet:
        tips.append("Cut salt: keep it under 5 g (about one teaspoon) a day, and go easy on pickles, papad, chips and packaged food.")
    if l.eats_fruit_veg_daily is False:
        tips.append("Eat more fruit and vegetables: aim for about 400 g (five portions) a day.")
    if l.sugary_food_daily:
        tips.append("Reduce sugary drinks, sweets and refined snacks.")
    if l.smoking == "current":
        tips.append("Stop smoking or tobacco use: ask your doctor about quit-smoking support. It lowers heart, lung and diabetes risk.")
    if l.alcohol in ("regular", "heavy"):
        tips.append("Reduce alcohol. If you drink regularly, ask a doctor how to cut down safely.")
    if l.sleep_hours and l.sleep_hours < 6:
        tips.append("Improve sleep: most adults need 7 to 8 hours a night.")
    if bmi is not None and bmi >= 23:
        tips.append("Losing even 5 to 7 percent of body weight lowers the risk of diabetes and high blood pressure.")
    if any(c.risk_level in (ELEVATED, HIGH) for c in conditions) or (l.age and l.age >= 30):
        tips.append("Get your blood pressure, fasting blood sugar (or HbA1c) and cholesterol checked regularly, at least once a year.")
    return tips


# ── Public entry point ────────────────────────────────────────────────────────

def assess_lifestyle(l: LifestyleInput) -> LifestyleAssessment:
    bmi = compute_bmi(l.height_cm, l.weight_kg)
    conditions = [_diabetes(l, bmi), _hypertension(l, bmi), _heart(l, bmi), _obesity(l, bmi)]
    return LifestyleAssessment(
        bmi=bmi,
        bmi_category=bmi_category(bmi),
        conditions=conditions,
        advice=_advice(l, bmi, conditions),
    )
