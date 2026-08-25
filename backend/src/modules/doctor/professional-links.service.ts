import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  DoctorPatientAccessAuditEventType,
  DoctorPatientAccessStatus,
  Role,
  type Prisma,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/database/prisma.service';
import { NotificationType } from '@/modules/notifications/enums/notification-type.enum';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import type { PatientLinkCodeDto } from './dto/patient-link-code.dto';

const LINK_CODE_PREFIX = 'FS-';
const LINK_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LINK_CODE_LENGTH = 6;
const LINK_CODE_RATE_LIMIT = {
  attempts: 3,
  windowMs: 10 * 60 * 1000,
};
const LINK_LOOKUP_RATE_LIMIT = {
  attempts: 8,
  windowMs: 60 * 1000,
};
const LINK_REQUEST_RATE_LIMIT = {
  attempts: 5,
  windowMs: 10 * 60 * 1000,
};

@Injectable()
export class ProfessionalLinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getPatientLinkCode(patientId: string): Promise<unknown> {
    await this.assertPatientUser(patientId);
    const code = await this.ensurePatientLinkCode(patientId);
    const settings = await this.prisma.userSettings.findUnique({
      where: {
        userId: patientId,
      },
      select: {
        clinicalDataSharingEnabled: true,
      },
    });

    return {
      code,
      sharingEnabled: settings?.clinicalDataSharingEnabled ?? false,
    };
  }

  async regeneratePatientLinkCode(patientId: string): Promise<unknown> {
    await this.assertPatientUser(patientId);
    await this.assertWithinRateLimit(
      patientId,
      DoctorPatientAccessAuditEventType.PATIENT_LINK_CODE_REGENERATED,
      LINK_CODE_RATE_LIMIT.attempts,
      LINK_CODE_RATE_LIMIT.windowMs,
    );

    const current = await this.prisma.user.findFirst({
      where: {
        id: patientId,
        deletedAt: null,
        role: Role.USER,
      },
      select: {
        patientLinkCode: true,
      },
    });

    const nextCode = await this.generateUniquePatientLinkCode();

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: patientId,
        },
        data: {
          patientLinkCode: nextCode,
        },
      });

      await this.createAuditLog(tx, {
        actorUserId: patientId,
        patientId,
        eventType:
          DoctorPatientAccessAuditEventType.PATIENT_LINK_CODE_REGENERATED,
        metadata: {
          previousCodeHint: this.maskLinkCode(current?.patientLinkCode ?? null),
          nextCodeHint: this.maskLinkCode(nextCode),
        },
      });
    });

    return {
      code: nextCode,
      message: 'Novo código gerado com sucesso.',
    };
  }

  async listPatientRequests(patientId: string): Promise<unknown> {
    await this.assertPatientUser(patientId);

    const items = await this.prisma.doctorPatientAccess.findMany({
      where: {
        patientId,
        status: DoctorPatientAccessStatus.PENDING,
        doctor: {
          deletedAt: null,
          role: Role.MEDICAL,
        },
      },
      orderBy: [{ requestedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        status: true,
        requestedAt: true,
        createdAt: true,
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialty: true,
            professionalCouncilType: true,
            professionalCouncilNumber: true,
            professionalCouncilState: true,
            professionalClinic: true,
          },
        },
      },
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        status: item.status,
        requestedAt: item.requestedAt ?? item.createdAt,
        doctor: {
          id: item.doctor.id,
          fullName: item.doctor.fullName,
          specialty: item.doctor.specialty,
          professionalCouncilType: item.doctor.professionalCouncilType,
          professionalCouncilNumber: item.doctor.professionalCouncilNumber,
          professionalCouncilState: item.doctor.professionalCouncilState,
          professionalClinic: item.doctor.professionalClinic,
        },
      })),
    };
  }

  async acceptPatientRequest(
    patientId: string,
    accessId: string,
  ): Promise<unknown> {
    await this.assertPatientUser(patientId);

    const outcome = await this.prisma.$transaction(async (tx) => {
      const access = await tx.doctorPatientAccess.findFirst({
        where: {
          id: accessId,
          patientId,
        },
        select: {
          id: true,
          status: true,
          doctorId: true,
          patientId: true,
          requestedAt: true,
          createdAt: true,
          doctor: {
            select: {
              id: true,
              fullName: true,
              role: true,
              accountStatus: true,
              deletedAt: true,
            },
          },
        },
      });

      if (!access) {
        throw new NotFoundException('Solicitação não encontrada.');
      }

      if (access.status !== DoctorPatientAccessStatus.PENDING) {
        throw new ConflictException(
          'Esta solicitação já foi atualizada anteriormente.',
        );
      }

      if (
        access.doctor.deletedAt !== null ||
        access.doctor.role !== Role.MEDICAL ||
        access.doctor.accountStatus !== AccountStatus.ACTIVE
      ) {
        throw new BadRequestException('Não foi possível concluir esta ação.');
      }

      const now = new Date();
      const updateResult = await tx.doctorPatientAccess.updateMany({
        where: {
          id: access.id,
          patientId,
          status: DoctorPatientAccessStatus.PENDING,
        },
        data: {
          status: DoctorPatientAccessStatus.ACTIVE,
          authorizationSource: 'PATIENT_CODE',
          authorizedByUserId: patientId,
          requestedAt: access.requestedAt ?? access.createdAt,
          respondedAt: now,
          authorizedAt: now,
          revokedAt: null,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'Esta solicitação já foi atualizada anteriormente.',
        );
      }

      await tx.userSettings.upsert({
        where: {
          userId: patientId,
        },
        update: {
          clinicalDataSharingEnabled: true,
        },
        create: {
          userId: patientId,
          clinicalDataSharingEnabled: true,
        },
      });

      await this.createAuditLog(tx, {
        accessId: access.id,
        actorUserId: patientId,
        doctorId: access.doctorId,
        patientId: access.patientId,
        eventType: DoctorPatientAccessAuditEventType.DOCTOR_LINK_ACCEPTED,
        previousStatus: DoctorPatientAccessStatus.PENDING,
        nextStatus: DoctorPatientAccessStatus.ACTIVE,
      });

      return {
        doctorId: access.doctorId,
      };
    });

    await this.safeCreateNotification({
      userId: outcome.doctorId,
      type: NotificationType.LINK_AUTHORIZED,
      title: 'Acesso autorizado',
      message: 'O paciente autorizou o acompanhamento.',
      payload: {
        route: '/medical/patients',
      },
    });

    return {
      message: 'Profissional autorizado.',
    };
  }

  async rejectPatientRequest(
    patientId: string,
    accessId: string,
  ): Promise<unknown> {
    await this.assertPatientUser(patientId);

    const outcome = await this.prisma.$transaction(async (tx) => {
      const access = await tx.doctorPatientAccess.findFirst({
        where: {
          id: accessId,
          patientId,
        },
        select: {
          id: true,
          status: true,
          doctorId: true,
          patientId: true,
        },
      });

      if (!access) {
        throw new NotFoundException('Solicitação não encontrada.');
      }

      if (access.status !== DoctorPatientAccessStatus.PENDING) {
        throw new ConflictException(
          'Esta solicitação já foi atualizada anteriormente.',
        );
      }

      const now = new Date();
      const updateResult = await tx.doctorPatientAccess.updateMany({
        where: {
          id: access.id,
          patientId,
          status: DoctorPatientAccessStatus.PENDING,
        },
        data: {
          status: DoctorPatientAccessStatus.REJECTED,
          respondedAt: now,
          authorizedAt: null,
          revokedAt: null,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'Esta solicitação já foi atualizada anteriormente.',
        );
      }

      await this.createAuditLog(tx, {
        accessId: access.id,
        actorUserId: patientId,
        doctorId: access.doctorId,
        patientId: access.patientId,
        eventType: DoctorPatientAccessAuditEventType.DOCTOR_LINK_REJECTED,
        previousStatus: DoctorPatientAccessStatus.PENDING,
        nextStatus: DoctorPatientAccessStatus.REJECTED,
      });

      return {
        doctorId: access.doctorId,
      };
    });

    await this.safeCreateNotification({
      userId: outcome.doctorId,
      type: NotificationType.LINK_UPDATED,
      title: 'Solicitação atualizada',
      message: 'A solicitação não foi aceita.',
      payload: {
        route: '/medical/patients',
      },
    });

    return {
      message: 'Solicitação recusada.',
    };
  }

  async listAuthorizedProfessionals(patientId: string): Promise<unknown> {
    await this.assertPatientUser(patientId);
    const settings = await this.prisma.userSettings.findUnique({
      where: {
        userId: patientId,
      },
      select: {
        clinicalDataSharingEnabled: true,
      },
    });

    const items = await this.prisma.doctorPatientAccess.findMany({
      where: {
        patientId,
        status: DoctorPatientAccessStatus.ACTIVE,
        doctor: {
          deletedAt: null,
          role: Role.MEDICAL,
        },
      },
      orderBy: [{ authorizedAt: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        authorizedAt: true,
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialty: true,
            professionalCouncilType: true,
            professionalCouncilNumber: true,
            professionalCouncilState: true,
            professionalClinic: true,
          },
        },
      },
    });

    return {
      sharingEnabled: settings?.clinicalDataSharingEnabled ?? false,
      items: items.map((item) => ({
        id: item.id,
        authorizedAt: item.authorizedAt,
        doctor: {
          id: item.doctor.id,
          fullName: item.doctor.fullName,
          specialty: item.doctor.specialty,
          professionalCouncilType: item.doctor.professionalCouncilType,
          professionalCouncilNumber: item.doctor.professionalCouncilNumber,
          professionalCouncilState: item.doctor.professionalCouncilState,
          professionalClinic: item.doctor.professionalClinic,
        },
      })),
    };
  }

  async revokeProfessionalAccess(
    patientId: string,
    accessId: string,
  ): Promise<unknown> {
    await this.assertPatientUser(patientId);

    const outcome = await this.prisma.$transaction(async (tx) => {
      const access = await tx.doctorPatientAccess.findFirst({
        where: {
          id: accessId,
          patientId,
        },
        select: {
          id: true,
          status: true,
          doctorId: true,
          patientId: true,
        },
      });

      if (!access) {
        throw new NotFoundException('Profissional não encontrado.');
      }

      if (access.status !== DoctorPatientAccessStatus.ACTIVE) {
        throw new ConflictException(
          'Este acesso já foi atualizado anteriormente.',
        );
      }

      const now = new Date();
      const updateResult = await tx.doctorPatientAccess.updateMany({
        where: {
          id: access.id,
          patientId,
          status: DoctorPatientAccessStatus.ACTIVE,
        },
        data: {
          status: DoctorPatientAccessStatus.REVOKED,
          respondedAt: now,
          revokedAt: now,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'Este acesso já foi atualizado anteriormente.',
        );
      }

      await this.createAuditLog(tx, {
        accessId: access.id,
        actorUserId: patientId,
        doctorId: access.doctorId,
        patientId: access.patientId,
        eventType: DoctorPatientAccessAuditEventType.DOCTOR_LINK_REVOKED,
        previousStatus: DoctorPatientAccessStatus.ACTIVE,
        nextStatus: DoctorPatientAccessStatus.REVOKED,
      });

      return {
        doctorId: access.doctorId,
      };
    });

    await this.safeCreateNotification({
      userId: outcome.doctorId,
      type: NotificationType.LINK_REVOKED,
      title: 'Acesso removido',
      message: 'Seu acesso a este paciente foi encerrado.',
      payload: {
        route: '/medical/patients',
      },
    });

    return {
      message: 'Acesso removido com sucesso.',
    };
  }

  async lookupPatientByCode(
    doctorId: string,
    dto: PatientLinkCodeDto,
  ): Promise<unknown> {
    await this.assertDoctorUser(doctorId);
    await this.assertWithinRateLimit(
      doctorId,
      DoctorPatientAccessAuditEventType.DOCTOR_LINK_LOOKUP,
      LINK_LOOKUP_RATE_LIMIT.attempts,
      LINK_LOOKUP_RATE_LIMIT.windowMs,
    );

    const patient = await this.prisma.user.findFirst({
      where: {
        patientLinkCode: dto.code,
        deletedAt: null,
        role: Role.USER,
      },
      select: {
        id: true,
        fullName: true,
      },
    });

    if (!patient) {
      await this.createAuditLog(this.prisma, {
        actorUserId: doctorId,
        doctorId,
        eventType: DoctorPatientAccessAuditEventType.DOCTOR_LINK_LOOKUP,
        metadata: {
          codeHint: this.maskLinkCode(dto.code),
          outcome: 'NOT_FOUND',
        },
      });

      throw new NotFoundException('Código não encontrado.');
    }

    const existing = await this.prisma.doctorPatientAccess.findUnique({
      where: {
        doctorId_patientId: {
          doctorId,
          patientId: patient.id,
        },
      },
      select: {
        status: true,
      },
    });

    await this.createAuditLog(this.prisma, {
      actorUserId: doctorId,
      doctorId,
      patientId: patient.id,
      eventType: DoctorPatientAccessAuditEventType.DOCTOR_LINK_LOOKUP,
      metadata: {
        codeHint: this.maskLinkCode(dto.code),
        outcome: 'FOUND',
      },
    });

    return {
      patientId: patient.id,
      maskedName: this.maskPatientName(patient.fullName),
      existingStatus: existing?.status ?? null,
      canRequest:
        !existing ||
        existing.status === DoctorPatientAccessStatus.REJECTED ||
        existing.status === DoctorPatientAccessStatus.REVOKED,
      note: 'Nenhuma informação de saúde será exibida antes da autorização.',
    };
  }

  async requestLinkByCode(
    doctorId: string,
    dto: PatientLinkCodeDto,
  ): Promise<unknown> {
    await this.assertDoctorUser(doctorId);
    await this.assertWithinRateLimit(
      doctorId,
      DoctorPatientAccessAuditEventType.DOCTOR_LINK_REQUEST_ATTEMPTED,
      LINK_REQUEST_RATE_LIMIT.attempts,
      LINK_REQUEST_RATE_LIMIT.windowMs,
    );

    const patient = await this.prisma.user.findFirst({
      where: {
        patientLinkCode: dto.code,
        deletedAt: null,
        role: Role.USER,
      },
      select: {
        id: true,
      },
    });

    await this.createAuditLog(this.prisma, {
      actorUserId: doctorId,
      doctorId,
      patientId: patient?.id ?? null,
      eventType:
        DoctorPatientAccessAuditEventType.DOCTOR_LINK_REQUEST_ATTEMPTED,
      metadata: {
        codeHint: this.maskLinkCode(dto.code),
        outcome: patient ? 'FOUND' : 'NOT_FOUND',
      },
    });

    if (!patient) {
      throw new NotFoundException('Código não encontrado.');
    }

    if (patient.id === doctorId) {
      throw new BadRequestException('Não foi possível concluir esta ação.');
    }

    const existing = await this.prisma.doctorPatientAccess.findUnique({
      where: {
        doctorId_patientId: {
          doctorId,
          patientId: patient.id,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existing?.status === DoctorPatientAccessStatus.ACTIVE) {
      throw new ConflictException('Este paciente já está vinculado a você.');
    }

    if (existing?.status === DoctorPatientAccessStatus.PENDING) {
      throw new ConflictException(
        'Já existe uma solicitação aguardando resposta.',
      );
    }

    const now = new Date();
    const access = await this.prisma.$transaction(async (tx) => {
      const nextAccess = existing
        ? await tx.doctorPatientAccess.update({
            where: {
              id: existing.id,
            },
            data: {
              status: DoctorPatientAccessStatus.PENDING,
              authorizationSource: 'PATIENT_CODE',
              authorizedByUserId: null,
              requestedAt: now,
              respondedAt: null,
              authorizedAt: null,
              revokedAt: null,
            },
            select: {
              id: true,
              patientId: true,
              status: true,
              requestedAt: true,
            },
          })
        : await tx.doctorPatientAccess.create({
            data: {
              doctorId,
              patientId: patient.id,
              status: DoctorPatientAccessStatus.PENDING,
              authorizationSource: 'PATIENT_CODE',
              requestedAt: now,
            },
            select: {
              id: true,
              patientId: true,
              status: true,
              requestedAt: true,
            },
          });

      await this.createAuditLog(tx, {
        accessId: nextAccess.id,
        actorUserId: doctorId,
        doctorId,
        patientId: patient.id,
        eventType: DoctorPatientAccessAuditEventType.DOCTOR_LINK_REQUESTED,
        previousStatus: existing?.status ?? null,
        nextStatus: DoctorPatientAccessStatus.PENDING,
        metadata: {
          codeHint: this.maskLinkCode(dto.code),
        },
      });

      return nextAccess;
    });

    await this.safeCreateNotification({
      userId: patient.id,
      type: NotificationType.LINK_REQUEST,
      title: 'Nova solicitação de acompanhamento',
      message: 'Um profissional deseja acompanhar seus registros.',
      payload: {
        route: '/app/professionals',
      },
    });

    return {
      id: access.id,
      status: access.status,
      requestedAt: access.requestedAt,
      message: 'Agora é necessário aguardar a autorização do paciente.',
    };
  }

  async listDoctorRequests(doctorId: string): Promise<unknown> {
    await this.assertDoctorUser(doctorId);

    const items = await this.prisma.doctorPatientAccess.findMany({
      where: {
        doctorId,
        status: {
          in: [
            DoctorPatientAccessStatus.PENDING,
            DoctorPatientAccessStatus.REJECTED,
            DoctorPatientAccessStatus.REVOKED,
          ],
        },
        patient: {
          deletedAt: null,
          role: Role.USER,
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        status: true,
        requestedAt: true,
        respondedAt: true,
        authorizedAt: true,
        revokedAt: true,
        updatedAt: true,
        patient: {
          select: {
            fullName: true,
          },
        },
      },
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        status: item.status,
        requestedAt: item.requestedAt,
        respondedAt: item.respondedAt,
        authorizedAt: item.authorizedAt,
        revokedAt: item.revokedAt,
        updatedAt: item.updatedAt,
        patient: {
          maskedName: this.maskPatientName(item.patient.fullName),
        },
      })),
    };
  }

  private async assertPatientUser(patientId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: patientId,
        deletedAt: null,
      },
      select: {
        role: true,
      },
    });

    if (!user || user.role !== Role.USER) {
      throw new NotFoundException('Paciente não encontrado.');
    }
  }

  private async assertDoctorUser(doctorId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: doctorId,
        deletedAt: null,
      },
      select: {
        role: true,
        accountStatus: true,
      },
    });

    if (!user || user.role !== Role.MEDICAL) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new BadRequestException('Não foi possível concluir esta ação.');
    }
  }

  private async ensurePatientLinkCode(patientId: string): Promise<string> {
    const existing = await this.prisma.user.findFirst({
      where: {
        id: patientId,
        deletedAt: null,
        role: Role.USER,
      },
      select: {
        patientLinkCode: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    if (existing.patientLinkCode) {
      return existing.patientLinkCode;
    }

    const code = await this.generateUniquePatientLinkCode();

    const updated = await this.prisma.user.update({
      where: {
        id: patientId,
      },
      data: {
        patientLinkCode: code,
      },
      select: {
        patientLinkCode: true,
      },
    });

    return updated.patientLinkCode ?? code;
  }

  private async generateUniquePatientLinkCode(): Promise<string> {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const code = `${LINK_CODE_PREFIX}${this.randomCodeSegment(LINK_CODE_LENGTH)}`;
      const existing = await this.prisma.user.findFirst({
        where: {
          patientLinkCode: code,
        },
        select: {
          id: true,
        },
      });

      if (!existing) {
        return code;
      }
    }

    throw new ConflictException(
      'Não foi possível gerar um novo código agora. Tente novamente.',
    );
  }

  private randomCodeSegment(length: number): string {
    const bytes = randomBytes(length);
    let output = '';

    for (let index = 0; index < length; index += 1) {
      output +=
        LINK_CODE_ALPHABET[bytes[index]! % LINK_CODE_ALPHABET.length] ?? 'A';
    }

    return output;
  }

  private maskPatientName(fullName: string): string {
    const trimmed = fullName.trim();

    if (!trimmed) {
      return 'Paciente';
    }

    const parts = trimmed.split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? 'Paciente';
    const lastName = parts.at(-1);

    if (!lastName || lastName === firstName) {
      return firstName;
    }

    return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
  }

  private maskLinkCode(code: string | null): string | null {
    if (!code) {
      return null;
    }

    if (code.length <= 5) {
      return `${code}****`;
    }

    return `${code.slice(0, 5)}****`;
  }

  private async assertWithinRateLimit(
    actorUserId: string,
    eventType: DoctorPatientAccessAuditEventType,
    maxAttempts: number,
    windowMs: number,
  ): Promise<void> {
    const windowStart = new Date(Date.now() - windowMs);
    const attempts = await this.prisma.doctorPatientAccessAuditLog.count({
      where: {
        actorUserId,
        eventType,
        createdAt: {
          gte: windowStart,
        },
      },
    });

    if (attempts >= maxAttempts) {
      throw new HttpException(
        'Muitas tentativas recentes. Aguarde um pouco e tente novamente.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async createAuditLog(
    client: Prisma.TransactionClient | PrismaService,
    input: {
      accessId?: string | null;
      actorUserId: string;
      doctorId?: string | null;
      patientId?: string | null;
      eventType: DoctorPatientAccessAuditEventType;
      previousStatus?: DoctorPatientAccessStatus | null;
      nextStatus?: DoctorPatientAccessStatus | null;
      metadata?: Prisma.JsonObject;
    },
  ): Promise<void> {
    await client.doctorPatientAccessAuditLog.create({
      data: {
        accessId: input.accessId ?? undefined,
        actorUserId: input.actorUserId,
        doctorId: input.doctorId ?? undefined,
        patientId: input.patientId ?? undefined,
        eventType: input.eventType,
        previousStatus: input.previousStatus ?? undefined,
        nextStatus: input.nextStatus ?? undefined,
        metadata: input.metadata ?? undefined,
      },
    });
  }

  private async safeCreateNotification(input: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    payload?: Prisma.JsonObject;
  }): Promise<void> {
    try {
      await this.notificationsService.createGenericInAppNotification(input);
    } catch {
      // A vinculação principal já foi persistida. Falhas de notificação não devem reverter a ação.
    }
  }
}
