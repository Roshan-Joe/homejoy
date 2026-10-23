"""
Canonical system-wide constants for HomeJoy application.
"""
from typing import List, Optional

# Kerala's 14 administrative districts plus "Other"
KERALA_DISTRICTS: List[str] = [
    "Thiruvananthapuram",
    "Kollam",
    "Pathanamthitta",
    "Alappuzha",
    "Kottayam",
    "Idukki",
    "Ernakulam",
    "Thrissur",
    "Palakkad",
    "Malappuram",
    "Kozhikode",
    "Wayanad",
    "Kannur",
    "Kasaragod",
    "Other"
]

def validate_district(v: Optional[str], required: bool = True) -> Optional[str]:
    """
    Validates that the provided district string exists in KERALA_DISTRICTS.
    Raises ValueError if invalid.
    """
    if v is None or not str(v).strip():
        if required:
            raise ValueError(f"District is required. Must be one of: {', '.join(KERALA_DISTRICTS)}")
        return None

    cleaned = str(v).strip()
    # Case-sensitive match check against canonical list
    for dist in KERALA_DISTRICTS:
        if dist.lower() == cleaned.lower():
            return dist

    raise ValueError(f"'{cleaned}' is not a valid district. Must be one of: {', '.join(KERALA_DISTRICTS)}")
