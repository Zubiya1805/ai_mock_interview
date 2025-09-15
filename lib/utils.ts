import { interviewCovers, mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const normalizeTechName = (tech: string) => {
  const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
  return mappings[key as keyof typeof mappings];
};

const checkIconExists = async (url: string) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok; // Returns true if the icon exists
  } catch {
    return false;
  }
};

export const getTechLogos = async (techArray: string[] | string | null | undefined) => {
  // Convert techArray to a proper array if it's not already
  let techList: string[] = [];

  if (Array.isArray(techArray)) {
    techList = techArray;
  } else if (typeof techArray === 'string') {
    // Handle case where techstack is stored as a comma-separated string
    techList = techArray.split(',').map(tech => tech.trim()).filter(tech => tech.length > 0);
  } else {
    // Handle null, undefined, or other invalid types
    return [];
  }

  // Filter out empty strings and ensure we have valid tech names
  const validTechList = techList.filter(tech => tech && typeof tech === 'string' && tech.trim().length > 0);

  if (validTechList.length === 0) {
    return [];
  }

  const logoURLs = validTechList.map((tech) => {
    const normalized = normalizeTechName(tech);
    return {
      tech: tech.trim(),
      url: normalized ? `${techIconBaseURL}/${normalized}/${normalized}-original.svg` : "/tech.svg",
    };
  });

  const results = await Promise.all(
      logoURLs.map(async ({ tech, url }) => ({
        tech,
        url: url !== "/tech.svg" && (await checkIconExists(url)) ? url : "/tech.svg",
      }))
  );

  return results;
};

export const getRandomInterviewCover = () => {
  const randomIndex = Math.floor(Math.random() * interviewCovers.length);
  return `/covers${interviewCovers[randomIndex]}`;
};