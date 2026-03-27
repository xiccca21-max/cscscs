import { db } from "./db";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "balance_change"
  | "block"
  | "unblock"
  | "approve"
  | "reject";

export async function logAudit(params: {
  actorId: string;
  actorRole: "admin" | "system";
  entity: string;
  entityId: string;
  action: AuditAction;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  return db.auditLog.create({
    data: {
      actorId: params.actorId,
      actorRole: params.actorRole,
      entity: params.entity,
      entityId: params.entityId,
      action: params.action,
      oldValue: params.oldValue
        ? JSON.parse(JSON.stringify(params.oldValue))
        : undefined,
      newValue: params.newValue
        ? JSON.parse(JSON.stringify(params.newValue))
        : undefined,
    },
  });
}
