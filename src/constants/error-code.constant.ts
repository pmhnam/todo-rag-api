export enum ErrorCode {
  // Common Validation
  V000 = 'common.validation.error',

  // Validation
  V001 = 'user.validation.is_empty',
  V002 = 'user.validation.is_invalid',

  // Error
  E001 = 'user.error.username_or_email_exists',
  E002 = 'user.error.not_found',
  E003 = 'user.error.email_exists',

  // Todo Status Errors
  E100 = 'todo_status.error.not_found',
  E101 = 'todo_status.error.has_todos_cannot_delete',

  // Todo Errors
  E110 = 'todo.error.not_found',
  E111 = 'todo.error.status_not_owned_by_user',
}
