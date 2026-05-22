export interface ICreateIssue {
  title: string;
  description: string;
  type: string;
  status?: string;
  reporter_id: number;
}
