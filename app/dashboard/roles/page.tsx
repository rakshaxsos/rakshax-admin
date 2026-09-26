'use client';
import DataTable from '../../../components/DataTable';

const ROLE_PERMISSIONS_MATRIX = [
  {
    role: 'SUPER_ADMIN',
    desc: 'Platform owner with full system access and role assignment privileges',
    incidents: 'Full Control',
    dispatch: 'Full Control',
    reports: 'Full Control',
    users: 'Full Control',
    settings: 'Full Control',
  },
  {
    role: 'ADMIN',
    desc: 'Command center administrator for operations, verifications, and auditing',
    incidents: 'Read & Write',
    dispatch: 'Manage',
    reports: 'Moderate',
    users: 'Manage Roles',
    settings: 'Manage',
  },
  {
    role: 'EMERGENCY_OPERATOR',
    desc: 'Police & dispatch officer operating the emergency response console',
    incidents: 'Respond & 112',
    dispatch: 'Deploy Units',
    reports: 'View Verified',
    users: 'View Citizen Info',
    settings: 'No Access',
  },
  {
    role: 'SECURITY',
    desc: 'Campus and institutional private security officer in localized sectors',
    incidents: 'Assigned Only',
    dispatch: 'Acknowledge',
    reports: 'Submit & Verify',
    users: 'Restricted',
    settings: 'No Access',
  },
  {
    role: 'RESPONDER',
    desc: 'Authorized field first-responder responding to nearby emergency SOS',
    incidents: 'Assigned Only',
    dispatch: 'Accept / Route',
    reports: 'View Layer',
    users: 'Distress Only',
    settings: 'No Access',
  },
  {
    role: 'PROFESSIONAL',
    desc: 'Verified clinical psychologist/counselor providing post-incident recovery',
    incidents: 'Debriefing Only',
    dispatch: 'No Access',
    reports: 'No Access',
    users: 'Assigned Patients',
    settings: 'No Access',
  },
  {
    role: 'CONTENT_MANAGER',
    desc: 'Safety academy instructor managing classes, course content, and replays',
    incidents: 'No Access',
    dispatch: 'No Access',
    reports: 'No Access',
    users: 'No Access',
    settings: 'No Access',
  },
  {
    role: 'USER',
    desc: 'Standard citizen protected by RakshaX device, circle, and SOS trigger',
    incidents: 'Trigger SOS',
    dispatch: 'No Access',
    reports: 'Submit Issues',
    users: 'Own Profile',
    settings: 'No Access',
  },
  {
    role: 'SUSPENDED',
    desc: 'Compromised or restricted account with all capabilities halted',
    incidents: 'Blocked',
    dispatch: 'Blocked',
    reports: 'Blocked',
    users: 'Blocked',
    settings: 'Blocked',
  },
];

export default function RolesAdminPage() {
  const rows = ROLE_PERMISSIONS_MATRIX.map((r) => [
    <div key="role">
      <span className="font-mono font-bold text-xs text-blue-400">{r.role}</span>
      <p className="text-[11px] text-slate-400 max-w-xs">{r.desc}</p>
    </div>,
    <div key="inc" className="text-xs text-slate-300 font-semibold">{r.incidents}</div>,
    <div key="disp" className="text-xs text-slate-300">{r.dispatch}</div>,
    <div key="rep" className="text-xs text-slate-300">{r.reports}</div>,
    <div key="usr" className="text-xs text-slate-300">{r.users}</div>,
    <div key="set" className="text-xs text-slate-400 font-mono">{r.settings}</div>,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">
          Role-Based Access Control (RBAC) Governance Matrix
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Enforced through Firestore Security Rules. Client-supplied role claims are strictly validated against verified user tokens.
        </p>
      </div>

      <DataTable
        columns={[
          'Role & Operational Scope',
          'Emergency Incidents',
          'Dispatch Console',
          'Safety Reports',
          'Citizen Profiles',
          'System Config',
        ]}
        rows={rows}
      />
    </div>
  );
}
