import type {
  ClassTabOption,
  RekapAbsenRow,
  RekapNilaiRow,
  SubjectOption,
} from "@/lib/laporan/types.ts";
import { Card } from "@/components/ui/Card.tsx";
import { CsvButton } from "@/components/laporan/CsvButton.tsx";
import {
  NILAI_CSV_HEADERS,
  nilaiCsvRows,
  NilaiTable,
} from "@/components/laporan/NilaiTable.tsx";
import {
  ABSEN_CSV_HEADERS,
  absenCsvRows,
  AbsenTable,
} from "@/components/laporan/AbsenTable.tsx";

export interface RekapStat {
  label: string;
  value: string;
  /** Tailwind literal warna teks angka. */
  toneText: string;
}

export interface RekapReportProps {
  /** Judul pengantar modul, contoh "Rekap Nilai & Kehadiran". */
  title: string;
  /** Pesan (mis. error pemuatan) bila ada. */
  note?: string | null;
  stats: RekapStat[];
  classTabs: ClassTabOption[];
  subjectOptions: SubjectOption[];
  currentClass: string | null;
  currentSubject: string | null;
  nilaiRows: RekapNilaiRow[];
  absenRows: RekapAbsenRow[];
  csvPrefix: string;
}

/** Halaman rekap nilai & kehadiran untuk Guru dan Admin. */
export function RekapReport(props: RekapReportProps) {
  const {
    title,
    note,
    stats,
    classTabs,
    subjectOptions,
    currentClass,
    currentSubject,
    nilaiRows,
    absenRows,
    csvPrefix,
  } = props;

  function href(over: {
    class?: string | null;
    subject?: string | null;
  }): string {
    const params = new URLSearchParams();
    const klass = over.class !== undefined ? over.class : currentClass;
    if (klass) params.set("class", klass);
    const subject = over.subject !== undefined ? over.subject : currentSubject;
    if (subject) params.set("subject", subject);
    const query = params.toString();
    return query ? `/laporan?${query}` : "/laporan";
  }

  const chip = (active: boolean) =>
    active
      ? "border-primary bg-primary/10 text-primary"
      : "border-border bg-surface text-content-muted hover:text-content";

  const scopeLabel = currentClass ?? "semua kelas";

  return (
    <div class="grid gap-6">
      {note && (
        <div
          role="alert"
          class="rounded-md border border-status-sakit/30 bg-status-sakit/10 px-3 py-2 text-sm text-status-sakit"
        >
          {note}
        </div>
      )}

      <section class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            class="rounded-xl border border-border bg-surface p-4"
          >
            <p class="text-sm text-content-muted">{stat.label}</p>
            <p
              class={`mt-1 truncate text-2xl font-bold tabular-nums ${stat.toneText}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        {classTabs.length > 1 && (
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-semibold uppercase tracking-wide text-content-muted">
              Kelas
            </span>
            <a
              href={href({ class: null })}
              class={`rounded-full border px-2.5 py-1 font-medium ${
                chip(!currentClass)
              }`}
            >
              Semua
            </a>
            {classTabs.map((klass) => (
              <a
                key={klass.id}
                href={href({ class: klass.isCurrent ? null : klass.id })}
                class={`rounded-full border px-2.5 py-1 font-medium ${
                  chip(klass.isCurrent)
                }`}
              >
                {klass.name}
              </a>
            ))}
          </div>
        )}
        {subjectOptions.length > 1 && (
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-semibold uppercase tracking-wide text-content-muted">
              Mapel
            </span>
            <a
              href={href({ subject: null })}
              class={`rounded-full border px-2.5 py-1 font-medium ${
                chip(!currentSubject)
              }`}
            >
              Semua
            </a>
            {subjectOptions.map((subject) => (
              <a
                key={subject.code}
                href={href({
                  subject: subject.isCurrent ? null : subject.code,
                })}
                class={`rounded-full border px-2.5 py-1 font-medium ${
                  chip(subject.isCurrent)
                }`}
              >
                {subject.name}
              </a>
            ))}
          </div>
        )}
      </div>

      <Card
        title="Rekap Nilai"
        description={`${title} — ${scopeLabel}`}
        action={
          <CsvButton
            filename={`${csvPrefix}-nilai.csv`}
            headers={NILAI_CSV_HEADERS}
            rows={nilaiCsvRows(nilaiRows)}
            disabled={nilaiRows.length === 0}
          />
        }
      >
        <NilaiTable rows={nilaiRows} />
      </Card>

      <Card
        title="Rekap Kehadiran"
        description={`Rekap absensi — ${scopeLabel}`}
        action={
          <CsvButton
            filename={`${csvPrefix}-kehadiran.csv`}
            headers={ABSEN_CSV_HEADERS}
            rows={absenCsvRows(absenRows)}
            disabled={absenRows.length === 0}
          />
        }
      >
        <AbsenTable rows={absenRows} />
      </Card>
    </div>
  );
}
