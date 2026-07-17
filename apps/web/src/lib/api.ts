import axios from "axios";
import type { Job } from "@/types/Job";
import { supabase } from "./supabase";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    config.headers.Authorization =
      `Bearer ${session.access_token}`;
  }

  return config;
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
  const response = await api.patch<Job>(`/jobs/${jobId}`, job);
  return response.data;
}

export async function deleteJob(jobId: string): Promise<void> {
  await api.delete(`/jobs/${jobId}`);
}