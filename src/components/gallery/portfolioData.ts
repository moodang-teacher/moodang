export interface StudentWorkRaw {
  id: string;
  student: string;
  academy: string;
  cohort: string;
  year: string;
  title: string;
  image: string;
  url: string;
  note?: string;
}

export interface StudentWork extends StudentWorkRaw {
  wall: 'left' | 'right';
  z: number;
}

export async function fetchPortfolioWorks(): Promise<StudentWorkRaw[]> {
  try {
    const res = await fetch('/data/portfolioWorks.json', { cache: 'no-cache' });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (item): item is StudentWorkRaw =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as StudentWorkRaw).id === 'string' &&
        typeof (item as StudentWorkRaw).image === 'string' &&
        typeof (item as StudentWorkRaw).url === 'string'
    );
  } catch {
    return [];
  }
}
