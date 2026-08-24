import { PartialType } from '@nestjs/swagger';
import { CreateDoctorNoteDto } from './create-doctor-note.dto';

export class UpdateDoctorNoteDto extends PartialType(CreateDoctorNoteDto) {}
