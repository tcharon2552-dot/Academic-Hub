import { ApplicationStatus, type PaymentMethod, type PlanCode, type Prisma } from "@prisma/client";
import { db } from "./db";
import { teamApplicationInputSchema, type TeamApplicationInput } from "./validators/application";

type TeamApplicationResult = {
  id: string;
  requesterUserId: string;
  teamId: string | null;
  desiredPlanCode: PlanCode;
  applicantName: string;
  institution: string;
  labName: string;
  contactEmail: string;
  memberCount: number;
  useCase: string;
  invoiceRequired: boolean;
  contractRequired: boolean;
  paymentPreference: PaymentMethod | null;
  status: ApplicationStatus;
  reviewerNote: string | null;
};

type TeamApplicationCreateArgs = {
  data: TeamApplicationInput & {
    status?: ApplicationStatus;
    teamId?: string | null;
    reviewerNote?: string | null;
  };
};

type TeamApplicationUpdateArgs = {
  where: {
    id: string;
  };
  data: {
    status?: ApplicationStatus;
    reviewerNote?: string | null;
  };
};

export type ApplicationClient = {
  teamApplication: {
    create(args: TeamApplicationCreateArgs): Promise<TeamApplicationResult>;
    update(args: TeamApplicationUpdateArgs): Promise<TeamApplicationResult>;
    findMany(args?: {
      where?: {
        status?: ApplicationStatus;
      };
      orderBy?: {
        createdAt: "asc" | "desc";
      };
      take?: number;
    }): Promise<TeamApplicationResult[]>;
  };
};

export type ReviewAction = "approve" | "reject" | "mark_contacted";

export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApplicationError";
  }
}

const prismaApplicationClient: ApplicationClient = {
  teamApplication: {
    create: (args) => db.teamApplication.create(args as Prisma.TeamApplicationCreateArgs),
    update: (args) => db.teamApplication.update(args as Prisma.TeamApplicationUpdateArgs),
    findMany: (args) => db.teamApplication.findMany(args as Prisma.TeamApplicationFindManyArgs)
  }
};

export function validateTeamApplicationInput(input: unknown): TeamApplicationInput {
  const result = teamApplicationInputSchema.safeParse(input);

  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join(".")).filter(Boolean);
    throw new ApplicationError(`Invalid team application: ${fields.join(", ")}`);
  }

  return result.data;
}

export async function submitTeamApplication(
  input: unknown,
  options: {
    client?: ApplicationClient;
  } = {}
) {
  const parsed = validateTeamApplicationInput(input);
  const client = options.client ?? prismaApplicationClient;

  return client.teamApplication.create({
    data: {
      ...parsed,
      status: ApplicationStatus.PENDING
    }
  });
}

export async function reviewTeamApplication(
  applicationId: string,
  action: ReviewAction,
  options: {
    client?: ApplicationClient;
    reviewerNote?: string | null;
  } = {}
) {
  const client = options.client ?? prismaApplicationClient;
  const nextStatus =
    action === "approve"
      ? ApplicationStatus.APPROVED
      : action === "reject"
        ? ApplicationStatus.REJECTED
        : ApplicationStatus.NEEDS_INFO;

  return client.teamApplication.update({
    where: {
      id: applicationId
    },
    data: {
      status: nextStatus,
      reviewerNote: options.reviewerNote ?? null
    }
  });
}

export async function listTeamApplications(
  options: {
    client?: ApplicationClient;
    status?: ApplicationStatus;
    take?: number;
  } = {}
) {
  const client = options.client ?? prismaApplicationClient;

  return client.teamApplication.findMany({
    where: options.status
      ? {
          status: options.status
        }
      : undefined,
    orderBy: {
      createdAt: "desc"
    },
    take: options.take ?? 50
  });
}
