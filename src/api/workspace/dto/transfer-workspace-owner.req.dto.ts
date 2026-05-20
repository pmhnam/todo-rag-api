import { UUIDField } from '@/decorators/field.decorators';

export class TransferWorkspaceOwnerReqDto {
  @UUIDField()
  userId!: string;
}
