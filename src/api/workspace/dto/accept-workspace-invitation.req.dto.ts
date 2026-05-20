import { TokenField } from '@/decorators/field.decorators';

export class AcceptWorkspaceInvitationReqDto {
  @TokenField()
  token!: string;
}
