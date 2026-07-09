import { useEffect } from "react";
import { getHealth } from "@/lib/api";

export function BackendTest() {
  useEffect(() => {
    getHealth().then(console.log).catch(console.error);
  }, []);

  return <div>Testing backend...</div>;
}