export enum ProjectMemberPermission {
  READ = 'READ',
  WRITE = 'WRITE',
  WRITE_INVITE = 'WRITE_INVITE',
}

export const PROJECT_WRITE_PERMISSIONS = [
  ProjectMemberPermission.WRITE,
  ProjectMemberPermission.WRITE_INVITE,
];
