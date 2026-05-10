export enum JiraSyncStatus {
  NOT_LINKED = 'NOT_LINKED', // Chưa link tới Jira issue
  SYNCED = 'SYNCED', // Đã sync thành công
  PENDING = 'PENDING', // Đang chờ sync (có thay đổi chưa push)
  FAILED = 'FAILED', // Sync thất bại
}
