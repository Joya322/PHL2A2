import type { IIssue, IReporter } from "../modules/issues/issues.interface";

const formatIssueWithReporter = (issue: IIssue, reporter: IReporter) => {
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: {
      id: issue.reporter_id,
      name: reporter?.name,
      role: reporter?.role,
    },
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };
};

export default formatIssueWithReporter;