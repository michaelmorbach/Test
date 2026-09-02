import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/dal';
import { getTripWithDetails } from '@/lib/repo/trips';
import { formatCents, formatDate, formatDateTime } from '@/lib/money';
import { auditActionLabels, categoryLabels, paymentMethodLabels, statusConfig } from '@/lib/statusConfig';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#1e293b' },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#64748b', marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  metaRow: { flexDirection: 'row', marginBottom: 3 },
  metaLabel: { width: 120, color: '#64748b' },
  metaValue: { flex: 1 },
  tableHeader: { flexDirection: 'row', borderBottom: '1pt solid #cbd5e1', paddingBottom: 4, marginBottom: 4 },
  tableRow: { flexDirection: 'row', paddingVertical: 3, borderBottom: '0.5pt solid #e2e8f0' },
  th: { fontWeight: 700, fontSize: 9, color: '#475569' },
  td: { fontSize: 9 },
  colWide: { flex: 3 },
  colMed: { flex: 2 },
  colNum: { flex: 1, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 6, borderTop: '1pt solid #1e293b' },
  totalLabel: { fontSize: 11, fontWeight: 700 },
  totalValue: { fontSize: 13, fontWeight: 700 },
  auditItem: { marginBottom: 3, fontSize: 9 },
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const trip = getTripWithDetails(id);
  if (!trip) {
    return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 });
  }
  const isOwner = trip.employeeId === user.id;
  if (!isOwner && !user.isApprover && !user.isAdmin) {
    return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 });
  }

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Reisekostenabrechnung</Text>
        <Text style={styles.subtitle}>RVI · {trip.zweck}</Text>

        <View style={styles.section}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Mitarbeitend</Text>
            <Text style={styles.metaValue}>{trip.employee.name} ({trip.employee.email})</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Ziel</Text>
            <Text style={styles.metaValue}>{trip.ziel}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Zeitraum</Text>
            <Text style={styles.metaValue}>
              {formatDate(trip.vonDatum)} – {formatDate(trip.bisDatum)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Kostenstelle</Text>
            <Text style={styles.metaValue}>{trip.kostenstelle}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>{statusConfig[trip.status].label}</Text>
          </View>
        </View>

        {trip.receipts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Belege</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colWide]}>Händler</Text>
              <Text style={[styles.th, styles.colMed]}>Kategorie</Text>
              <Text style={[styles.th, styles.colMed]}>Zahlungsart</Text>
              <Text style={[styles.th, styles.colMed]}>Datum</Text>
              <Text style={[styles.th, styles.colNum]}>Betrag</Text>
            </View>
            {trip.receipts.map((r) => (
              <View key={r.id} style={styles.tableRow}>
                <Text style={[styles.td, styles.colWide]}>{r.haendler}</Text>
                <Text style={[styles.td, styles.colMed]}>{categoryLabels[r.kategorie]}</Text>
                <Text style={[styles.td, styles.colMed]}>{paymentMethodLabels[r.zahlungsart]}</Text>
                <Text style={[styles.td, styles.colMed]}>{formatDate(r.belegDatum)}</Text>
                <Text style={[styles.td, styles.colNum]}>{formatCents(r.betragCent)}</Text>
              </View>
            ))}
          </View>
        )}

        {trip.mileageEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kilometerabrechnung</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colWide]}>Strecke</Text>
              <Text style={[styles.th, styles.colMed]}>Anlass</Text>
              <Text style={[styles.th, styles.colMed]}>Datum</Text>
              <Text style={[styles.th, styles.colNum]}>km</Text>
              <Text style={[styles.th, styles.colNum]}>Betrag</Text>
            </View>
            {trip.mileageEntries.map((m) => (
              <View key={m.id} style={styles.tableRow}>
                <Text style={[styles.td, styles.colWide]}>
                  {m.start} → {m.ziel}
                </Text>
                <Text style={[styles.td, styles.colMed]}>{m.anlass}</Text>
                <Text style={[styles.td, styles.colMed]}>{formatDate(m.datum)}</Text>
                <Text style={[styles.td, styles.colNum]}>{m.kilometer}</Text>
                <Text style={[styles.td, styles.colNum]}>{formatCents(Math.round(m.kilometer * m.satzSnapshotCent))}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Erstattungsfähiger Gesamtbetrag</Text>
          <Text style={styles.totalValue}>{formatCents(trip.erstattungGesamtCent)}</Text>
        </View>

        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Prüfprotokoll</Text>
          {trip.auditLog.map((entry) => (
            <Text key={entry.id} style={styles.auditItem}>
              {auditActionLabels[entry.action]} – {entry.user.name} – {formatDateTime(entry.createdAt)}
              {entry.comment ? ` – „${entry.comment}“` : ''}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(doc);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="reisekosten-${trip.id}.pdf"`,
    },
  });
}
