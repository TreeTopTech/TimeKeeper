import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Storage } from '../storage/Storage';
import { getPeriodDates, getWorkedHours } from '../utils/timeUtils';
import { TimeEntry } from '../types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const EntriesScreen = () => {
  const [weekEntries, setWeekEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = new Date();
      const { start } = getPeriodDates('weekly', today.toISOString().slice(0, 10));
      const monday = new Date(start);
      const weekDates = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toISOString().slice(0, 10);
      });
      const entries = await Storage.getEntries();
      const week = weekDates.map(date =>
        entries.find(e => e.date === date) || {
          id: date,
          date,
          startTime: '',
          finishTime: '',
          lunchMinutes: 0,
          notes: '',
        }
      );
      setWeekEntries(week);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Text>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Entries</Text>
      {weekEntries.map((entry, idx) => (
        <View key={entry.date} style={{ marginBottom: 18, padding: 10, borderRadius: 8, backgroundColor: '#f5f5f5' }}>
          <Text style={{ fontWeight: 'bold' }}>{DAYS[idx]} ({entry.date})</Text>
          <Text>Start: {entry.startTime || '-'}</Text>
          <Text>End: {entry.finishTime || '-'}</Text>
          <Text>Lunch: {entry.lunchMinutes ? (entry.lunchMinutes / 60) + ' h' : '-'}</Text>
          <Text>Notes: {entry.notes || '-'}</Text>
          <Text>Total: {entry.startTime && entry.finishTime ? getWorkedHours(entry).toFixed(2) + ' h' : '-'}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: 'transparent' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
});

export default EntriesScreen;
