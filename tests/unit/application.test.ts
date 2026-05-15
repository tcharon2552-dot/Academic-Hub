import { describe, expect, it } from "vitest";
import { ApplicationStatus, PaymentMethod, PlanCode } from "@prisma/client";
import {
  ApplicationError,
  reviewTeamApplication,
  submitTeamApplication,
  validateTeamApplicationInput,
  type ApplicationClient
} from "../../src/lib/applications";

type TeamApplicationRow = {
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

function createApplicationClient(rows: TeamApplicationRow[] = []): ApplicationClient & { rows: TeamApplicationRow[] } {
  const client: ApplicationClient & { rows: TeamApplicationRow[] } = {
    rows,
    teamApplication: {
      create: async ({ data }) => {
        const application = {
          id: `application-${rows.length + 1}`,
          requesterUserId: data.requesterUserId,
          teamId: data.teamId ?? null,
          desiredPlanCode: data.desiredPlanCode,
          applicantName: data.applicantName,
          institution: data.institution,
          labName: data.labName,
          contactEmail: data.contactEmail,
          memberCount: data.memberCount,
          useCase: data.useCase,
          invoiceRequired: data.invoiceRequired,
          contractRequired: data.contractRequired,
          paymentPreference: data.paymentPreference ?? null,
          status: data.status ?? ApplicationStatus.PENDING,
          reviewerNote: data.reviewerNote ?? null
        } satisfies TeamApplicationRow;
        rows.push(application);
        return application;
      },
      update: async ({ where, data }) => {
        const application = rows.find((row) => row.id === where.id);

        if (!application) {
          throw new ApplicationError(`Team application not found: ${where.id}`);
        }

        if (data.status) {
          application.status = data.status;
        }

        if ("reviewerNote" in data) {
          application.reviewerNote = data.reviewerNote ?? null;
        }

        return application;
      },
      findMany: async () => rows
    }
  };

  return client;
}

const validApplication = {
  requesterUserId: "user-1",
  applicantName: "Dr. Lin",
  institution: "Tsinghua University",
  labName: "Computational Biology Lab",
  contactEmail: "pi@example.edu",
  desiredPlanCode: PlanCode.B2,
  memberCount: 12,
  useCase: "Shared literature review and proposal drafting for a research group.",
  invoiceRequired: true,
  contractRequired: true,
  paymentPreference: PaymentMethod.BANK_TRANSFER
};

describe("team application workflow", () => {
  it("requires complete B2/B3 application fields", () => {
    expect(() =>
      validateTeamApplicationInput({
        requesterUserId: "user-1",
        desiredPlanCode: PlanCode.B2,
        labName: "",
        contactEmail: "not-an-email",
        memberCount: 0,
        useCase: "",
        paymentPreference: undefined
      })
    ).toThrow(ApplicationError);
  });

  it("rejects B1 applications because B1 is self-serve", async () => {
    const client = createApplicationClient();

    await expect(
      submitTeamApplication(
        {
          ...validApplication,
          desiredPlanCode: PlanCode.B1
        },
        {
          client
        }
      )
    ).rejects.toBeInstanceOf(ApplicationError);
    expect(client.rows).toHaveLength(0);
  });

  it("persists B2 and B3 applications as pending review", async () => {
    const client = createApplicationClient();

    const application = await submitTeamApplication(validApplication, { client });

    expect(application).toMatchObject({
      id: "application-1",
      requesterUserId: "user-1",
      applicantName: "Dr. Lin",
      institution: "Tsinghua University",
      labName: "Computational Biology Lab",
      desiredPlanCode: PlanCode.B2,
      memberCount: 12,
      paymentPreference: PaymentMethod.BANK_TRANSFER,
      status: ApplicationStatus.PENDING
    });
  });

  it("admin can approve or reject applications", async () => {
    const client = createApplicationClient();
    const application = await submitTeamApplication(validApplication, { client });

    await expect(
      reviewTeamApplication(application.id, "approve", {
        client,
        reviewerNote: "Qualified lab account."
      })
    ).resolves.toMatchObject({
      status: ApplicationStatus.APPROVED,
      reviewerNote: "Qualified lab account."
    });

    await expect(
      reviewTeamApplication(application.id, "reject", {
        client,
        reviewerNote: "Budget not confirmed."
      })
    ).resolves.toMatchObject({
      status: ApplicationStatus.REJECTED,
      reviewerNote: "Budget not confirmed."
    });
  });
});
