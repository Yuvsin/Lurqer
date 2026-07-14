from app.schemas.job import Job
from fastapi import APIRouter, HTTPException

#apirouter stuff helps to group different routes so I don't
#bloat main.py

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)

jobs: list[Job] = []

@router.get("/jobs", response_model=list[Job])
def get_jobs():
    return jobs


@router.get("/jobs/{job_id}", response_model=Job)
def get_job_by_id(job_id: str):
    for job in jobs:
        if job.id == job_id:
            return job
    raise HTTPException(status_code=404, detail="Job not found")


@router.post("/jobs", response_model=Job, status_code=201)
def create_job(job: Job):
    jobs.append(job)
    return job

@router.put('/jobs/{job_id}', response_model = Job)
def update_job(job_id : str, updated_job: Job):
    for index, job in enumerate(jobs):
      if job.id == job_id:
          jobs[index] = update_job
          return update_job
      
    raise HTTPException(status_code=404, detail="Job not found")

@router.delete("/jobs/{job_id}", status_code=204)
def delete_job(job_id: str):
    for index, job in enumerate(jobs):
        if job.id == job_id:
            jobs.pop(index)
            return

    raise HTTPException(status_code=404, detail="Job not found")