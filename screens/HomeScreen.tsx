import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Storage } from '../storage/Storage';
import { getWorkedHours } from '../utils/timeUtils';
import { TimeEntry } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - ((day + 6) % 7);
  return new Date(d.setDate(diff));
}

function weekKey(date: Date) {
  const monday = getMonday(date);
  return monday.toISOString().slice(0, 10);
}

function getWeekRange(monday: Date) {
  const end = new Date(monday);
  end.setDate(monday.getDate() + 4);
  return `${monday.toISOString().slice(0, 10)} - ${end.toISOString().slice(0, 10)}`;
}

const HomeScreen = () => {
  const router = useRouter();
  const [weeks, setWeeks] = useState<{ key: string; range: string; entries: TimeEntry[]; total: number }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [tally, setTally] = useState(0);

  // Always reload weeks when HomeScreen is focused
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const entries = await Storage.getEntries();
        const weekMap: Record<string, TimeEntry[]> = {};
        entries.forEach(e => {
          const monday = weekKey(new Date(e.date));
          if (!weekMap[monday]) weekMap[monday] = [];
          weekMap[monday].push(e);
        });
        const weekArr = Object.entries(weekMap).map(([key, entries]) => {
          const monday = new Date(key);
          const range = getWeekRange(monday);
          const total = entries.reduce((sum, e) => sum + getWorkedHours(e), 0);
          return { key, range, entries, total };
        }).sort((a, b) => b.key.localeCompare(a.key));
        setWeeks(weekArr);
      })();
    }, [])
  );

  useEffect(() => {
    const sum = weeks.filter(w => selected.includes(w.key)).reduce((acc, w) => acc + w.total, 0);
    setTally(sum);
  }, [selected, weeks]);

  const handleAddWeek = () => {
    // Find the latest week in the data, or use today if none
    let nextMonday: Date;
    if (weeks.length > 0) {
      // Get the latest week key (ISO string), add 7 days
      const latest = new Date(weeks[0].key);
      nextMonday = new Date(latest);
      nextMonday.setDate(latest.getDate() + 7);
    } else {
      // Default to next Monday from today
      const today = new Date();
      const day = today.getDay();
      const diff = (1 + 7 - day) % 7; // 1 = Monday
      nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + diff);
    }
    router.push({ pathname: '/edit-week', params: { week: nextMonday.toISOString().slice(0, 10) } });
  };

  const handleEdit = (key: string) => {
    router.push({ pathname: '/edit-week', params: { week: key } });
  };

  const handleDelete = async (key: string) => {
    const entries = await Storage.getEntries();
    const monday = new Date(key);
    const weekDates = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
    const filtered = entries.filter(e => !weekDates.includes(e.date));
    await Storage.saveEntries(filtered);
    setWeeks(weeks.filter(w => w.key !== key));
    setSelected(selected.filter(s => s !== key));
  };

  const handleToggle = (key: string) => {
    setSelected(sel => sel.includes(key) ? sel.filter(k => k !== key) : [...sel, key]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weeks</Text>
      <Button title="Add Week" onPress={handleAddWeek} />
      <ScrollView style={{ width: '100%', marginTop: 16 }}>
        {weeks.map(week => (
          <View key={week.key} style={styles.weekRow}>
            <TouchableOpacity onPress={() => handleToggle(week.key)} style={styles.checkbox} accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(week.key) }}>
              {selected.includes(week.key) ? <Ionicons name="checkbox" size={24} color="#007AFF" /> : <Ionicons name="square-outline" size={24} color="#aaa" />}
            </TouchableOpacity>
            <Text style={styles.weekLabel}>{week.range}</Text>
            <Text style={styles.hours}>{week.total.toFixed(2)} h</Text>
            <TouchableOpacity onPress={() => handleEdit(week.key)} accessibilityLabel="Edit week" style={styles.iconBtn}>
              <Ionicons name="create-outline" size={22} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(week.key)} accessibilityLabel="Delete week" style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <Text style={styles.tally}>Total (selected): {tally.toFixed(2)} h</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: 'transparent', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  weekRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 8 },
  weekLabel: { flex: 1, fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  hours: { width: 70, textAlign: 'right', fontWeight: 'bold', fontSize: 16 },
  iconBtn: { marginLeft: 8 },
  tally: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  checkbox: { marginRight: 8 },
});

export default HomeScreen;
