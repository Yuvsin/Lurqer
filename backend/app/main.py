from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas.job import Job
from app.schemas.report import Report

app = FastAPI(title="Lurqer API")

jobs: list[Job] = []
reports: list[Report] = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/jobs", response_model=list[Job])
def get_jobs():
    return jobs


@app.get("/jobs/{job_id}", response_model=Job)
def get_job_by_id(job_id: str):
    for job in jobs:
        if job.id == job_id:
            return job
    raise HTTPException(status_code=404, detail="Job not found")


@app.post("/jobs", response_model=Job, status_code=201)
def create_job(job: Job):
    jobs.append(job)
    return job


@app.get("/reports", response_model=list[Report])
def get_reports():
    return reports


@app.get("/reports/{report_id}", response_model=Report)
def get_report_by_id(report_id: str):
    for report in reports:
        if report.id == report_id:
            return report
    raise HTTPException(status_code=404, detail="Report not found")

@app.put('/jobs/{job_id}', response_model = Job)
def update_job(job_id : str, updated_job: Job):
    for index, job in enumerate(jobs):
      if job.id == job_id:
          jobs[index] = update_job
          return update_job
      
    raise HTTPException(status_code=404, detail="Job not found")

@app.delete("/jobs/{job_id}", status_code=204)
def delete_job(job_id: str):
    for index, job in enumerate(jobs):
        if job.id == job_id:
            jobs.pop(index)
            return

    raise HTTPException(status_code=404, detail="Job not found")