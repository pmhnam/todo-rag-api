import { TokenField } from '@/decorators/field.decorators';

export class AcceptProjectInvitationReqDto {
  @TokenField()
  token!: string;
}
