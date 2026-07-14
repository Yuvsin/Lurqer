from app.schemas.report import Report
from fastapi import APIRouter, HTTPException
 
reports: list[Report] = [] 

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.get("/reports", response_model=list[Report])
def get_reports():
    return reports


@router.get("/reports/{report_id}", response_model=Report)
def get_report_by_id(report_id: str):
    for report in reports:
        if report.id == report_id:
            return report
    raise HTTPException(status_code=404, detail="Report not found")