import {
  DateField,
  EnumField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';
import { JiraAuthType } from '../enums/jira-auth-type.enum';

@Exclude()
export class JiraIntegrationResDto {
  @StringField()
  @Expose()
  id: string;

  @StringField()
  @Expose()
  jiraDomain: string;

  @StringFieldOptional()
  @Expose()
  jiraEmail?: string;

  @EnumField(() => JiraAuthType, { enumName: 'JiraAuthType' })
  @Expose()
  authType: JiraAuthType;

  @StringFieldOptional()
  @Expose()
  jiraProjectKey?: string;

  @StringField()
  @Expose()
  projectId: string;

  @DateField()
  @Expose()
  createdAt: Date;

  @DateField()
  @Expose()
  updatedAt: Date;
}
