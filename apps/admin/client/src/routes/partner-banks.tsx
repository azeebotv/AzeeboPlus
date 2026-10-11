import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { PartnerBankAdmin } from '@/lib/admin-types';
import { assertSuccess, bool, num, requireData, str, unwrapList } from '@/lib/payload';
import { Icon } from '@/components/Icons';
import QueryErrorBanner from '@/components/QueryErrorBanner';

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,63}$/;

const emptyForm = {
  slug: '',
  name: '',
  productName: '',
  logoUrl: '',
  licenceRef: '',
  registrationNumber: '',
  minAmount: '',
  maxAmount: '',
  minTenorMonths: '1',
  maxTenorMonths: '6',
  interestRateMin: '',
  interestRateMax: '',
  feeDisclosure: '',
  totalCostExample: '',
  eligibility: '',
  applyUrl: '',
  termsUrl: '',
  privacyUrl: '',
  displayOrder: '0',
  // A new partner starts hidden and marked as sample: nothing unverified reaches
  // the public Borrow page by accident.
  isActive: false,
  isSample: true,
};

type FormState = typeof emptyForm;

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.includes('.');
  } catch {
    return false;
  }
}

/** Empty optional strings would fail the DTO's @IsUrl/@IsString checks. */
function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--admin-surface)',
  backgroundColor: 'var(--admin-dark)',
  color: 'var(--admin-text)',
  fontSize: 14,
  outline: 'none',
} as const;

const labelStyle = {
  display: 'block',
  fontSize: 13,
  color: 'var(--admin-text-muted)',
  marginBottom: 6,
} as const;

// Module scope on purpose: defining this inside the page component gives it a
// new identity every render, which remounts the <input> and drops focus while
// typing.
function TextField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  hint?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>
        {props.label} {props.required && <span style={{ color: 'var(--admin-red)' }}>*</span>}
      </label>
      <input
        type={props.type || 'text'}
        min={props.min}
        max={props.max}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        style={inputStyle}
      />
      {props.hint && (
        <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 4 }}>{props.hint}</p>
      )}
    </div>
  );
}

function TextAreaField(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{props.label}</label>
      <textarea
        rows={2}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        style={{ ...inputStyle, resize: 'vertical' }}
      />
    </div>
  );
}

export default function PartnerBanksPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PartnerBankAdmin | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);

  const {
    data: banks = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin', 'partner-banks'],
    queryFn: async () => {
      // requireData, not `res.success ? … : []`: a failed read must surface as a
      // query error, otherwise the page shows "no partners" while the service is down.
      const data = requireData(await adminApi.getPartnerBanks(), []);
      return unwrapList<PartnerBankAdmin>(data).items;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      assertSuccess(await adminApi.createPartnerBank(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partner-banks'] });
      closeModal();
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to add partner'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      assertSuccess(await adminApi.updatePartnerBank(id, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partner-banks'] });
      closeModal();
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to update partner'),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      assertSuccess(await adminApi.updatePartnerBank(id, { isActive })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'partner-banks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => assertSuccess(await adminApi.deletePartnerBank(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partner-banks'] });
      setDeleteConfirm(null);
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to delete partner'),
  });

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setFormError('');
    setForm(emptyForm);
  }

  function openCreate() {
    setEditing(null);
    setFormError('');
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(b: PartnerBankAdmin) {
    setEditing(b);
    setFormError('');
    setForm({
      slug: b.slug,
      name: b.name,
      productName: str(b.productName),
      logoUrl: str(b.logoUrl),
      licenceRef: str(b.licenceRef),
      registrationNumber: str(b.registrationNumber),
      // Decimal columns arrive as strings; seed the inputs from them directly.
      minAmount: str(b.minAmount),
      maxAmount: str(b.maxAmount),
      minTenorMonths: String(num(b.minTenorMonths)),
      maxTenorMonths: String(num(b.maxTenorMonths)),
      interestRateMin: str(b.interestRateMin),
      interestRateMax: str(b.interestRateMax),
      feeDisclosure: str(b.feeDisclosure),
      totalCostExample: str(b.totalCostExample),
      eligibility: str(b.eligibility),
      applyUrl: b.applyUrl,
      termsUrl: str(b.termsUrl),
      privacyUrl: str(b.privacyUrl),
      displayOrder: String(num(b.displayOrder)),
      isActive: bool(b.isActive),
      isSample: bool(b.isSample),
    });
    setShowModal(true);
  }

  function buildPayload(): Record<string, unknown> | undefined {
    setFormError('');
    // DTO parity with CreatePartnerBankDto — the form must not let an invalid
    // row through to a 400 the admin only sees after clicking save.
    if (!SLUG_RE.test(form.slug.trim()))
      return void setFormError(
        'Slug must be 2-64 lowercase letters, digits or hyphens (e.g. partner-bank-a).'
      );
    if (form.name.trim().length < 2) return void setFormError('Partner name is required.');
    const minAmount = Number(form.minAmount);
    const maxAmount = Number(form.maxAmount);
    const minTenor = Number(form.minTenorMonths);
    const maxTenor = Number(form.maxTenorMonths);
    const rateMin = Number(form.interestRateMin);
    const rateMax = Number(form.interestRateMax);
    const displayOrder = Number(form.displayOrder);
    if (
      !Number.isFinite(minAmount) ||
      minAmount < 1 ||
      !Number.isFinite(maxAmount) ||
      maxAmount < 1
    )
      return void setFormError('Amounts are required and must be at least 1.');
    if (minAmount > maxAmount) return void setFormError('Minimum amount cannot exceed maximum.');
    if (
      !Number.isInteger(minTenor) ||
      !Number.isInteger(maxTenor) ||
      minTenor < 1 ||
      maxTenor > 360
    )
      return void setFormError('Tenors must be whole months between 1 and 360.');
    if (minTenor > maxTenor) return void setFormError('Minimum tenor cannot exceed maximum.');
    if (!Number.isFinite(rateMin) || !Number.isFinite(rateMax) || rateMin < 0 || rateMax > 1000)
      return void setFormError('Rates must be between 0 and 1000.');
    if (rateMin > rateMax) return void setFormError('Minimum rate cannot exceed maximum.');
    if (!isHttpsUrl(form.applyUrl.trim()))
      return void setFormError('Application URL must be a valid https:// link.');
    for (const [label, value] of [
      ['Terms URL', form.termsUrl],
      ['Privacy URL', form.privacyUrl],
      ['Logo URL', form.logoUrl],
    ] as const) {
      if (value.trim() && !isHttpsUrl(value.trim()))
        return void setFormError(`${label} must be a valid https:// link.`);
    }
    if (!Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 9999)
      return void setFormError('Display order must be between 0 and 9999.');

    return {
      slug: form.slug.trim(),
      name: form.name.trim(),
      productName: optional(form.productName),
      logoUrl: optional(form.logoUrl),
      licenceRef: optional(form.licenceRef),
      registrationNumber: optional(form.registrationNumber),
      minAmount,
      maxAmount,
      minTenorMonths: minTenor,
      maxTenorMonths: maxTenor,
      interestRateMin: rateMin,
      interestRateMax: rateMax,
      feeDisclosure: optional(form.feeDisclosure),
      totalCostExample: optional(form.totalCostExample),
      eligibility: optional(form.eligibility),
      applyUrl: form.applyUrl.trim(),
      termsUrl: optional(form.termsUrl),
      privacyUrl: optional(form.privacyUrl),
      displayOrder,
      isActive: form.isActive,
      isSample: form.isSample,
    };
  }

  function handleSubmit() {
    const payload = buildPayload();
    if (!payload) return;
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const sampleCount = banks.filter((b) => b.isSample).length;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Icon name="shield" size={28} color="var(--admin-blue)" />
            <span>Borrow Partners</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)' }}>
            {isError
              ? 'Partner list unavailable'
              : `${banks.length} partners · ${banks.filter((b) => b.isActive).length} shown on the public Borrow page`}
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
            color: 'white',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <Icon name="plus" size={16} />
          <span>Add Partner</span>
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '12px 16px',
          borderRadius: 12,
          border: '1px solid rgba(217,164,62,0.35)',
          backgroundColor: 'rgba(217,164,62,0.10)',
          color: 'var(--admin-amber)',
          fontSize: 13,
          marginBottom: 16,
        }}
      >
        <Icon name="alertTriangle" size={16} color="var(--admin-amber)" />
        <span>
          Azeebo+ is not a lender: these rows only publish the partner&apos;s own terms and
          application link.
          {sampleCount > 0 && (
            <>
              {' '}
              <strong>
                {sampleCount} {sampleCount === 1 ? 'row is' : 'rows are'} still placeholder data
              </strong>{' '}
              — replace the licence, rate and application values with verified partner terms before
              activating them. The public Borrow page labels anything left marked as sample.
            </>
          )}
        </span>
      </div>

      {formError && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid rgba(204,28,28,0.4)',
            backgroundColor: 'rgba(204,28,28,0.12)',
            color: 'var(--admin-red-light)',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {formError}
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : isError ? (
        <QueryErrorBanner
          title="Partner list unavailable."
          body="No rows are listed, so per-partner actions are unreachable until the list loads again — adding a partner here now would go against a view you cannot verify."
          detail={error?.message}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {banks.map((b) => {
            const isDeleting = deleteConfirm === b.id;
            return (
              <div
                key={b.id}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-surface)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 4,
                        flexWrap: 'wrap',
                      }}
                    >
                      <h3 style={{ fontWeight: 600, fontSize: 15 }}>{b.name}</h3>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: b.isActive
                            ? 'rgba(13,59,46,0.2)'
                            : 'rgba(204,28,28,0.2)',
                          color: b.isActive ? 'var(--admin-green)' : 'var(--admin-red)',
                        }}
                      >
                        {b.isActive ? 'Live' : 'Hidden'}
                      </span>
                      {b.isSample && (
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            backgroundColor: 'rgba(217,164,62,0.2)',
                            color: 'var(--admin-amber)',
                          }}
                        >
                          SAMPLE DATA
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--admin-text-muted)',
                          fontFamily: 'ui-monospace, monospace',
                        }}
                      >
                        /{b.slug}
                      </span>
                    </div>

                    {b.productName && (
                      <p
                        style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 6 }}
                      >
                        {b.productName}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
                      <span>
                        <strong>₦{num(b.minAmount).toLocaleString()}</strong>
                        {' – '}
                        <strong>₦{num(b.maxAmount).toLocaleString()}</strong>
                      </span>
                      <span style={{ color: 'var(--admin-text-muted)' }}>
                        {num(b.minTenorMonths)}–{num(b.maxTenorMonths)} months
                      </span>
                      <span style={{ color: 'var(--admin-text-muted)' }}>
                        {num(b.interestRateMin)}–{num(b.interestRateMax)}% p.a.
                      </span>
                      <span style={{ color: 'var(--admin-text-muted)' }}>
                        order {num(b.displayOrder)}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        flexWrap: 'wrap',
                        marginTop: 8,
                        fontSize: 12,
                        color: 'var(--admin-text-muted)',
                      }}
                    >
                      {(b.licenceRef || b.registrationNumber) && (
                        <span>
                          {str(b.licenceRef)} {str(b.registrationNumber)}
                        </span>
                      )}
                      <a
                        href={b.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: 'var(--admin-blue)',
                          textDecoration: 'none',
                        }}
                      >
                        <Icon name="externalLink" size={12} />
                        <span>Apply link</span>
                      </a>
                      {b.termsUrl && (
                        <a
                          href={b.termsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--admin-text-muted)', textDecoration: 'none' }}
                        >
                          Terms
                        </a>
                      )}
                      {b.privacyUrl && (
                        <a
                          href={b.privacyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--admin-text-muted)', textDecoration: 'none' }}
                        >
                          Privacy
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginLeft: 12, flexShrink: 0 }}>
                    <button
                      onClick={() => statusMutation.mutate({ id: b.id, isActive: !b.isActive })}
                      disabled={statusMutation.isPending}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--admin-surface)',
                        background: 'transparent',
                        color: 'var(--admin-text-muted)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {b.isActive ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => openEdit(b)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--admin-surface)',
                        background: 'transparent',
                        color: 'var(--admin-text-muted)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    {isDeleting ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => deleteMutation.mutate(b.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'var(--admin-red)',
                            color: 'white',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: '1px solid var(--admin-surface)',
                            background: 'transparent',
                            color: 'var(--admin-text-muted)',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(b.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: '1px solid rgba(204,28,28,0.3)',
                          background: 'transparent',
                          color: 'var(--admin-red)',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {banks.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
              No lending partners configured — the public Borrow page shows its empty state.
            </p>
          )}
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 16,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: 'var(--admin-bg)',
              borderRadius: 16,
              border: '1px solid var(--admin-surface)',
              padding: 24,
              maxWidth: 640,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
              {editing ? 'Edit Partner' : 'Add Partner'}
            </h2>

            {formError && (
              <div
                role="alert"
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(204,28,28,0.4)',
                  backgroundColor: 'rgba(204,28,28,0.12)',
                  color: 'var(--admin-red-light)',
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TextField
                label="Partner name"
                value={form.name}
                required
                onChange={(v) => setForm({ ...form, name: v })}
              />
              <TextField
                label="Product name"
                value={form.productName}
                onChange={(v) => setForm({ ...form, productName: v })}
              />
            </div>

            <TextField
              label="Slug"
              value={form.slug}
              required
              hint="Used in the public page URL and API path. Lowercase letters, digits and hyphens."
              onChange={(v) => setForm({ ...form, slug: v })}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TextField
                label="Licence / approval reference"
                value={form.licenceRef}
                onChange={(v) => setForm({ ...form, licenceRef: v })}
              />
              <TextField
                label="Registration number"
                value={form.registrationNumber}
                onChange={(v) => setForm({ ...form, registrationNumber: v })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TextField
                label="Min amount (NGN)"
                type="number"
                min="1"
                value={form.minAmount}
                required
                onChange={(v) => setForm({ ...form, minAmount: v })}
              />
              <TextField
                label="Max amount (NGN)"
                type="number"
                min="1"
                value={form.maxAmount}
                required
                onChange={(v) => setForm({ ...form, maxAmount: v })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              <TextField
                label="Min tenor"
                type="number"
                min="1"
                max="360"
                value={form.minTenorMonths}
                required
                onChange={(v) => setForm({ ...form, minTenorMonths: v })}
              />
              <TextField
                label="Max tenor"
                type="number"
                min="1"
                max="360"
                value={form.maxTenorMonths}
                required
                onChange={(v) => setForm({ ...form, maxTenorMonths: v })}
              />
              <TextField
                label="Min rate %"
                type="number"
                min="0"
                max="1000"
                value={form.interestRateMin}
                required
                onChange={(v) => setForm({ ...form, interestRateMin: v })}
              />
              <TextField
                label="Max rate %"
                type="number"
                min="0"
                max="1000"
                value={form.interestRateMax}
                required
                onChange={(v) => setForm({ ...form, interestRateMax: v })}
              />
            </div>

            <TextAreaField
              label="Fee disclosure"
              value={form.feeDisclosure}
              onChange={(v) => setForm({ ...form, feeDisclosure: v })}
            />

            <TextAreaField
              label="Typical total repayment (illustration)"
              value={form.totalCostExample}
              onChange={(v) => setForm({ ...form, totalCostExample: v })}
            />

            <TextAreaField
              label="Who can apply"
              value={form.eligibility}
              onChange={(v) => setForm({ ...form, eligibility: v })}
            />

            <TextField
              label="Application URL"
              value={form.applyUrl}
              required
              hint="The partner's own application page — https only. Azeebo+ never takes the application."
              onChange={(v) => setForm({ ...form, applyUrl: v })}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TextField
                label="Terms URL"
                value={form.termsUrl}
                onChange={(v) => setForm({ ...form, termsUrl: v })}
              />
              <TextField
                label="Privacy URL"
                value={form.privacyUrl}
                onChange={(v) => setForm({ ...form, privacyUrl: v })}
              />
            </div>

            <TextField
              label="Logo URL"
              value={form.logoUrl}
              onChange={(v) => setForm({ ...form, logoUrl: v })}
            />

            <TextField
              label="Display order"
              type="number"
              min="0"
              max="9999"
              value={form.displayOrder}
              onChange={(v) => setForm({ ...form, displayOrder: v })}
            />

            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: 'var(--admin-orange)' }}
                />
                <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
                  Show on public page
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isSample}
                  onChange={(e) => setForm({ ...form, isSample: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: 'var(--admin-amber)' }}
                />
                <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
                  Sample / placeholder data
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleSubmit}
                disabled={isPending || !form.name || !form.slug || !form.applyUrl}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background:
                    !form.name || !form.slug || !form.applyUrl
                      ? 'var(--admin-surface)'
                      : 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                  color: !form.name || !form.slug || !form.applyUrl ? 'var(--admin-grey)' : 'white',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: !form.name || !form.slug || !form.applyUrl ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Saving...' : editing ? 'Update Partner' : 'Add Partner'}
              </button>
              <button
                onClick={closeModal}
                style={{
                  padding: '12px 20px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: 'var(--admin-text-muted)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
