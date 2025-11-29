export interface Project {
  id: string;
  title: string;
  category: string;
  tags: string[];
  description: string;
  image: string;
  liveUrl?: string;
  repoUrl?: string;
  repoUrlFront?: string;
  repoUrlBack?: string;
  featured: boolean;
  order: number;
}
