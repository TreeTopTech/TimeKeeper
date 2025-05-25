import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Storage } from '../storage/Storage';
import { calculateWorkedHours } from '../utils/timeUtils';
import { getMondayOfWeek } from '../utils/weekUtils';
import { TimeEntry, WeekSummary } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeContext } from '../app/_layout';

const HomeScreen = () => {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const [weekSummaries, setWeekSummaries] = useState<WeekSummary[]>([]);
  const [selectedWeekKeys, setSelectedWeekKeys] = useState<string[]>([]);
  const [totalSelectedHours, setTotalSelectedHours] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      loadWeekSummaries();
    }, []),
  );

  useEffect(() => {
    calculateSelectedWeeksTotalHours();
  }, [selectedWeekKeys, weekSummaries]);

  const loadWeekSummaries = async () => {
    const timeEntries = await Storage.getEntries();
    const weekGroupings = groupEntriesByWeek(timeEntries);
    const summaries = createWeekSummaries(weekGroupings);
    setWeekSummaries(summaries);
  };

  const groupEntriesByWeek = (entries: TimeEntry[]): Record<string, TimeEntry[]> => {
    const weekGroups: Record<string, TimeEntry[]> = {};

    entries.forEach((entry) => {
      const mondayKey = generateWeekKey(new Date(entry.date));
      if (!weekGroups[mondayKey]) {
        weekGroups[mondayKey] = [];
      }
      weekGroups[mondayKey].push(entry);
    });

    return weekGroups;
  };

  const createWeekSummaries = (weekGroupings: Record<string, TimeEntry[]>): WeekSummary[] => {
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
      .sort((first, second) => second.mondayDate.localeCompare(first.mondayDate));
  };

  const calculateWeekTotalHours = (entries: TimeEntry[]): number => {
    return entries.reduce((total, entry) => {
      let workedHours = calculateWorkedHours(entry);
      let paidTimeOffHours = 0;

      const entryPto = (entry as any).paidTimeOffHours || (entry as any).ptoHours;
      if (typeof entryPto === 'number') {
        paidTimeOffHours = entryPto;
      } else if (typeof entryPto === 'string' && entryPto !== '') {
        const parsedPto = parseFloat(entryPto);
        if (!isNaN(parsedPto)) paidTimeOffHours = parsedPto;
      }

      return total + workedHours + paidTimeOffHours;
    }, 0);
  };

  const calculateSelectedWeeksTotalHours = () => {
    const selectedTotal = weekSummaries
      .filter((week) => selectedWeekKeys.includes(week.mondayDate))
      .reduce((total, week) => total + week.totalHours, 0);
    setTotalSelectedHours(selectedTotal);
  };

  const handleAddWeek = () => {
    const nextAvailableWeek = findNextAvailableWeek();
    router.push({
      pathname: '/new-week',
      params: { week: nextAvailableWeek },
    });
  };

  const findNextAvailableWeek = (): string => {
    const existingWeekKeys = new Set(weekSummaries.map((week) => week.mondayDate));
    let candidateMonday = getMondayOfWeek(new Date());
    let candidateKey = candidateMonday.toISOString().slice(0, 10);

    while (existingWeekKeys.has(candidateKey)) {
      candidateMonday.setDate(candidateMonday.getDate() + 7);
      candidateKey = candidateMonday.toISOString().slice(0, 10);
    }

    return candidateKey;
  };

  const handleEditWeek = (mondayKey: string) => {
    router.push({
      pathname: '/edit-week',
      params: { week: mondayKey },
    });
  };

  const handleDeleteWeek = async (mondayKey: string) => {
    const allEntries = await Storage.getEntries();
    const weekDates = generateWeekDatesList(new Date(mondayKey));
    const filteredEntries = allEntries.filter((entry) => !weekDates.includes(entry.date));

    await Storage.saveEntries(filteredEntries);
    setWeekSummaries(weekSummaries.filter((week) => week.mondayDate !== mondayKey));
    setSelectedWeekKeys(selectedWeekKeys.filter((key) => key !== mondayKey));
  };

  const handleToggleWeekSelection = (mondayKey: string) => {
    setSelectedWeekKeys((currentSelection) =>
      currentSelection.includes(mondayKey)
        ? currentSelection.filter((key) => key !== mondayKey)
        : [...currentSelection, mondayKey],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#222' : '#fff' }]}>
      <Text style={[styles.title, { color: theme === 'dark' ? '#fff' : '#222' }]}>Weeks</Text>

      <Button title="Add Week" onPress={handleAddWeek} />

      <ScrollView style={styles.weeksList}>
        {weekSummaries.map((week) => (
          <WeekRow
            key={week.mondayDate}
            week={week}
            isSelected={selectedWeekKeys.includes(week.mondayDate)}
            onToggleSelection={handleToggleWeekSelection}
            onEdit={handleEditWeek}
            onDelete={handleDeleteWeek}
          />
        ))}
      </ScrollView>

      <Text style={[styles.totalHours, { color: theme === 'dark' ? '#fff' : '#222' }]}>
        Total (selected): {totalSelectedHours.toFixed(2)} h
      </Text>
    </View>
  );
};

interface WeekRowProps {
  week: WeekSummary;
  isSelected: boolean;
  onToggleSelection: (mondayKey: string) => void;
  onEdit: (mondayKey: string) => void;
  onDelete: (mondayKey: string) => void;
}

const WeekRow: React.FC<WeekRowProps> = ({
  week,
  isSelected,
  onToggleSelection,
  onEdit,
  onDelete,
}) => (
  <View style={styles.weekRow}>
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

    <Text style={styles.hours}>{week.totalHours.toFixed(2)} h</Text>

    <TouchableOpacity
      onPress={() => onEdit(week.mondayDate)}
      accessibilityLabel="Edit week"
      style={styles.iconButton}
    >
      <Ionicons name="create-outline" size={22} color="#007AFF" />
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => onDelete(week.mondayDate)}
      accessibilityLabel="Delete week"
      style={styles.iconButton}
    >
      <Ionicons name="trash-outline" size={22} color="#FF3B30" />
    </TouchableOpacity>
  </View>
);

function generateWeekKey(date: Date): string {
  const mondayDate = getMondayOfWeek(date);
  return mondayDate.toISOString().slice(0, 10);
}

function formatWeekDateRange(mondayDate: Date): string {
  const fridayDate = new Date(mondayDate);
  fridayDate.setDate(mondayDate.getDate() + 4);

  const startDateString = mondayDate.toISOString().slice(0, 10);
  const endDateString = fridayDate.toISOString().slice(0, 10);

  return `${startDateString} - ${endDateString}`;
}

function generateWeekDatesList(mondayDate: Date): string[] {
  return Array.from({ length: 5 }, (_, dayIndex) => {
    const currentDay = new Date(mondayDate);
    currentDay.setDate(mondayDate.getDate() + dayIndex);
    return currentDay.toISOString().slice(0, 10);
  });
}

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
});

export default HomeScreen;
