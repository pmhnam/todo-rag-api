import { PartialType } from '@nestjs/swagger';
import { CreateProjectReqDto } from './create-project.req.dto';

export class UpdateProjectReqDto extends PartialType(CreateProjectReqDto) {}
