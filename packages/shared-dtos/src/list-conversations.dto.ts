export class ListConversationsDto {
  // projectId is now extracted from route params in /projects/:projectId/inbox
  status?: 'open' | 'closed';
  page?: number;
  limit?: number;
}
