import { ApplicationStatus, PaymentStatus, WorkflowRunStatus, type Prisma } from "@prisma/client";
import { db } from "./db";

export type AdminTeamApplication = {
  id: string;
  labName: string;
  institution: string;
  applicantName: string;
  contactEmail: string;
  desiredPlanCode: string;
  memberCount: number;
  status: ApplicationStatus;
};

export type AdminPaymentOrder = {
  id: string;
  ownerLabel: string | null;
  ownerId: string;
  planCode: string | null;
  method: string;
  status: PaymentStatus;
  amountCents: number;
};

export type AdminUsageOwner = {
  ownerId: string;
  ownerLabel: string | null;
  totalTokens: number;
};

export type AdminWorkflowRun = {
  id: string;
  type: string;
  status: WorkflowRunStatus;
  userId: string;
  inputSummary: string;
  outputSummary: string | null;
};

export type AdminClient = {
  teamApplication: {
    findMany(args: Prisma.TeamApplicationFindManyArgs): Promise<AdminTeamApplication[]>;
  };
  paymentOrder: {
    findMany(args: Prisma.PaymentOrderFindManyArgs): Promise<AdminPaymentOrder[]>;
  };
  usageRecord: {
    groupBy(args: {
      by: ["ownerId", "ownerLabel"];
      _sum: {
        totalTokens: true;
      };
      orderBy: {
        _sum: {
          totalTokens: "desc";
        };
      };
      take: number;
    }): Promise<Array<{ ownerId: string; ownerLabel: string | null; _sum: { totalTokens: number | null } }>>;
  };
  workflowRun: {
    findMany(args: Prisma.WorkflowRunFindManyArgs): Promise<AdminWorkflowRun[]>;
  };
};

const prismaAdminClient: AdminClient = {
  teamApplication: {
    findMany: (args) => db.teamApplication.findMany(args) as Promise<AdminTeamApplication[]>
  },
  paymentOrder: {
    findMany: (args) => db.paymentOrder.findMany(args) as Promise<AdminPaymentOrder[]>
  },
  usageRecord: {
    groupBy: async () => {
      const rows = await db.usageRecord.groupBy({
        by: ["ownerId", "ownerLabel"],
        _sum: {
          totalTokens: true
        },
        orderBy: {
          _sum: {
            totalTokens: "desc"
          }
        },
        take: 20
      });

      return rows.map((row) => ({
        ownerId: row.ownerId,
        ownerLabel: row.ownerLabel,
        _sum: {
          totalTokens: row._sum.totalTokens
        }
      }));
    }
  },
  workflowRun: {
    findMany: (args) => db.workflowRun.findMany(args) as Promise<AdminWorkflowRun[]>
  }
};

export async function getAdminDashboardData(client: AdminClient = prismaAdminClient) {
  const [pendingApplications, recentPaymentOrders, heavyUsageOwners, recentWorkflowRuns] = await Promise.all([
    client.teamApplication.findMany({
      where: {
        status: ApplicationStatus.PENDING
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    }),
    client.paymentOrder.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    }),
    client.usageRecord.groupBy({
      by: ["ownerId", "ownerLabel"],
      _sum: {
        totalTokens: true
      },
      orderBy: {
        _sum: {
          totalTokens: "desc"
        }
      },
      take: 20
    }),
    client.workflowRun.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    })
  ]);

  return {
    pendingApplications,
    recentPaymentOrders,
    heavyUsageOwners: heavyUsageOwners.map((owner) => ({
      ownerId: owner.ownerId,
      ownerLabel: owner.ownerLabel,
      totalTokens: owner._sum.totalTokens ?? 0
    })),
    recentWorkflowRuns
  };
}
