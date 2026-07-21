import axios from "axios";

import type { Job, JobUpdateRequest } from "@/types/Job";
import type { Report } from "@/types/Report";
import type {
  ScanResponse,
  ScanTextRequest,
  ScanUrlRequest,
} from "@/types/Scan";
import { supabase } from "./supabase";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

export async function getHealth(): Promise<{ status: string }> {
  const response = await api.get<{ status: string }>("/health");
  return response.data;
}

export async function getJobs(): Promise<Job[]> {
  const response = await api.get<Job[]>("/jobs");
  return response.data;
}

export async function getJob(jobId: string): Promise<Job> {
  const response = await api.get<Job>(`/jobs/${jobId}`);
  return response.data;
}

export async function updateJob(
  jobId: string,
  updates: JobUpdateRequest,
): Promise<Job> {
  const response = await api.patch<Job>(`/jobs/${jobId}`, updates);
  return response.data;
}

export async function deleteJob(jobId: string): Promise<void> {
  await api.delete(`/jobs/${jobId}`);
}

export async function getReports(): Promise<Report[]> {
  const response = await api.get<Report[]>("/reports");
  return response.data;
}

export async function getReport(reportId: string): Promise<Report> {
  const response = await api.get<Report>(`/reports/${reportId}`);
  return response.data;
}

export async function getJobReports(jobId: string): Promise<Report[]> {
  const response = await api.get<Report[]>(`/jobs/${jobId}/reports`);
  return response.data;
}

export async function scanUrl(request: ScanUrlRequest): Promise<ScanResponse> {
  const response = await api.post<ScanResponse>("/scan/url", request);
  return response.data;
}

export async function scanText(request: ScanTextRequest): Promise<ScanResponse> {
  const response = await api.post<ScanResponse>("/scan/text", request);
  return response.data;
}
