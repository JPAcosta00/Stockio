// src/components/StatsPDFDocument.jsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#f8fafc', fontFamily: 'Helvetica' },
  header: { backgroundColor: '#0f172a', padding: 15, marginBottom: 20, borderRadius: 4 },
  title: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: '#94a3b8', fontSize: 10, marginTop: 4 },
  kpiContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  kpiCard: { backgroundColor: '#ffffff', padding: 12, borderRadius: 6, width: '30%', border: '1px solid #e2e8f0' },
  kpiLabel: { fontSize: 8, color: '#64748b', textTransform: 'uppercase' },
  kpiValue: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 10, borderLeft: '3px solid #2563eb', paddingLeft: 6 },
  table: { width: '100%', backgroundColor: '#ffffff', borderRadius: 4, marginBottom: 20 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', padding: 8 },
  tableHeader: { backgroundColor: '#f1f5f9' },
  col: { flex: 1, fontSize: 9 },
  colBold: { flex: 1, fontSize: 9, fontWeight: 'bold' }
});

export const StatsPDFDocument = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>SaaSStock — Reporte de Estadísticas</Text>
        <Text style={styles.subtitle}>Generado en tiempo real desde la aplicación</Text>
      </View>

      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Ventas Totales</Text>
          <Text style={styles.kpiValue}>${data?.totalSales || '0'}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Stock Total</Text>
          <Text style={styles.kpiValue}>{data?.totalStock || '0'} unid.</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Alertas</Text>
          <Text style={styles.kpiValue}>{data?.lowStockCount || '0'} prod.</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Productos Destacados</Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.colBold}>Producto</Text>
          <Text style={styles.colBold}>Stock</Text>
        </View>
        {data?.topProducts?.map((prod, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.col}>{prod.name}</Text>
            <Text style={styles.col}>{prod.stock} unid.</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);