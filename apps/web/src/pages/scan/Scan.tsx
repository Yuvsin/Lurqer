import { NavBar } from "@/components/NavBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const placeholders = [
  "www.indeed.com/viewjob...", "www.linkedin.com/jobs...",
  "www.joinhandshake.com/jobs/...", "www.ziprecruiter.com/jobs..."];

export function Scan() {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholders.length);
    }, 2500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <title>Lurqer - Scan</title>
      <NavBar />

      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#131200]">Scan a posting</h1>
          <p className="text-sm text-[#5B5750] mt-1">
            Paste a job URL or description to check for phishing, fake recruiter, and scam indicators.
          </p>
        </div>

        <Card className="p-6 bg-[#F2F0EC] border-[#ECE7D8] rounded-xl mb-4">
          <label className="block text-sm font-semibold text-[#5B5750] mb-2">
            Job posting URL
          </label>
          <div className="flex gap-3">
            <input type="url" placeholder={placeholders[placeholderIndex]}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#9A98B5] bg-white text-[#131200] 
            placeholder:text-[#9A98B5] focus:outline-none focus:ring-2 focus:ring-[#392061] focus:border-transparent"
            />
            <Button className="bg-[#392061] hover:bg-[#2a1648] text-[#FAF0CA] px-5 rounded-lg text-sm">
              Scan URL
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}