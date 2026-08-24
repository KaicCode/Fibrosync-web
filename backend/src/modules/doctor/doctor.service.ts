import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  DoctorPatientAccessStatus,
  Role,
  type Prisma,
} from '@prisma/client';
import { addDays, normalizeDateOnly } from '@/common/utils/date.util';
import {
  buildPaginationMeta,
  resolvePagination,
} from '@/common/utils/pagination.util';
import { PrismaService } from '@/database/prisma.service';
import {
  dailyRecordResponseSelect,
  type DailyRecordDetails,
} from '@/modules/daily-records/daily-records.select';
import { DailyRecordsService } from '@/modules/daily-records/daily-records.service';
import type { DailyRecordQueryDto } from '@/modules/daily-records/dto/daily-record-query.dto';
import type { GenerateReportDto } from '@/modules/reports/dto/generate-report.dto';
import type { ReportQueryDto } from '@/modules/reports/dto/report-query.dto';
import { ReportsService } from '@/modules/reports/reports.service';
import {
  parseWeatherSnapshotFromMetadata,
  type WeatherSnapshot,
} from '@/modules/weather/weather.types';
import type { CreateDoctorPatientAccessDto } from './dto/create-doctor-patient-access.dto';
import type { CreateDoctorNoteDto } from './dto/create-doctor-note.dto';
import type { DoctorDashboardQueryDto } from './dto/doctor-dashboard-query.dto';
import type { DoctorNotesQueryDto } from './dto/doctor-notes-query.dto';
import type { DoctorPatientsQueryDto } from './dto/doctor-patients-query.dto';
import type { UpdateDoctorNoteDto } from './dto/update-doctor-note.dto';

type PeriodDays = 7 | 30 | 90;

type AggregatedDay = {
  date: Date;
  painLevel: number | null;
  sleepHours: number | null;
  sleepQuality: number | null;
  fatigueLevel: number | null;
  stressLevel: number | null;
  moodLevel: number | null;
  stiffnessLevel: number | null;
  frontAreas: string[];
  backAreas: string[];
  triggers: string[];
  symptomNames: string[];
  weatherSnapshots: WeatherSnapshot[];
};

type FrequencyItem = {
  key: string;
  count: number;
};

const RECENT_ACTIVITY_WINDOW_DAYS = 7;

@Injectable()
export class DoctorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dailyRecordsService: DailyRecordsService,
    private readonly reportsService: ReportsService,
  ) {}

  async getDashboard(
    doctorId: string,
    query: DoctorDashboardQueryDto,
  ): Promise<unknown> {
    const periodDays = this.resolvePeriodDays(query.periodDays);
    const window = this.resolveWindow(periodDays);
    const accessLinks = await this.prisma.doctorPatientAccess.findMany({
      where: this.buildAccessibleAccessWhere(doctorId),
      select: {
        id: true,
        patientId: true,
        authorizedAt: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            fullName: true,
            dailyRecords: {
              select: {
                painLevel: true,
                recordDate: true,
                createdAt: true,
              },
              orderBy: [{ recordDate: 'desc' }, { createdAt: 'desc' }],
              take: 1,
            },
          },
        },
      },
      orderBy: [{ authorizedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const patientIds = accessLinks.map((item) => item.patientId);

    if (patientIds.length === 0) {
      return {
        summary: {
          periodDays,
          patientsTracked: 0,
          recentRecords: 0,
          patientsWithRecentActivity: 0,
          pendingFollowUps: 0,
        },
        patients: [],
        painSeries: [],
        topSymptoms: [],
        recentActivities: [],
      };
    }

    const recentCutoff = addDays(
      window.end,
      -(RECENT_ACTIVITY_WINDOW_DAYS - 1),
    );
    const [records, reports] = await this.prisma.$transaction([
      this.prisma.dailyRecord.findMany({
        where: {
          userId: {
            in: patientIds,
          },
          recordDate: {
            gte: window.start,
            lte: window.end,
          },
        },
        select: {
          id: true,
          userId: true,
          painLevel: true,
          recordDate: true,
          createdAt: true,
          symptomEntries: {
            select: {
              symptom: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [{ recordDate: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.report.findMany({
        where: {
          userId: {
            in: patientIds,
          },
          generatedAt: {
            not: null,
          },
        },
        select: {
          id: true,
          userId: true,
          type: true,
          generatedAt: true,
          createdAt: true,
          user: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: [{ generatedAt: 'desc' }, { createdAt: 'desc' }],
        take: 4,
      }),
    ]);
    const previewPatients = await this.buildPatientList(doctorId, {
      page: 1,
      limit: 5,
      filter: 'all',
      periodDays,
    });

    const patientsWithRecentActivity = new Set(
      records
        .filter(
          (record) => normalizeDateOnly(record.recordDate) >= recentCutoff,
        )
        .map((record) => record.userId),
    ).size;

    return {
      summary: {
        periodDays,
        patientsTracked: patientIds.length,
        recentRecords: records.length,
        patientsWithRecentActivity,
        pendingFollowUps: Math.max(
          patientIds.length - patientsWithRecentActivity,
          0,
        ),
      },
      patients: previewPatients.items,
      painSeries: this.buildGroupPainTimeline(
        records,
        window.start,
        window.end,
      ),
      topSymptoms: this.buildTopSymptomsFromRecords(records),
      recentActivities: this.buildRecentActivities(
        accessLinks,
        records,
        reports,
      ),
    };
  }

  async listPatients(
    doctorId: string,
    query: DoctorPatientsQueryDto,
  ): Promise<unknown> {
    return this.buildPatientList(doctorId, query);
  }

  async getPatientDetail(
    doctorId: string,
    patientId: string,
    query: DoctorDashboardQueryDto,
  ): Promise<unknown> {
    const access = await this.ensureDoctorAccess(doctorId, patientId);
    const periodDays = this.resolvePeriodDays(query.periodDays);
    const window = this.resolveWindow(periodDays);

    const [patient, records, latestRulePrediction, latestAiPrediction] =
      await this.prisma.$transaction([
        this.prisma.user.findFirst({
          where: {
            id: patientId,
            deletedAt: null,
          },
          select: {
            id: true,
            fullName: true,
            birthDate: true,
            countryCode: true,
            accountStatus: true,
            onboardingCompleted: true,
            userSettings: {
              select: {
                clinicalDataSharingEnabled: true,
              },
            },
            dailyRecords: {
              select: {
                painLevel: true,
                recordDate: true,
                createdAt: true,
              },
              orderBy: [{ recordDate: 'desc' }, { createdAt: 'desc' }],
              take: 1,
            },
          },
        }),
        this.prisma.dailyRecord.findMany({
          where: {
            userId: patientId,
            recordDate: {
              gte: window.start,
              lte: window.end,
            },
          },
          select: dailyRecordResponseSelect,
          orderBy: [{ recordDate: 'asc' }, { createdAt: 'asc' }],
        }),
        this.prisma.crisisPrediction.findFirst({
          where: {
            userId: patientId,
            dailyRecord: {
              recordDate: {
                gte: window.start,
                lte: window.end,
              },
            },
          },
          orderBy: [{ predictedFor: 'desc' }, { createdAt: 'desc' }],
          select: {
            probability: true,
            riskLevel: true,
            predictedFor: true,
            recommendationSummary: true,
          },
        }),
        this.prisma.aiPrediction.findFirst({
          where: {
            userId: patientId,
            createdAt: {
              gte: window.start,
              lt: addDays(window.end, 1),
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            probabilityScore: true,
            riskLevel: true,
            explanation: true,
            suggestedAction: true,
            createdAt: true,
          },
        }),
      ]);

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    const aggregatedDays = this.aggregateDays(records);
    const latestRecord = patient.dailyRecords[0] ?? null;
    const trackedDays = aggregatedDays.length;
    const expectedDays = periodDays;
    const topFrontAreas = this.buildAreaFrequencies(
      aggregatedDays.flatMap((day) => day.frontAreas),
    );
    const topBackAreas = this.buildAreaFrequencies(
      aggregatedDays.flatMap((day) => day.backAreas),
    );
    const topTriggers = this.buildLabelFrequencies(
      aggregatedDays.flatMap((day) => day.triggers),
    );
    const topSymptoms = this.buildLabelFrequencies(
      aggregatedDays.flatMap((day) => day.symptomNames),
    );
    const weatherSnapshots = aggregatedDays.flatMap(
      (day) => day.weatherSnapshots,
    );
    const weatherAverages = this.averageWeather(weatherSnapshots);
    const latestWeather = weatherSnapshots.at(-1) ?? null;
    const latestRuleScore = latestRulePrediction
      ? Math.round(latestRulePrediction.probability * 100)
      : null;

    return {
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        age: this.calculateAge(patient.birthDate),
        countryCode: patient.countryCode,
        lastRecordAt: latestRecord
          ? this.formatDateOnly(latestRecord.recordDate)
          : null,
        lastPainLevel: latestRecord?.painLevel ?? null,
        accessStatus: access.status,
        authorizedAt: access.authorizedAt,
        authorizationSource: access.authorizationSource,
        sharingEnabled:
          patient.userSettings?.clinicalDataSharingEnabled === true,
        accountStatus: patient.accountStatus,
        onboardingCompleted: patient.onboardingCompleted,
      },
      window: {
        periodDays,
        start: this.formatDateOnly(window.start),
        end: this.formatDateOnly(window.end),
      },
      summary: {
        averagePainLevel: this.average(
          aggregatedDays.map((day) => day.painLevel),
        ),
        latestPainLevel: latestRecord?.painLevel ?? null,
        latestRecordDate: latestRecord
          ? this.formatDateOnly(latestRecord.recordDate)
          : null,
        trackedDays,
        expectedDays,
        averageSleepHours: this.average(
          aggregatedDays.map((day) => day.sleepHours),
        ),
        averageFatigueLevel: this.average(
          aggregatedDays.map((day) => day.fatigueLevel),
        ),
        averageStressLevel: this.average(
          aggregatedDays.map((day) => day.stressLevel),
        ),
        averageMoodLevel: this.average(
          aggregatedDays.map((day) => day.moodLevel),
        ),
        averageStiffnessLevel: this.average(
          aggregatedDays.map((day) => day.stiffnessLevel),
        ),
      },
      charts: {
        pain: this.buildTimeline(
          window.start,
          window.end,
          aggregatedDays,
          (day) => day.painLevel,
        ),
        sleepHours: this.buildTimeline(
          window.start,
          window.end,
          aggregatedDays,
          (day) => day.sleepHours,
        ),
        sleepQuality: this.buildTimeline(
          window.start,
          window.end,
          aggregatedDays,
          (day) => day.sleepQuality,
        ),
        fatigue: this.buildTimeline(
          window.start,
          window.end,
          aggregatedDays,
          (day) => day.fatigueLevel,
        ),
        stress: this.buildTimeline(
          window.start,
          window.end,
          aggregatedDays,
          (day) => day.stressLevel,
        ),
        mood: this.buildTimeline(
          window.start,
          window.end,
          aggregatedDays,
          (day) => day.moodLevel,
        ),
        stiffness: this.buildTimeline(
          window.start,
          window.end,
          aggregatedDays,
          (day) => day.stiffnessLevel,
        ),
      },
      bodyMap: {
        frontSelectedAreas: topFrontAreas.map((item) => item.key),
        backSelectedAreas: topBackAreas.map((item) => item.key),
        topAreas: [
          ...topFrontAreas.map((item) => ({
            areaId: item.key,
            count: item.count,
            side: 'front' as const,
          })),
          ...topBackAreas.map((item) => ({
            areaId: item.key,
            count: item.count,
            side: 'back' as const,
          })),
        ]
          .sort((left, right) => right.count - left.count)
          .slice(0, 8),
      },
      triggers: topTriggers.map((item) => ({
        label: item.key,
        count: item.count,
      })),
      symptoms: topSymptoms.map((item) => ({
        label: item.key,
        count: item.count,
        percentage: this.toFixedNumber(
          records.length > 0 ? (item.count / records.length) * 100 : 0,
        ),
      })),
      weatherContext: {
        available: weatherSnapshots.length > 0,
        averageTemperature: weatherAverages.temperature,
        averageHumidity: weatherAverages.humidity,
        averagePressure: weatherAverages.pressure,
        latestSnapshot: latestWeather,
        daysWithWeather: weatherSnapshots.length,
        note: 'Dados ambientais observados nos registros do paciente. Podem estar associados aos sintomas, sem indicar causalidade.',
      },
      analysis: {
        rules: {
          available: latestRuleScore !== null,
          attentionScore: latestRuleScore,
          attentionLevel: this.resolveAttentionLevel(
            latestRuleScore,
            latestRulePrediction?.riskLevel ?? null,
          ),
          recordedAt: latestRulePrediction?.predictedFor ?? null,
          explanation:
            latestRuleScore !== null
              ? 'Indicador gerado a partir dos registros do paciente. Nao representa diagnostico ou probabilidade clinica validada.'
              : 'Ainda nao ha score recente calculado pelo motor de regras neste periodo.',
          recommendationSummary:
            latestRulePrediction?.recommendationSummary ?? null,
        },
        ai: {
          available: latestAiPrediction !== null,
          probabilityScore: latestAiPrediction?.probabilityScore ?? null,
          riskLevel: latestAiPrediction?.riskLevel ?? null,
          explanation: latestAiPrediction?.explanation ?? null,
          suggestedAction: latestAiPrediction?.suggestedAction ?? null,
          generatedAt: latestAiPrediction?.createdAt ?? null,
          disclaimer:
            'Analise complementar de apoio ao acompanhamento. Nao substitui avaliacao profissional.',
        },
      },
    };
  }

  async listPatientRecords(
    doctorId: string,
    patientId: string,
    query: DailyRecordQueryDto,
  ): Promise<unknown> {
    await this.ensureDoctorAccess(doctorId, patientId);
    return this.dailyRecordsService.listForUser(patientId, query);
  }

  async getPatientRecord(
    doctorId: string,
    patientId: string,
    recordId: string,
  ): Promise<unknown> {
    await this.ensureDoctorAccess(doctorId, patientId);
    return this.dailyRecordsService.findOneForUser(patientId, recordId);
  }

  async listPatientReports(
    doctorId: string,
    patientId: string,
    query: ReportQueryDto,
  ): Promise<unknown> {
    await this.ensureDoctorAccess(doctorId, patientId);
    return this.reportsService.listForUser(patientId, query);
  }

  async generatePatientReport(
    doctorId: string,
    patientId: string,
    dto: GenerateReportDto,
  ): Promise<unknown> {
    await this.ensureDoctorAccess(doctorId, patientId);
    return this.reportsService.generate(patientId, dto);
  }

  async getPatientReport(
    doctorId: string,
    patientId: string,
    reportId: string,
  ): Promise<unknown> {
    await this.ensureDoctorAccess(doctorId, patientId);
    return this.reportsService.findOneForUser(patientId, reportId);
  }

  async listPatientNotes(
    doctorId: string,
    patientId: string,
    query: DoctorNotesQueryDto,
  ): Promise<unknown> {
    await this.ensureDoctorAccess(doctorId, patientId);
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const where: Prisma.DoctorNoteWhereInput = {
      doctorId,
      patientId,
      deletedAt: null,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.doctorNote.findMany({
        where,
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          patientId: true,
          doctorId: true,
        },
      }),
      this.prisma.doctorNote.count({ where }),
    ]);

    return {
      items,
      meta: buildPaginationMeta(total, page, limit),
      visibility: 'PRIVATE_DOCTOR_ONLY',
    };
  }

  async createPatientNote(
    doctorId: string,
    patientId: string,
    dto: CreateDoctorNoteDto,
  ): Promise<unknown> {
    const access = await this.ensureDoctorAccess(doctorId, patientId);
    const content = dto.content.trim();

    const note = await this.prisma.doctorNote.create({
      data: {
        accessId: access.id,
        doctorId,
        patientId,
        content,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        patientId: true,
        doctorId: true,
      },
    });

    return {
      ...note,
      visibility: 'PRIVATE_DOCTOR_ONLY',
    };
  }

  async updateNote(
    doctorId: string,
    noteId: string,
    dto: UpdateDoctorNoteDto,
  ): Promise<unknown> {
    const note = await this.prisma.doctorNote.findFirst({
      where: {
        id: noteId,
        doctorId,
        deletedAt: null,
      },
      select: {
        id: true,
        patientId: true,
      },
    });

    if (!note) {
      throw new NotFoundException('Doctor note not found.');
    }

    await this.ensureDoctorAccess(doctorId, note.patientId);

    const updated = await this.prisma.doctorNote.update({
      where: {
        id: noteId,
      },
      data: {
        content: dto.content?.trim(),
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        patientId: true,
        doctorId: true,
      },
    });

    return {
      ...updated,
      visibility: 'PRIVATE_DOCTOR_ONLY',
    };
  }

  async deleteNote(doctorId: string, noteId: string): Promise<unknown> {
    const note = await this.prisma.doctorNote.findFirst({
      where: {
        id: noteId,
        doctorId,
        deletedAt: null,
      },
      select: {
        id: true,
        patientId: true,
      },
    });

    if (!note) {
      throw new NotFoundException('Doctor note not found.');
    }

    await this.ensureDoctorAccess(doctorId, note.patientId);

    await this.prisma.doctorNote.update({
      where: {
        id: noteId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Doctor note deleted successfully.',
    };
  }

  async createAccessLink(
    adminUserId: string,
    dto: CreateDoctorPatientAccessDto,
  ): Promise<unknown> {
    if (dto.doctorId === dto.patientId) {
      throw new BadRequestException(
        'Doctor and patient must be different users.',
      );
    }

    const [doctor, patient] = await this.prisma.$transaction([
      this.prisma.user.findFirst({
        where: {
          id: dto.doctorId,
          deletedAt: null,
        },
        select: {
          id: true,
          role: true,
          fullName: true,
        },
      }),
      this.prisma.user.findFirst({
        where: {
          id: dto.patientId,
          deletedAt: null,
        },
        select: {
          id: true,
          role: true,
          fullName: true,
          userSettings: {
            select: {
              clinicalDataSharingEnabled: true,
            },
          },
        },
      }),
    ]);

    if (!doctor || doctor.role !== Role.MEDICAL) {
      throw new BadRequestException('Selected doctor is invalid.');
    }

    if (!patient || patient.role !== Role.USER) {
      throw new BadRequestException('Selected patient is invalid.');
    }

    const access = await this.prisma.doctorPatientAccess.upsert({
      where: {
        doctorId_patientId: {
          doctorId: dto.doctorId,
          patientId: dto.patientId,
        },
      },
      update: {
        status: DoctorPatientAccessStatus.ACTIVE,
        authorizedByUserId: adminUserId,
        authorizationSource: dto.authorizationSource?.trim() || 'ADMIN',
        authorizedAt: new Date(),
        revokedAt: null,
      },
      create: {
        doctorId: dto.doctorId,
        patientId: dto.patientId,
        status: DoctorPatientAccessStatus.ACTIVE,
        authorizedByUserId: adminUserId,
        authorizationSource: dto.authorizationSource?.trim() || 'ADMIN',
        authorizedAt: new Date(),
      },
      select: {
        id: true,
        doctorId: true,
        patientId: true,
        status: true,
        authorizedAt: true,
        revokedAt: true,
        authorizationSource: true,
      },
    });

    return {
      ...access,
      sharingEnabled: patient.userSettings?.clinicalDataSharingEnabled === true,
      doctorName: doctor.fullName,
      patientName: patient.fullName,
    };
  }

  async revokeAccessLink(accessId: string): Promise<unknown> {
    const existing = await this.prisma.doctorPatientAccess.findUnique({
      where: {
        id: accessId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Doctor-patient access not found.');
    }

    const access = await this.prisma.doctorPatientAccess.update({
      where: {
        id: accessId,
      },
      data: {
        status: DoctorPatientAccessStatus.REVOKED,
        revokedAt: new Date(),
      },
      select: {
        id: true,
        doctorId: true,
        patientId: true,
        status: true,
        authorizedAt: true,
        revokedAt: true,
        authorizationSource: true,
      },
    });

    return access;
  }

  private async buildPatientList(
    doctorId: string,
    query: Pick<
      DoctorPatientsQueryDto,
      'page' | 'limit' | 'search' | 'filter' | 'periodDays'
    >,
  ): Promise<{
    items: Array<{
      patientId: string;
      fullName: string;
      age: number | null;
      countryCode: string | null;
      lastRecordAt: string | null;
      recentRecordCount: number;
      latestPainLevel: number | null;
      followUpStatus: 'recent' | 'stale' | 'incomplete';
      followUpLabel: string;
      accessStatus: DoctorPatientAccessStatus;
    }>;
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const periodDays = this.resolvePeriodDays(query.periodDays);
    const periodWindow = this.resolveWindow(periodDays);
    const recentCutoff = addDays(
      periodWindow.end,
      -(RECENT_ACTIVITY_WINDOW_DAYS - 1),
    );
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const patientWhere = this.buildAccessiblePatientWhere(
      query.search,
      query.filter,
      recentCutoff,
    );
    const where: Prisma.DoctorPatientAccessWhereInput = {
      doctorId,
      status: DoctorPatientAccessStatus.ACTIVE,
      revokedAt: null,
      patient: patientWhere,
    };

    const [accessLinks, total] = await this.prisma.$transaction([
      this.prisma.doctorPatientAccess.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ authorizedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          status: true,
          patient: {
            select: {
              id: true,
              fullName: true,
              birthDate: true,
              countryCode: true,
              accountStatus: true,
              onboardingCompleted: true,
              dailyRecords: {
                select: {
                  recordDate: true,
                  painLevel: true,
                  createdAt: true,
                },
                orderBy: [{ recordDate: 'desc' }, { createdAt: 'desc' }],
                take: 1,
              },
            },
          },
        },
      }),
      this.prisma.doctorPatientAccess.count({ where }),
    ]);

    const patientIds = accessLinks.map((item) => item.patient.id);
    const recentRecords =
      patientIds.length > 0
        ? await this.prisma.dailyRecord.findMany({
            where: {
              userId: {
                in: patientIds,
              },
              recordDate: {
                gte: periodWindow.start,
                lte: periodWindow.end,
              },
            },
            select: {
              userId: true,
            },
          })
        : [];

    const recentCounts = new Map<string, number>();

    for (const record of recentRecords) {
      recentCounts.set(
        record.userId,
        (recentCounts.get(record.userId) ?? 0) + 1,
      );
    }

    return {
      items: accessLinks.map((item) => {
        const latestRecord = item.patient.dailyRecords[0] ?? null;
        const isIncomplete =
          item.patient.accountStatus === AccountStatus.PENDING_PROFILE ||
          item.patient.onboardingCompleted === false;
        const isRecent =
          latestRecord !== null &&
          normalizeDateOnly(latestRecord.recordDate) >= recentCutoff;

        return {
          patientId: item.patient.id,
          fullName: item.patient.fullName,
          age: this.calculateAge(item.patient.birthDate),
          countryCode: item.patient.countryCode,
          lastRecordAt: latestRecord
            ? this.formatDateOnly(latestRecord.recordDate)
            : null,
          recentRecordCount: recentCounts.get(item.patient.id) ?? 0,
          latestPainLevel: latestRecord?.painLevel ?? null,
          followUpStatus: isIncomplete
            ? 'incomplete'
            : isRecent
              ? 'recent'
              : 'stale',
          followUpLabel: isIncomplete
            ? 'Perfil incompleto'
            : isRecent
              ? 'Atualizacao recente'
              : 'Sem registro recente',
          accessStatus: item.status,
        };
      }),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  private async ensureDoctorAccess(
    doctorId: string,
    patientId: string,
  ): Promise<{
    id: string;
    status: DoctorPatientAccessStatus;
    authorizedAt: Date | null;
    authorizationSource: string | null;
  }> {
    const access = await this.prisma.doctorPatientAccess.findFirst({
      where: this.buildAccessibleAccessWhere(doctorId, patientId),
      select: {
        id: true,
        status: true,
        authorizedAt: true,
        authorizationSource: true,
      },
    });

    if (!access) {
      throw new ForbiddenException(
        'You do not have permission to access this patient.',
      );
    }

    return {
      ...access,
      authorizedAt: access.authorizedAt ?? null,
      authorizationSource: access.authorizationSource ?? null,
    };
  }

  private buildAccessibleAccessWhere(
    doctorId: string,
    patientId?: string,
  ): Prisma.DoctorPatientAccessWhereInput {
    return {
      doctorId,
      patientId,
      status: DoctorPatientAccessStatus.ACTIVE,
      revokedAt: null,
      patient: {
        deletedAt: null,
        role: Role.USER,
        userSettings: {
          is: {
            clinicalDataSharingEnabled: true,
          },
        },
      },
    };
  }

  private buildAccessiblePatientWhere(
    search: string | undefined,
    filter: DoctorPatientsQueryDto['filter'],
    recentCutoff: Date,
  ): Prisma.UserWhereInput {
    const clauses: Prisma.UserWhereInput[] = [
      {
        deletedAt: null,
        role: Role.USER,
        userSettings: {
          is: {
            clinicalDataSharingEnabled: true,
          },
        },
      },
    ];

    if (search?.trim()) {
      clauses.push({
        OR: [
          {
            fullName: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    if (filter === 'recent') {
      clauses.push({
        dailyRecords: {
          some: {
            recordDate: {
              gte: recentCutoff,
            },
          },
        },
      });
    }

    if (filter === 'stale') {
      clauses.push({
        NOT: {
          dailyRecords: {
            some: {
              recordDate: {
                gte: recentCutoff,
              },
            },
          },
        },
      });
    }

    if (filter === 'incomplete') {
      clauses.push({
        OR: [
          {
            accountStatus: AccountStatus.PENDING_PROFILE,
          },
          {
            onboardingCompleted: false,
          },
        ],
      });
    }

    return {
      AND: clauses,
    };
  }

  private aggregateDays(records: DailyRecordDetails[]): AggregatedDay[] {
    const dayMap = new Map<string, AggregatedDay>();

    for (const record of records) {
      const key = this.formatDateOnly(record.recordDate);
      const current = dayMap.get(key) ?? {
        date: normalizeDateOnly(record.recordDate),
        painLevel: null,
        sleepHours: null,
        sleepQuality: null,
        fatigueLevel: null,
        stressLevel: null,
        moodLevel: null,
        stiffnessLevel: null,
        frontAreas: [],
        backAreas: [],
        triggers: [],
        symptomNames: [],
        weatherSnapshots: [],
      };

      current.painLevel =
        current.painLevel === null
          ? record.painLevel
          : Math.max(current.painLevel, record.painLevel);
      current.sleepHours = record.sleepHours ?? current.sleepHours;
      current.sleepQuality = record.sleepQuality ?? current.sleepQuality;
      current.fatigueLevel = record.fatigueLevel;
      current.stressLevel = record.stressLevel;
      current.moodLevel = record.moodLevel;
      current.stiffnessLevel =
        record.symptomSignals[0]?.stiffness ?? current.stiffnessLevel;
      current.triggers = this.mergeUnique(
        current.triggers,
        record.painTriggers ?? [],
      );
      current.symptomNames = this.mergeUnique(
        current.symptomNames,
        record.symptomEntries.map((entry) => entry.symptom.name),
      );

      const partitions = this.parsePainPartitions(record.metadata);
      current.frontAreas = this.mergeUnique(
        current.frontAreas,
        partitions.frontPainAreas,
      );
      current.backAreas = this.mergeUnique(
        current.backAreas,
        partitions.backPainAreas,
      );

      const weatherSnapshot = parseWeatherSnapshotFromMetadata(record.metadata);

      if (weatherSnapshot) {
        current.weatherSnapshots.push(weatherSnapshot);
      }

      dayMap.set(key, current);
    }

    return [...dayMap.values()].sort(
      (left, right) => left.date.getTime() - right.date.getTime(),
    );
  }

  private buildTimeline(
    start: Date,
    end: Date,
    days: AggregatedDay[],
    selector: (day: AggregatedDay) => number | null,
  ): Array<{
    date: string;
    label: string;
    tooltipLabel: string;
    value: number | null;
  }> {
    const dayMap = new Map(
      days.map((day) => [this.formatDateOnly(day.date), day]),
    );
    const items: Array<{
      date: string;
      label: string;
      tooltipLabel: string;
      value: number | null;
    }> = [];

    for (
      let cursor = normalizeDateOnly(start);
      cursor <= end;
      cursor = addDays(cursor, 1)
    ) {
      const key = this.formatDateOnly(cursor);
      const day = dayMap.get(key);

      items.push({
        date: key,
        label: this.formatShortDate(cursor),
        tooltipLabel: this.formatLongDate(cursor),
        value: day ? this.toFixedNumber(selector(day)) : null,
      });
    }

    return items;
  }

  private buildGroupPainTimeline(
    records: Array<{
      id: string;
      userId: string;
      painLevel: number;
      recordDate: Date;
    }>,
    start: Date,
    end: Date,
  ): Array<{
    date: string;
    label: string;
    tooltipLabel: string;
    value: number | null;
  }> {
    const buckets = new Map<string, number[]>();

    for (const record of records) {
      const key = this.formatDateOnly(record.recordDate);
      const existing = buckets.get(key) ?? [];
      existing.push(record.painLevel);
      buckets.set(key, existing);
    }

    const items: Array<{
      date: string;
      label: string;
      tooltipLabel: string;
      value: number | null;
    }> = [];

    for (
      let cursor = normalizeDateOnly(start);
      cursor <= end;
      cursor = addDays(cursor, 1)
    ) {
      const key = this.formatDateOnly(cursor);
      const values = buckets.get(key) ?? [];

      items.push({
        date: key,
        label: this.formatShortDate(cursor),
        tooltipLabel: this.formatLongDate(cursor),
        value: values.length > 0 ? this.average(values) : null,
      });
    }

    return items;
  }

  private buildTopSymptomsFromRecords(
    records: Array<{
      id: string;
      symptomEntries: Array<{
        symptom: {
          name: string;
        };
      }>;
    }>,
  ): Array<{
    label: string;
    recordsCount: number;
    percentage: number;
  }> {
    const recordIdsBySymptom = new Map<string, Set<string>>();

    for (const record of records) {
      for (const entry of record.symptomEntries) {
        const key = entry.symptom.name.trim();

        if (!key) {
          continue;
        }

        const existing = recordIdsBySymptom.get(key) ?? new Set<string>();
        existing.add(record.id);
        recordIdsBySymptom.set(key, existing);
      }
    }

    return [...recordIdsBySymptom.entries()]
      .map(([label, recordIds]) => ({
        label,
        recordsCount: recordIds.size,
        percentage:
          this.toFixedNumber(
            records.length > 0 ? (recordIds.size / records.length) * 100 : 0,
          ) ?? 0,
      }))
      .sort((left, right) => right.recordsCount - left.recordsCount)
      .slice(0, 5);
  }

  private buildRecentActivities(
    accessLinks: Array<{
      patientId: string;
      authorizedAt: Date | null;
      createdAt: Date;
      patient: {
        fullName: string;
      };
    }>,
    records: Array<{
      id: string;
      userId: string;
      recordDate: Date;
      createdAt: Date;
    }>,
    reports: Array<{
      id: string;
      userId: string;
      type: string;
      generatedAt: Date | null;
      createdAt: Date;
      user: {
        fullName: string;
      };
    }>,
  ): Array<{
    id: string;
    type: 'record' | 'report' | 'access';
    patientId: string;
    patientName: string;
    title: string;
    description: string;
    occurredAt: Date;
  }> {
    const activities = [
      ...records.slice(0, 5).map((record) => ({
        id: `record:${record.id}`,
        type: 'record' as const,
        patientId: record.userId,
        patientName:
          accessLinks.find((item) => item.patientId === record.userId)?.patient
            .fullName ?? 'Paciente',
        title: 'Paciente realizou novo registro',
        description: `Registro em ${this.formatLongDate(record.recordDate)}.`,
        occurredAt: record.createdAt,
      })),
      ...reports.map((report) => ({
        id: `report:${report.id}`,
        type: 'report' as const,
        patientId: report.userId,
        patientName: report.user.fullName,
        title: 'Novo relatório disponível',
        description: `Relatorio ${report.type.toLowerCase()} gerado para acompanhamento.`,
        occurredAt: report.generatedAt ?? report.createdAt,
      })),
      ...accessLinks
        .filter((item) => item.authorizedAt !== null)
        .slice(0, 4)
        .map((item) => ({
          id: `access:${item.patientId}`,
          type: 'access' as const,
          patientId: item.patientId,
          patientName: item.patient.fullName,
          title: 'Paciente autorizado para acompanhamento',
          description: 'O vinculo clinico esta ativo para este paciente.',
          occurredAt: item.authorizedAt ?? item.createdAt,
        })),
    ];

    return activities
      .sort(
        (left, right) => right.occurredAt.getTime() - left.occurredAt.getTime(),
      )
      .slice(0, 8);
  }

  private buildAreaFrequencies(values: string[]): FrequencyItem[] {
    return this.buildLabelFrequencies(values);
  }

  private buildLabelFrequencies(values: string[]): FrequencyItem[] {
    const counts = new Map<string, number>();

    for (const value of values) {
      const normalized = value.trim();

      if (!normalized) {
        continue;
      }

      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([key, count]) => ({
        key,
        count,
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 8);
  }

  private averageWeather(snapshots: WeatherSnapshot[]): {
    temperature: number | null;
    humidity: number | null;
    pressure: number | null;
  } {
    return {
      temperature: this.average(
        snapshots.map((snapshot) => snapshot.temperature),
      ),
      humidity: this.average(snapshots.map((snapshot) => snapshot.humidity)),
      pressure: this.average(snapshots.map((snapshot) => snapshot.pressure)),
    };
  }

  private parsePainPartitions(metadata: Prisma.JsonValue | null | undefined): {
    frontPainAreas: string[];
    backPainAreas: string[];
  } {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return {
        frontPainAreas: [],
        backPainAreas: [],
      };
    }

    const candidate = metadata as Record<string, unknown>;

    return {
      frontPainAreas: this.normalizeStringArray(
        Array.isArray(candidate.frontPainAreas)
          ? candidate.frontPainAreas.filter(
              (value): value is string => typeof value === 'string',
            )
          : [],
      ),
      backPainAreas: this.normalizeStringArray(
        Array.isArray(candidate.backPainAreas)
          ? candidate.backPainAreas.filter(
              (value): value is string => typeof value === 'string',
            )
          : [],
      ),
    };
  }

  private mergeUnique(current: string[], incoming: string[]): string[] {
    return this.normalizeStringArray([...current, ...incoming]);
  }

  private normalizeStringArray(values: string[]): string[] {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  }

  private calculateAge(birthDate?: Date | null): number | null {
    if (!birthDate) {
      return null;
    }

    const today = normalizeDateOnly(new Date());
    const normalizedBirthDate = normalizeDateOnly(birthDate);
    let age = today.getUTCFullYear() - normalizedBirthDate.getUTCFullYear();
    const monthDelta = today.getUTCMonth() - normalizedBirthDate.getUTCMonth();

    if (
      monthDelta < 0 ||
      (monthDelta === 0 &&
        today.getUTCDate() < normalizedBirthDate.getUTCDate())
    ) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  }

  private resolveWindow(periodDays: PeriodDays): {
    start: Date;
    end: Date;
  } {
    const end = normalizeDateOnly(new Date());

    return {
      start: addDays(end, -(periodDays - 1)),
      end,
    };
  }

  private resolvePeriodDays(input?: number): PeriodDays {
    if (input === 7 || input === 30 || input === 90) {
      return input;
    }

    return 30;
  }

  private resolveAttentionLevel(
    score: number | null,
    riskLevel: string | null,
  ): string | null {
    if (riskLevel) {
      if (riskLevel === 'CRITICAL') {
        return 'Muito elevado';
      }

      if (riskLevel === 'HIGH') {
        return 'Elevado';
      }

      if (riskLevel === 'MODERATE') {
        return 'Moderado';
      }

      return 'Baixo';
    }

    if (score === null) {
      return null;
    }

    if (score >= 85) {
      return 'Muito elevado';
    }

    if (score >= 65) {
      return 'Elevado';
    }

    if (score >= 40) {
      return 'Moderado';
    }

    return 'Baixo';
  }

  private average(values: Array<number | null | undefined>): number | null {
    const filtered = values.filter(
      (value): value is number =>
        typeof value === 'number' && Number.isFinite(value),
    );

    if (filtered.length === 0) {
      return null;
    }

    return this.toFixedNumber(
      filtered.reduce((sum, value) => sum + value, 0) / filtered.length,
    );
  }

  private toFixedNumber(value: number | null): number | null {
    if (value === null || !Number.isFinite(value)) {
      return null;
    }

    return Number(value.toFixed(1));
  }

  private formatDateOnly(date: Date): string {
    return normalizeDateOnly(date).toISOString().slice(0, 10);
  }

  private formatShortDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'UTC',
    }).format(date);
  }

  private formatLongDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(date);
  }
}
