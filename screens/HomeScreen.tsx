import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Storage } from '../storage/Storage';
import { calculateWorkedHours } from '../utils/timeUtils';
import { getMondayOfWeek } from '../utils/weekUtils';
import { TimeEntry, WeekSummary } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeContext } from '../app/_layout';

function getCurrentMondayKey(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - ((day + 6) % 7);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function groupEntriesByWeek(entries: TimeEntry[]): Record<string, TimeEntry[]> {
  const weekGroups: Record<string, TimeEntry[]> = {};
  entries.forEach(entry => {
    const mondayKey = generateWeekKey(new Date(entry.date));
    if (!weekGroups[mondayKey]) weekGroups[mondayKey] = [];
    weekGroups[mondayKey].push(entry);
  });
  return weekGroups;
}

function createWeekSummaries(weekGroupings: Record<string, TimeEntry[]>): WeekSummary[] {
  return Object.entries(weekGroupings)
    .map(([mondayKey, entries]) => {
      const mondayDate = new Date(mondayKey);
      const dateRange = formatWeekDateRange(mondayDate);
      const totalHours = calculateWeekTotalHours(entries);
      return {
        mondayDate: mondayKey,
        dateRange,
        entries,
        totalHours,
      };
    })
    .sort((a, b) => b.mondayDate.localeCompare(a.mondayDate));
}

function calculateWeekTotalHours(entries: TimeEntry[]): number {
  return entries.reduce((sum, entry) => {
    let worked = calculateWorkedHours(entry);
    let pto = 0;
    const entryPto = entry.paidTimeOffHours ?? entry.ptoHours;
    if (typeof entryPto === 'number') {
      pto = entryPto;
    } else if (typeof entryPto === 'string' && entryPto !== '') {
      const parsed = parseFloat(entryPto);
      if (!isNaN(parsed)) pto = parsed;
    }
    return sum + worked + pto;
  }, 0);
}

function calculateSelectedWeeksTotalHours(weekSummaries: WeekSummary[], selectedWeekKeys: string[]): number {
  return weekSummaries
    .filter(week => selectedWeekKeys.includes(week.mondayDate))
    .reduce((sum, week) => sum + week.totalHours, 0);
}

function generateWeekKey(date: Date): string {
  const mondayDate = getMondayOfWeek(date);
  return mondayDate.toISOString().slice(0, 10);
}

function formatWeekDateRange(mondayDate: Date): string {
  const fridayDate = new Date(mondayDate);
  fridayDate.setDate(mondayDate.getDate() + 4);
  return `${mondayDate.toISOString().slice(0, 10)} - ${fridayDate.toISOString().slice(0, 10)}`;
}

function generateWeekDatesList(mondayDate: Date): string[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const HomeScreen = () => {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const [weekSummaries, setWeekSummaries] = useState<WeekSummary[]>([]);
  const [selectedWeekKeys, setSelectedWeekKeys] = useState<string[]>([]);
  const [totalSelectedHours, setTotalSelectedHours] = useState(0);
  const currentMondayKey = getCurrentMondayKey();

  useFocusEffect(
    React.useCallback(() => {
      loadWeekSummaries();
    }, [])
  );

  useEffect(() => {
    setTotalSelectedHours(calculateSelectedWeeksTotalHours(weekSummaries, selectedWeekKeys));
  }, [selectedWeekKeys, weekSummaries]);

  async function loadWeekSummaries() {
    const timeEntries = await Storage.getEntries();
    const weekGroupings = groupEntriesByWeek(timeEntries);
    const summaries = createWeekSummaries(weekGroupings);
    setWeekSummaries(summaries);
  }

  function handleAddWeek() {
    const nextAvailableWeek = findNextAvailableWeek();
    router.push({ pathname: '/new-week', params: { week: nextAvailableWeek } });
  }

  function findNextAvailableWeek(): string {
    const existingWeekKeys = new Set(weekSummaries.map(week => week.mondayDate));
    let candidateMonday = getMondayOfWeek(new Date());
    let candidateKey = candidateMonday.toISOString().slice(0, 10);
    while (existingWeekKeys.has(candidateKey)) {
      candidateMonday.setDate(candidateMonday.getDate() + 7);
      candidateKey = candidateMonday.toISOString().slice(0, 10);
    }
    return candidateKey;
  }

  function handleEditWeek(mondayKey: string) {
    router.push({ pathname: '/edit-week', params: { week: mondayKey } });
  }

  function handleDeleteWeek(mondayKey: string) {
    Alert.alert(
      'Delete Week',
      'Are you sure you want to delete this week?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const allEntries = await Storage.getEntries();
            const weekDates = generateWeekDatesList(new Date(mondayKey));
            const filteredEntries = allEntries.filter(entry => !weekDates.includes(entry.date));
            await Storage.saveEntries(filteredEntries);
            setWeekSummaries(weekSummaries.filter(week => week.mondayDate !== mondayKey));
            setSelectedWeekKeys(selectedWeekKeys.filter(key => key !== mondayKey));
          },
        },
      ],
      { cancelable: true }
    );
  }

  function handleToggleWeekSelection(mondayKey: string) {
    setSelectedWeekKeys(currentSelection =>
      currentSelection.includes(mondayKey)
        ? currentSelection.filter(key => key !== mondayKey)
        : [...currentSelection, mondayKey]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#222' : '#fff' }]}> 
      <Text style={[styles.title, { color: theme === 'dark' ? '#fff' : '#222' }]}>Weeks</Text>
      <Button title="Add Week" onPress={handleAddWeek} />
      <ScrollView style={styles.weeksList}>
        {weekSummaries.map(week => (
          <WeekRow
            key={week.mondayDate}
            week={week}
            isSelected={selectedWeekKeys.includes(week.mondayDate)}
            onToggleSelection={handleToggleWeekSelection}
            onEdit={handleEditWeek}
            onDelete={handleDeleteWeek}
            isCurrentWeek={week.mondayDate === currentMondayKey}
          />
        ))}
      </ScrollView>
      <Text style={[styles.totalHours, { color: theme === 'dark' ? '#fff' : '#222' }]}>Total (selected): {totalSelectedHours.toFixed(2)} h</Text>
    </View>
  );
};

interface WeekRowProps {
  week: WeekSummary;
  isSelected: boolean;
  onToggleSelection: (mondayKey: string) => void;
  onEdit: (mondayKey: string) => void;
  onDelete: (mondayKey: string) => void;
  isCurrentWeek?: boolean;
}

const WeekRow: React.FC<WeekRowProps> = ({ week, isSelected, onToggleSelection, onEdit, onDelete, isCurrentWeek }) => (
  <View style={[styles.weekRow, isCurrentWeek ? styles.currentWeekBorder : null]}>
    <TouchableOpacity
      onPress={() => onToggleSelection(week.mondayDate)}
      style={styles.checkbox}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
    >
      {isSelected ? (
        <Ionicons name="checkbox" size={24} color="#007AFF" />
      ) : (
        <Ionicons name="square-outline" size={24} color="#aaa" />
      )}
    </TouchableOpacity>
    <Text style={styles.weekLabel}>{week.dateRange}</Text>
    <TouchableOpacity onPress={() => onEdit(week.mondayDate)} accessibilityLabel="Edit week" style={styles.iconButton}>
      <Ionicons name="create-outline" size={22} color="#007AFF" />
    </TouchableOpacity>
    <Text style={styles.hours}>{week.totalHours.toFixed(2)} h</Text>
    <TouchableOpacity onPress={() => onDelete(week.mondayDate)} accessibilityLabel="Delete week" style={styles.iconButton}>
      <Ionicons name="trash-outline" size={22} color="#FF3B30" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  weeksList: {
    width: '100%',
    marginTop: 16,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
  },
  weekLabel: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  hours: {
    width: 70,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 16,
  },
  iconButton: {
    marginLeft: 8,
  },
  totalHours: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  checkbox: {
    marginRight: 8,
  },
  currentWeekBorder: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
});

export default HomeScreen;
