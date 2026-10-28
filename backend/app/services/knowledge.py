"""
ClinixAI — Clinical knowledge tables
====================================
Static, human-readable domain knowledge used by the inference engine:

* clean display names for the 41 conditions (the raw dataset labels contain typos)
* condition type  (Chronic / Acute-Infectious / Emergency / Recurrent)
* body-system grouping of every symptom (served to the UI)
* red-flag symptom rules that must trigger an "urgent care" warning no matter
  which disease the model ranks first

Nothing in here is learned from data; it is ordinary medical common knowledge
kept in one place so it can be reviewed and edited easily.
"""

from __future__ import annotations

from typing import Dict, List, Set, Tuple


def clean_name(name: str) -> str:
    """Collapse repeated whitespace so raw dataset labels can be matched reliably."""
    return " ".join(str(name).split())


# ── Condition types ───────────────────────────────────────────────────────────
CHRONIC = "Chronic"
ACUTE = "Acute / Infectious"
EMERGENCY = "Emergency"
RECURRENT = "Recurrent / Episodic"

# raw (whitespace-collapsed) label -> (display name, condition type)
DISEASE_META: Dict[str, Tuple[str, str]] = {
    "(vertigo) Paroymsal Positional Vertigo": ("Vertigo (Benign Paroxysmal Positional)", RECURRENT),
    "AIDS": ("HIV / AIDS", CHRONIC),
    "Acne": ("Acne", CHRONIC),
    "Alcoholic hepatitis": ("Alcoholic hepatitis", CHRONIC),
    "Allergy": ("Allergy", RECURRENT),
    "Arthritis": ("Arthritis", CHRONIC),
    "Bronchial Asthma": ("Bronchial asthma", CHRONIC),
    "Cervical spondylosis": ("Cervical spondylosis", CHRONIC),
    "Chicken pox": ("Chicken pox", ACUTE),
    "Chronic cholestasis": ("Chronic cholestasis", CHRONIC),
    "Common Cold": ("Common cold", ACUTE),
    "Dengue": ("Dengue", ACUTE),
    "Diabetes": ("Diabetes", CHRONIC),
    "Dimorphic hemorrhoids(piles)": ("Hemorrhoids (piles)", RECURRENT),
    "Drug Reaction": ("Drug reaction", ACUTE),
    "Fungal infection": ("Fungal infection", ACUTE),
    "GERD": ("GERD (acid reflux disease)", CHRONIC),
    "Gastroenteritis": ("Gastroenteritis", ACUTE),
    "Heart attack": ("Heart attack", EMERGENCY),
    "Hepatitis B": ("Hepatitis B", CHRONIC),
    "Hepatitis C": ("Hepatitis C", CHRONIC),
    "Hepatitis D": ("Hepatitis D", CHRONIC),
    "Hepatitis E": ("Hepatitis E", ACUTE),
    "Hypertension": ("Hypertension (high blood pressure)", CHRONIC),
    "Hyperthyroidism": ("Hyperthyroidism", CHRONIC),
    "Hypoglycemia": ("Hypoglycemia (low blood sugar)", RECURRENT),
    "Hypothyroidism": ("Hypothyroidism", CHRONIC),
    "Impetigo": ("Impetigo", ACUTE),
    "Jaundice": ("Jaundice", ACUTE),
    "Malaria": ("Malaria", ACUTE),
    "Migraine": ("Migraine", RECURRENT),
    "Osteoarthristis": ("Osteoarthritis", CHRONIC),
    "Paralysis (brain hemorrhage)": ("Paralysis (brain hemorrhage)", EMERGENCY),
    "Peptic ulcer diseae": ("Peptic ulcer disease", CHRONIC),
    "Pneumonia": ("Pneumonia", ACUTE),
    "Psoriasis": ("Psoriasis", CHRONIC),
    "Tuberculosis": ("Tuberculosis", ACUTE),
    "Typhoid": ("Typhoid", ACUTE),
    "Urinary tract infection": ("Urinary tract infection", ACUTE),
    "Varicose veins": ("Varicose veins", CHRONIC),
    "hepatitis A": ("Hepatitis A", ACUTE),
}


def display_name(raw: str) -> str:
    return DISEASE_META.get(clean_name(raw), (clean_name(raw), ACUTE))[0]


def condition_type(raw: str) -> str:
    return DISEASE_META.get(clean_name(raw), (clean_name(raw), ACUTE))[1]


# ── Symptom grouping ──────────────────────────────────────────────────────────
RISK_GROUP = "Risk factors & history"

_GROUPS: Dict[str, List[str]] = {
    "General & Fever": [
        "fatigue", "lethargy", "malaise", "mild_fever", "high_fever", "chills",
        "shivering", "sweating", "weight_loss", "weight_gain", "dehydration",
        "restlessness", "toxic_look_(typhos)", "swelled_lymph_nodes",
    ],
    "Head, Brain & Nerves": [
        "headache", "dizziness", "spinning_movements", "loss_of_balance",
        "unsteadiness", "altered_sensorium", "coma", "slurred_speech",
        "weakness_of_one_body_side", "lack_of_concentration", "stiff_neck",
        "visual_disturbances", "blurred_and_distorted_vision", "pain_behind_the_eyes",
    ],
    "Mood & Mind": ["anxiety", "depression", "irritability", "mood_swings"],
    "Eyes, Nose, Throat & Mouth": [
        "redness_of_eyes", "watering_from_eyes", "sinus_pressure", "runny_nose",
        "congestion", "continuous_sneezing", "throat_irritation", "patches_in_throat",
        "loss_of_smell", "drying_and_tingling_lips", "ulcers_on_tongue",
        "puffy_face_and_eyes", "sunken_eyes",
    ],
    "Chest, Heart & Breathing": [
        "chest_pain", "breathlessness", "cough", "phlegm", "mucoid_sputum",
        "rusty_sputum", "blood_in_sputum", "fast_heart_rate", "palpitations",
    ],
    "Circulation & Swelling": [
        "swollen_legs", "swollen_extremeties", "swollen_blood_vessels",
        "prominent_veins_on_calf", "cold_hands_and_feets", "fluid_overload",
    ],
    "Stomach & Digestion": [
        "nausea", "vomiting", "abdominal_pain", "stomach_pain", "belly_pain",
        "acidity", "indigestion", "loss_of_appetite", "increased_appetite",
        "excessive_hunger", "diarrhoea", "constipation", "passage_of_gases",
        "distention_of_abdomen", "swelling_of_stomach", "stomach_bleeding",
        "bloody_stool", "irritation_in_anus", "pain_during_bowel_movements",
        "pain_in_anal_region",
    ],
    "Liver & Jaundice": ["yellowish_skin", "yellowing_of_eyes", "acute_liver_failure", "dark_urine"],
    "Urine & Reproductive": [
        "burning_micturition", "spotting_urination", "polyuria", "bladder_discomfort",
        "continuous_feel_of_urine", "foul_smell_of_urine", "yellow_urine",
        "abnormal_menstruation",
    ],
    "Skin, Hair & Nails": [
        "itching", "internal_itching", "skin_rash", "nodal_skin_eruptions",
        "dischromic_patches", "blister", "skin_peeling", "silver_like_dusting",
        "pus_filled_pimples", "blackheads", "scurring", "red_spots_over_body",
        "yellow_crust_ooze", "red_sore_around_nose", "bruising", "brittle_nails",
        "inflammatory_nails", "small_dents_in_nails",
    ],
    "Muscles & Joints": [
        "joint_pain", "knee_pain", "hip_joint_pain", "back_pain", "neck_pain",
        "muscle_pain", "muscle_wasting", "muscle_weakness", "weakness_in_limbs",
        "swelling_joints", "painful_walking", "movement_stiffness", "cramps",
    ],
    "Metabolic & Hormonal": ["irregular_sugar_level", "enlarged_thyroid"],
    # Not symptoms: histories and exposures that the original dataset mixed in
    RISK_GROUP: [
        "family_history", "history_of_alcohol_consumption", "obesity",
        "receiving_blood_transfusion", "receiving_unsterile_injections",
        "extra_marital_contacts",
    ],
}

SYMPTOM_GROUP: Dict[str, str] = {s: g for g, syms in _GROUPS.items() for s in syms}
GROUP_ORDER: List[str] = list(_GROUPS.keys())

# Columns in the raw data that are artefacts, not selectable symptoms
HIDDEN_SYMPTOMS: Set[str] = {"prognosis", "foul_smell_ofurine"}
# Duplicate spellings that must be folded into one feature
SYMPTOM_ALIASES: Dict[str, str] = {"foul_smell_ofurine": "foul_smell_of_urine"}

# Friendlier labels where the id reads badly
LABEL_OVERRIDES: Dict[str, str] = {
    "toxic_look_(typhos)": "Toxic look (typhos)",
    "scurring": "Skin scarring",
    "cold_hands_and_feets": "Cold hands and feet",
    "swollen_extremeties": "Swollen extremities",
    "dischromic_patches": "Discoloured skin patches",
    "spotting_urination": "Blood spotting in urine",
    "diarrhoea": "Diarrhoea",
    "extra_marital_contacts": "Unprotected / multiple sexual contacts",
    "receiving_unsterile_injections": "Received unsterile injections",
    "receiving_blood_transfusion": "Received blood transfusion",
    "history_of_alcohol_consumption": "History of heavy alcohol use",
    "family_history": "Family history of the condition",
    "obesity": "Obesity",
    "irregular_sugar_level": "Irregular blood sugar level",
}


def is_real_symptom(symptom_id: str) -> bool:
    return SYMPTOM_GROUP.get(symptom_id, "") != RISK_GROUP


# ── Red-flag rules ────────────────────────────────────────────────────────────
# Each rule: (title, message, symptoms that must ALL be present, or "any_of" list)
# A rule fires when `all_of` are all selected AND (if given) at least one of `any_of` is.
RED_FLAGS: List[dict] = [
    {
        "title": "Possible heart emergency",
        "message": "Chest pain together with breathlessness, sweating or a racing heart can be a heart attack. "
                   "Call emergency services (112 in India) or go to the nearest hospital now.",
        "all_of": ["chest_pain"],
        "any_of": ["breathlessness", "sweating", "fast_heart_rate", "palpitations", "vomiting"],
    },
    {
        "title": "Possible stroke / brain emergency",
        "message": "One-sided weakness, slurred speech, confusion or loss of consciousness need emergency care immediately. "
                   "Do not wait to see if it improves.",
        "all_of": [],
        "any_of": ["weakness_of_one_body_side", "slurred_speech", "altered_sensorium", "coma"],
    },
    {
        "title": "Possible meningitis warning",
        "message": "Fever with a stiff neck (especially with headache or confusion) needs urgent medical assessment.",
        "all_of": ["stiff_neck", "high_fever"],
        "any_of": [],
    },
    {
        "title": "Bleeding warning",
        "message": "Coughing up blood, bloody stool or stomach bleeding should be checked by a doctor urgently.",
        "all_of": [],
        "any_of": ["blood_in_sputum", "bloody_stool", "stomach_bleeding"],
    },
    {
        "title": "Severe dehydration warning",
        "message": "Dehydration with vomiting or diarrhoea can become dangerous quickly. Start oral rehydration and see a doctor today.",
        "all_of": ["dehydration"],
        "any_of": ["vomiting", "diarrhoea", "sunken_eyes"],
    },
    {
        "title": "Liver failure warning",
        "message": "Acute liver failure is a medical emergency. Go to a hospital immediately.",
        "all_of": ["acute_liver_failure"],
        "any_of": [],
    },
    {
        "title": "Breathing difficulty warning",
        "message": "Breathlessness with high fever or coughing up sputum can indicate a serious chest infection. "
                   "Seek medical care the same day.",
        "all_of": ["breathlessness"],
        "any_of": ["high_fever", "rusty_sputum", "blood_in_sputum"],
    },
]


def evaluate_red_flags(symptoms: Set[str]) -> List[dict]:
    """Return every red-flag rule triggered by the selected symptoms."""
    fired = []
    for rule in RED_FLAGS:
        if not all(s in symptoms for s in rule["all_of"]):
            continue
        matched_any = [s for s in rule["any_of"] if s in symptoms]
        if rule["any_of"] and not matched_any:
            continue
        involved = list(rule["all_of"]) + matched_any
        fired.append({"title": rule["title"], "message": rule["message"], "symptoms": involved})
    return fired
