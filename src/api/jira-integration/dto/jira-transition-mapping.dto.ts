import {
  ClassField,
  StringField,
  StringFieldOptional,
  UUIDField,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';
import { IsArray } from 'class-validator';

export class JiraTransitionMappingReqDto {
  @UUIDField()
  readonly todoStatusId: string;

  @StringField({ maxLength: 100 })
  readonly jiraTransitionId: string;

  @StringFieldOptional({ maxLength: 100 })
  readonly jiraTransitionName?: string;
}

export class UpsertJiraTransitionMappingsReqDto {
  @IsArray()
  @ClassField(() => JiraTransitionMappingReqDto, { each: true })
  readonly mappings: JiraTransitionMappingReqDto[];
}

@Exclude()
export class JiraTransitionMappingResDto {
  @StringField()
  @Expose()
  id: string;

  @StringField()
  @Expose()
  todoStatusId: string;

  @StringField()
  @Expose()
  jiraTransitionId: string;

  @StringFieldOptional()
  @Expose()
  jiraTransitionName?: string;
}
