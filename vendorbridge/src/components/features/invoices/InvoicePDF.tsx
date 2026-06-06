import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatCurrency, formatDate, numberToWords } from '@/lib/utils'
import type { Invoice } from '@/types'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0B3D6B' },
  subtitle: { fontSize: 10, color: '#666', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 6, color: '#0B3D6B' },
  table: { marginTop: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0B3D6B', color: 'white', padding: 6 },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #eee', padding: 6 },
  col1: { width: '35%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  col5: { width: '10%', textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, paddingTop: 10, borderTop: '2px solid #0B3D6B' },
  signature: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' },
  sigBlock: { width: '40%', borderTop: '1px solid #333', paddingTop: 6, textAlign: 'center' },
})

interface InvoicePDFProps {
  invoice: Invoice
}

export function InvoicePDF({ invoice }: InvoicePDFProps) {
  const items = invoice.purchase_order?.quotation?.items ?? []
  const cgst = invoice.tax_amount / 2
  const sgst = invoice.tax_amount / 2

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>VendorBridge Corp</Text>
          <Text style={styles.subtitle}>123 Business Park, Mumbai, Maharashtra — GSTIN: 27AABCV1234A1Z5</Text>
        </View>

        <View style={styles.row}>
          <View>
            <Text style={styles.sectionTitle}>TAX INVOICE</Text>
            <Text>Invoice No: {invoice.invoice_number}</Text>
            <Text>Date: {formatDate(invoice.created_at)}</Text>
            <Text>Due Date: {invoice.due_date ? formatDate(invoice.due_date) : '—'}</Text>
          </View>
          <View>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text>{invoice.vendor?.company_name}</Text>
            <Text>{invoice.vendor?.address}</Text>
            <Text>{invoice.vendor?.city}, {invoice.vendor?.state}</Text>
            <Text>GSTIN: {invoice.vendor?.gst_number}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Description</Text>
            <Text style={styles.col5}>HSN</Text>
            <Text style={styles.col2}>Qty</Text>
            <Text style={styles.col3}>Rate</Text>
            <Text style={styles.col4}>Amount</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col1}>{item.product_name}</Text>
              <Text style={styles.col5}>9983</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.col4}>{formatCurrency(item.total_price)}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { marginTop: 20 }]}>
          <View style={styles.tableRow}>
            <Text style={{ width: '60%' }}>Taxable Value</Text>
            <Text style={{ width: '40%', textAlign: 'right' }}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ width: '60%' }}>CGST @ 9%</Text>
            <Text style={{ width: '40%', textAlign: 'right' }}>{formatCurrency(cgst)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ width: '60%' }}>SGST @ 9%</Text>
            <Text style={{ width: '40%', textAlign: 'right' }}>{formatCurrency(sgst)}</Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Grand Total: {formatCurrency(invoice.total_amount)}</Text>
        </View>

        <View style={styles.section}>
          <Text>Amount in words: {numberToWords(invoice.total_amount)}</Text>
        </View>

        <View style={styles.section}>
          <Text>Payment Terms: Net 30</Text>
          <Text>Bank: HDFC Bank | A/C: 1234567890 | IFSC: HDFC0001234</Text>
        </View>

        <View style={styles.signature}>
          <View style={styles.sigBlock}>
            <Text>Receiver Signature</Text>
          </View>
          <View style={styles.sigBlock}>
            <Text>Authorized Signatory</Text>
            <Text>VendorBridge Corp</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
