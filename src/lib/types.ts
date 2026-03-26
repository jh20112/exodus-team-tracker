export interface TeamMember {
  id: string;
  name: string;
  color: string;
}

export interface WeeklyCard {
  id: string;
  memberId: string;
  member?: TeamMember;
  weekStart: string;
  goalOfWeek: string | null;
  supportRequest: string | null;
  generalQuestions: string | null;
  mondayCompleted: boolean;
  rose: string | null;
  thorn: string | null;
  curiousMoment: string | null;
  proudOf: string | null;
  couldImprove: string | null;
  metricEnergy: number | null;
  metricGoalCompletion: number | null;
  metricMood: number | null;
  metricCollaboration: number | null;
  fridayCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CardFormType = "monday" | "friday";

export interface Project {
  id: string;
  memberId: string;
  name: string;
  description: string | null;
  color: string | null;
  posX: number;
  posY: number;
  createdAt: string;
  updatedAt: string;
  workstreams?: Workstream[];
  linksFrom?: ProjectLink[];
  linksTo?: ProjectLink[];
}

export interface Workstream {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  items?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  workstreamId: string;
  text: string;
  completed: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectLink {
  id: string;
  fromId: string;
  toId: string;
  description: string | null;
}
