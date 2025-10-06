const chip = (label, color) => (
  <span style={{
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    color: color === 'done' ? '#116329' : color === 'partial' ? '#92400e' : '#6b7280',
    background: color === 'done' ? '#def7ec' : color === 'partial' ? '#fef3c7' : '#f3f4f6',
    border: '1px solid rgba(0,0,0,0.06)'
  }}>{label}</span>
);

const Item = ({ title, status = 'todo', desc, link }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #eee' }}>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <strong>{title}</strong>
        {status === 'done' && chip('Done', 'done')}
        {status === 'partial' && chip('Partial', 'partial')}
        {status === 'todo' && chip('Todo', 'todo')}
        {link && (
          <a href={link} style={{ fontSize: 12, color: '#6d28d9', textDecoration: 'underline' }}>open</a>
        )}
      </div>
      {desc && <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{desc}</div>}
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginTop: 28 }}>
    <h3 style={{ margin: '12px 0' }}>{title}</h3>
    <div>{children}</div>
  </div>
);

export default function FeaturesDashboard() {
  return (
    <div style={{ padding: 24, maxWidth: 1024, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Platform Features</h2>
        <div style={{ fontSize: 12, color: '#6b7280' }}>MVP → Beta → Launch roadmap</div>
      </div>

      <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12, background: '#fafafa' }}>
        <div style={{ fontSize: 14, color: '#374151' }}>
          Track progress across phases. Click “open” to jump to relevant pages.
        </div>
      </div>

      <Section title="Phase 1 — Core Completion & Stabilization">
        <Item title="Password reset via email" status="done" desc="SMTP + OTP expiry implemented" />
        <Item title="2FA (TOTP)" status="done" desc="Setup/verify/disable endpoints + signin enforcement" />
        <Item title="Roles & permissions" status="done" desc="JWT role claims + middleware helper" />
        <Item title="Social login (Google OAuth)" status="done" desc="NextAuth with account linking" link="/api/auth/signin" />
        <Item title="GDPR: export & delete" status="done" desc="Endpoints for data export and account deletion" />

        <Item title="Categories/tags UI" status="done" link="/dashboard/community/categories" />
        <Item title="Pinned posts UI" status="done" link="/dashboard/community/pinned" />
        <Item title="Posts/Comments CRUD" status="done" desc="Create/read/update/delete, comments, pin, report" />
        <Item title="Moderation actions" status="done" desc="Owner + admin/mod checks on update/delete" />
        <Item title="Pagination" status="done" desc="List endpoint with cursor" />

        <Item title="Wiki/Docs CRUD" status="done" />
        <Item title="In‑app notifications (MVP)" status="done" />
        <Item title="Admin dashboard" status="done" link="/dashboard/admin" />
        <Item title="CI workflow & staging docs" status="done" />
      </Section>

        <Section title="Phase 2 — Engagement, Extensibility, Monetization">
          <Item title="Full‑text search (posts/users/tags)" status="done" desc="Unified search API with relevance scoring and filters" link="/dashboard/search" />
          <Item title="Filters & trending" status="done" desc="Advanced filtering and trending algorithms implemented" link="/dashboard/search" />
          <Item title="Events calendar + RSVPs" status="done" desc="Complete event management with RSVP system" link="/dashboard/events" />
          <Item title="Leaderboards & badges" status="done" desc="Gamification system with points, levels, and achievements" link="/dashboard/gamification" />
          <Item title="Weekly digest emails" status="done" desc="Personalized weekly digest with trending content and user activity" link="/api/email/digest" />
          <Item title="Public REST API + Webhooks" status="done" desc="Complete REST API with authentication and webhook system" link="/api/v1" />
          <Item title="Slack/Discord bridges" status="done" desc="Integration bridges for real-time notifications and commands" link="/api/integrations" />
          <Item title="Zapier / n8n support" status="done" desc="Automation platform integrations with triggers and actions" link="/api/integrations" />
          <Item title="Branding settings & onboarding flows" status="done" desc="Custom branding and guided user onboarding experience" link="/dashboard/onboarding" />
          <Item title="Accessibility improvements" status="done" desc="ARIA labels, keyboard navigation, and screen reader support" link="/lib/accessibility" />
          <Item title="Monetization (Stripe/Paddle, tiers, billing)" status="done" desc="Subscription tiers and billing management with Stripe integration" link="/dashboard/billing" />
        </Section>

      <Section title="Phase 3 — Advanced Features & Ecosystem">
        <Item title="AI moderation" status="done" desc="AI-powered content moderation with safety filtering" link="/api/ai/moderation" />
        <Item title="AI summaries/search assistance" status="done" desc="Intelligent content summaries and search guidance" link="/api/ai/summaries" />
        <Item title="Multi‑language / translation" status="done" desc="Multi-language support with AI translation" link="/api/translation" />
        <Item title="Offline / PWA" status="done" desc="Progressive Web App with offline functionality" link="/offline" />
        <Item title="White‑label options" status="done" desc="Custom branding and white-label customization" link="/api/white-label" />
        <Item title="Plugin/marketplace ecosystem" status="done" desc="Plugin marketplace with installation system" link="/api/marketplace" />
        <Item title="Automated tests & security hardening" status="done" desc="Comprehensive testing and security audit system" link="/api/testing" />
      </Section>
    </div>
  );
}


