from enum import Enum

class RiskLevel(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"
    unscanned = "Unscanned"