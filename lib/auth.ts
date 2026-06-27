import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { createHelixMemberServiceClient } from "./supabase";

export type HelixSession = {
  memberId: string;
  displayName?: string;
  roles: string[];
  status?: string;
};

type LoginResult = {
  ok: boolean;
  error?: string;
};

export async function getHelixSession(): Promise<HelixSession | null> {
  const cookieStore = await cookies();
  const cookieName = process.env.HELIX_AUTH_COOKIE_NAME ?? "helix_member_session";
  const sessionCookie = cookieStore.get(cookieName);
  const secret = getJwtSecret();

  if (!sessionCookie?.value || !secret) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(sessionCookie.value, secret);
    const memberId = stringClaim(payload.memberId) ?? stringClaim(payload.sub) ?? stringClaim(payload.id);
    if (!memberId) return null;

    return {
      memberId,
      displayName: stringClaim(payload.displayName) ?? stringClaim(payload.name) ?? stringClaim(payload.email),
      roles: arrayClaim(payload.roles) ?? [stringClaim(payload.role) ?? "member"],
      status: stringClaim(payload.status),
    };
  } catch {
    return null;
  }
}

export async function loginWithHelixMember(identifier: string, password: string): Promise<LoginResult> {
  const supabase = createHelixMemberServiceClient();
  const secret = getJwtSecret();

  if (!/^\d{8}$/.test(password)) {
    return { ok: false, error: "Password must be exactly 8 numeric digits." };
  }

  if (!supabase || !secret) {
    return { ok: false, error: "Member login is not fully configured yet." };
  }

  const table = process.env.HELIX_MEMBERS_TABLE ?? "members";
  const usernameColumn = process.env.HELIX_MEMBER_USERNAME_COLUMN ?? "mention_handle";
  const passwordColumn = process.env.HELIX_MEMBER_PASSWORD_HASH_COLUMN ?? "password_hash";
  const idColumn = process.env.HELIX_MEMBER_ID_COLUMN ?? "id";
  const memberIdColumn = process.env.HELIX_MEMBER_MEMBER_ID_COLUMN ?? "member_id";
  const displayNameColumn = process.env.HELIX_MEMBER_DISPLAY_NAME_COLUMN ?? "name";
  const roleColumn = process.env.HELIX_MEMBER_ROLE_COLUMN ?? "role";
  const statusColumn = process.env.HELIX_MEMBER_STATUS_COLUMN ?? "status";
  const memberSelect = deduplicateColumns([
    idColumn,
    memberIdColumn,
    usernameColumn,
    passwordColumn,
    displayNameColumn,
    roleColumn,
    statusColumn,
  ]);

  const data = await findMemberByAnyIdentifier({
    supabase,
    membersTable: table,
    memberSelect,
    identifier,
    usernameColumn,
    memberIdColumn,
  });

  if (!data) {
    return { ok: false, error: "No Helix member account matched that email, username, or member ID." };
  }

  const passwordHash = getRecordString(data, passwordColumn);
  if (!passwordHash) {
    return { ok: false, error: "The Helix member record does not include a password hash column this app can verify." };
  }

  const passwordMatches = await bcrypt.compare(password, passwordHash);
  if (!passwordMatches) {
    return { ok: false, error: "The identifier or password was incorrect." };
  }

  const memberId = getRecordString(data, memberIdColumn) ?? getRecordString(data, idColumn);
  if (!memberId) {
    return { ok: false, error: "The Helix member record does not include a usable member_id." };
  }

  const displayName = getRecordString(data, displayNameColumn) ?? getRecordString(data, usernameColumn);
  const role = getRecordString(data, roleColumn) ?? "member";
  const status = getRecordString(data, statusColumn);
  const token = await new SignJWT({
    memberId,
    displayName,
    roles: status ? [role, status] : [role],
    status,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(memberId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(process.env.HELIX_AUTH_COOKIE_NAME ?? "helix_member_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { ok: true };
}

export async function logoutHelixMember() {
  const cookieStore = await cookies();
  cookieStore.delete(process.env.HELIX_AUTH_COOKIE_NAME ?? "helix_member_session");
}

export function canEdit(session: HelixSession | null) {
  return Boolean(session);
}

export function canModerate(session: HelixSession | null) {
  if (!session) return false;
  const permissions = new Set([...session.roles, session.status].filter(Boolean).map((value) => value?.toLowerCase()));
  return ["admin", "board", "boardmember", "board_member", "founder"].some((role) => permissions.has(role));
}

function getJwtSecret() {
  const rawSecret = process.env.HELIX_SESSION_JWT_SECRET || process.env.HELIX_AUTH_JWT_SECRET || process.env.HELIX_AUTH_SECRET;
  return rawSecret ? new TextEncoder().encode(rawSecret) : null;
}

function stringClaim(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function arrayClaim(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined;
}

function getRecordString(record: unknown, key: string) {
  if (!record || typeof record !== "object") return undefined;
  const value = (record as Record<string, unknown>)[key];
  return typeof value === "string" ? value : value == null ? undefined : String(value);
}

function deduplicateColumns(columns: string[]) {
  return Array.from(new Set(columns.filter(Boolean))).join(",");
}

async function findMemberByAnyIdentifier({
  supabase,
  membersTable,
  memberSelect,
  identifier,
  usernameColumn,
  memberIdColumn,
}: {
  supabase: ReturnType<typeof createHelixMemberServiceClient> extends infer T ? NonNullable<T> : never;
  membersTable: string;
  memberSelect: string;
  identifier: string;
  usernameColumn: string;
  memberIdColumn: string;
}) {
  const emailLinksTable = process.env.HELIX_MEMBER_EMAIL_LINKS_TABLE ?? "member_email_links";
  const emailLinkEmailColumn = process.env.HELIX_MEMBER_EMAIL_LINK_EMAIL_COLUMN ?? "email";
  const emailLinkMemberIdColumn = process.env.HELIX_MEMBER_EMAIL_LINK_MEMBER_ID_COLUMN ?? "member_id";
  const normalizedEmail = identifier.toLowerCase();

  if (identifier.includes("@")) {
    const { data: emailLink } = await supabase
      .from(emailLinksTable)
      .select(emailLinkMemberIdColumn)
      .eq(emailLinkEmailColumn, normalizedEmail)
      .maybeSingle();

    const linkedMemberId = getRecordString(emailLink, emailLinkMemberIdColumn);
    if (linkedMemberId) {
      const { data: memberByEmail } = await supabase
        .from(membersTable)
        .select(memberSelect)
        .eq(memberIdColumn, linkedMemberId)
        .maybeSingle();
      if (memberByEmail) return memberByEmail;
    }
  }

  const { data: memberByUsername } = await supabase
    .from(membersTable)
    .select(memberSelect)
    .eq(usernameColumn, identifier)
    .maybeSingle();
  if (memberByUsername) return memberByUsername;

  const { data: memberById } = await supabase
    .from(membersTable)
    .select(memberSelect)
    .eq(memberIdColumn, identifier)
    .maybeSingle();
  return memberById;
}
