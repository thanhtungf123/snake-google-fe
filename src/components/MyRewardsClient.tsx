'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { apiFetch } from '@/lib/api';
import { CardsSkeleton } from '@/components/ui/Skeleton';

type ClaimStatus = 'pending_info' | 'info_submitted' | 'paid' | 'cancelled';

interface Payout {
  fullName?: string;
  bankName?: string;
  accountNumber?: string;
  phone?: string;
  note?: string;
}
interface Claim {
  id: string;
  monthKey: string;
  rank: number;
  best: number;
  status: ClaimStatus;
  payout: Payout | null;
  submittedAt: string | null;
  paidAt: string | null;
  paidNote: string | null;
}

export default function MyRewardsClient() {
  const t = useTranslations('MyRewards');
  const [rows, setRows] = useState<Claim[]>([]);
  const [state, setState] = useState<'loading' | 'unauth' | 'ready'>('loading');

  const load = useCallback(() => {
    apiFetch('/api/rewards/me')
      .then(async (r) => {
        if (r.status === 401) {
          setState('unauth');
          return;
        }
        const d = await r.json();
        setRows(d.rows ?? []);
        setState('ready');
      })
      .catch(() => setState('unauth'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state === 'loading') return <CardsSkeleton count={2} />;

  if (state === 'unauth') {
    return (
      <div className="space-y-3">
        <p className="opacity-80">{t('loginRequired')}</p>
        <Link
          href="/login"
          className="inline-block rounded bg-snake px-4 py-2 font-semibold text-white"
        >
          {t('goLogin')}
        </Link>
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="opacity-70">{t('empty')}</p>;
  }

  return (
    <div className="space-y-5">
      <p className="rounded bg-black/5 px-3 py-2 text-sm opacity-80">{t('intro')}</p>
      {rows.map((c) => (
        <ClaimCard key={c.id} claim={c} onSaved={load} />
      ))}
    </div>
  );
}

const RANK_MEDAL = (rank: number) =>
  rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

function ClaimCard({ claim, onSaved }: { claim: Claim; onSaved: () => void }) {
  const t = useTranslations('MyRewards');
  const p = claim.payout ?? {};
  const editable = claim.status === 'pending_info' || claim.status === 'info_submitted';

  const [fullName, setFullName] = useState(p.fullName ?? '');
  const [bankName, setBankName] = useState(p.bankName ?? '');
  const [accountNumber, setAccountNumber] = useState(p.accountNumber ?? '');
  const [phone, setPhone] = useState(p.phone ?? '');
  const [note, setNote] = useState(p.note ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function save() {
    setErr(null);
    setOk(false);
    if (!fullName.trim() || !bankName.trim() || !accountNumber.trim()) {
      setErr(t('required'));
      return;
    }
    setBusy(true);
    try {
      const r = await apiFetch(`/api/rewards/${claim.id}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, bankName, accountNumber, phone, note }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `Lỗi ${r.status}`);
      }
      setOk(true);
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const statusBadge: Record<ClaimStatus, { label: string; cls: string }> = {
    pending_info: { label: t('status.pending_info'), cls: 'bg-yellow-100 text-yellow-700' },
    info_submitted: { label: t('status.info_submitted'), cls: 'bg-blue-100 text-blue-700' },
    paid: { label: t('status.paid'), cls: 'bg-green-100 text-green-700' },
    cancelled: { label: t('status.cancelled'), cls: 'bg-black/10 text-black/60' },
  };
  const badge = statusBadge[claim.status];

  return (
    <div className="rounded-xl border border-black/10 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">
          <span className="mr-2">{RANK_MEDAL(claim.rank)}</span>
          {t('cardTitle', { month: claim.monthKey })}
          <span className="ml-2 text-sm font-normal opacity-60">
            {t('score', { score: claim.best })}
          </span>
        </h3>
        <span className={`rounded-full px-2.5 py-0.5 text-sm ${badge.cls}`}>{badge.label}</span>
      </div>

      {claim.status === 'paid' ? (
        <div className="space-y-1 text-sm">
          <p className="text-green-700">
            {t('paidAt', {
              date: claim.paidAt ? new Date(claim.paidAt).toLocaleString() : '—',
            })}
          </p>
          {claim.paidNote && <p className="opacity-70">{t('paidNote', { note: claim.paidNote })}</p>}
          <PayoutReadonly p={p} t={t} />
        </div>
      ) : claim.status === 'cancelled' ? (
        <p className="text-sm opacity-70">{t('cancelledNote')}</p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm opacity-70">
            {claim.status === 'info_submitted' ? t('submittedHint') : t('pendingHint')}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('fullName')} required value={fullName} onChange={setFullName} />
            <Field label={t('bankName')} required value={bankName} onChange={setBankName} />
            <Field
              label={t('accountNumber')}
              required
              value={accountNumber}
              onChange={setAccountNumber}
            />
            <Field label={t('phone')} value={phone} onChange={setPhone} />
          </div>
          <Field label={t('note')} value={note} onChange={setNote} />

          {err && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          {ok && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{t('saved')}</p>}

          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={busy || !editable}
              className="rounded bg-snake px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? '…' : claim.status === 'info_submitted' ? t('update') : t('submit')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm opacity-70">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-snake"
      />
    </label>
  );
}

function PayoutReadonly({
  p,
  t,
}: {
  p: Payout;
  t: ReturnType<typeof useTranslations>;
}) {
  if (!p.fullName && !p.accountNumber) return null;
  return (
    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm opacity-80">
      <dt className="opacity-60">{t('fullName')}</dt>
      <dd>{p.fullName || '—'}</dd>
      <dt className="opacity-60">{t('bankName')}</dt>
      <dd>{p.bankName || '—'}</dd>
      <dt className="opacity-60">{t('accountNumber')}</dt>
      <dd className="tabular-nums">{p.accountNumber || '—'}</dd>
      {p.phone && (
        <>
          <dt className="opacity-60">{t('phone')}</dt>
          <dd>{p.phone}</dd>
        </>
      )}
    </dl>
  );
}
