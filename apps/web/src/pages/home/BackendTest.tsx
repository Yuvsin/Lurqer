import { useEffect } from "react";
import { getHealth } from "@/lib/api";

export function BackendTest() {
  useEffect(() => {
    getHealth()
      .then((data) => console.log("Backend connected:", data))
      .catch((error) => console.error("Backend error:", error));
  }, []);

  return <div>Testing backend...</div>;
}