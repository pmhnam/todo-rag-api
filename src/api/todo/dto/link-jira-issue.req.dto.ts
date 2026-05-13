import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LinkJiraIssueReqDto {
  @ApiPropertyOptional({
    description: 'Jira issue key. Send an empty value to unlink the todo.',
    maxLength: 50,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  readonly jiraIssueKey?: string | null;
}
