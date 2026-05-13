import {
  EmailFieldOptional,
  EnumField,
  StringFieldOptional,
  URLField,
} from '@/decorators/field.decorators';
import { JiraAuthType } from '../enums/jira-auth-type.enum';

export class UpsertJiraIntegrationReqDto {
  @URLField({
    description: 'Base Jira URL, for example https://company.atlassian.net',
  })
  readonly jiraDomain: string;

  @EnumField(() => JiraAuthType, { enumName: 'JiraAuthType' })
  readonly authType: JiraAuthType;

  @EmailFieldOptional({ description: 'Required for Jira Cloud basic auth' })
  readonly jiraEmail?: string;

  @StringFieldOptional({ minLength: 1 })
  readonly jiraApiToken?: string;

  @StringFieldOptional({ maxLength: 50 })
  readonly jiraProjectKey?: string;
}
