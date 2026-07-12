import axios from "axios";
import type { Job } from "@/types/Job";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export async function getJobs(): Promise<Job[]> {
  const response = await api.get<Job[]>("/jobs");
  return response.data;
}

export async function getJob(jobId: string): Promise<Job> {
  const response = await api.get<Job>(`/jobs/${jobId}`);
  return response.data;
}

export async function createJob(job: Job): Promise<Job> {
  const response = await api.post<Job>("/jobs", job);
  return response.data;
}

export async function updateJob(
  jobId: string,
  job: Job
): Promise<Job> {
  const response = await api.put<Job>(`/jobs/${jobId}`, job);
  return response.data;
}

export async function deleteJob(jobId: string): Promise<void> {
  await api.delete(`/jobs/${jobId}`);
}