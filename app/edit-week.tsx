import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Button,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Storage } from '../storage/Storage';
import { TimeEntry, TimePicker } from '../types';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemeContext } from './_layout';
import {
  WEEKDAY_LABELS,
  getMondayOfWeek,
  generateWeekDates,
  prepareWeekInputs,
  calculateWeekSummary,
} from '../utils/weekUtils';

export default function EditWeekScreen() {
  const routeParameters = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useContext(ThemeContext);

  const initialWeekStartDate = routeParameters.week
    ? getMondayOfWeek(new Date(routeParameters.week as string))
    : getMondayOfWeek(new Date());

  const [selectedWeekStartDate, setSelectedWeekStartDate] = useState(initialWeekStartDate);
  const [isWeekPickerVisible, setIsWeekPickerVisible] = useState(false);
  const [weekTimeEntries, setWeekTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [weekSummaryText, setWeekSummaryText] = useState('');
  const [lunchDurationInputs, setLunchDurationInputs] = useState<string[]>([]);
  const [paidTimeOffInputs, setPaidTimeOffInputs] = useState<string[]>([]);
  const [timePickerState, setTimePickerState] = useState<TimePicker>({ dayIndex: -1, field: null });
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [selectedTimeForPicker, setSelectedTimeForPicker] = useState<Date>(new Date());

  useEffect(() => {
    if (routeParameters.week) {
      setSelectedWeekStartDate(getMondayOfWeek(new Date(routeParameters.week as string)));
    }
  }, [routeParameters.week]);

  useEffect(() => {
    loadWeekTimeEntries(selectedWeekStartDate);
  }, [selectedWeekStartDate]);

  const loadWeekTimeEntries = async (weekStartDate: Date) => {
    setIsLoadingData(true);

    const allStoredEntries = await Storage.getEntries();
    const weekDates = generateWeekDates(weekStartDate);

    const existingWeekEntries = weekDates.map((date) => {
      const existingEntry = allStoredEntries.find((entry) => entry.date === date);
      return (
        existingEntry || {
          id: Math.random().toString(),
          date,
          startTime: '',
          finishTime: '',
          lunchMinutes: 0,
          notes: '',
        }
      );
    });

    setWeekTimeEntries(existingWeekEntries);

    const { lunchHourInputs, paidTimeOffInputs } = prepareWeekInputs(existingWeekEntries);
    setLunchDurationInputs(lunchHourInputs);
    setPaidTimeOffInputs(paidTimeOffInputs);

    setIsLoadingData(false);
    setWeekSummaryText(calculateWeekSummary(existingWeekEntries, paidTimeOffInputs));
  };

  const handleSaveWeekData = async () => {
    const allStoredEntries = await Storage.getEntries();
    const weekDates = generateWeekDates(selectedWeekStartDate);

    const updatedEntries = allStoredEntries.filter((entry) => !weekDates.includes(entry.date));
    const processedWeekEntries = processTimeEntriesForSaving(weekTimeEntries, paidTimeOffInputs);

    const finalEntries = [...updatedEntries, ...processedWeekEntries].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    await Storage.saveEntries(finalEntries);
    Alert.alert('Saved', 'Week data has been updated.');
    router.replace('/home');
  };

  const processTimeEntriesForSaving = (entries: TimeEntry[], ptoInputs: string[]): TimeEntry[] => {
    return entries.map((entry, entryIndex) => {
      const ptoInputValue = ptoInputs[entryIndex];
      let paidTimeOffValue: number | undefined = undefined;

      if (ptoInputValue && ptoInputValue !== '.' && ptoInputValue !== '') {
        const parsedPtoValue = parseFloat(ptoInputValue);
        if (!isNaN(parsedPtoValue)) paidTimeOffValue = parsedPtoValue;
      }

      return {
        ...entry,
        paidTimeOffHours:
          ptoInputValue && ptoInputValue !== '' && ptoInputValue !== '.'
            ? paidTimeOffValue
            : undefined,
      };
    });
  };

  const handleWeekDateChange = (selectedDate: Date) => {
    setIsWeekPickerVisible(false);
    if (selectedDate) {
      setSelectedWeekStartDate(getMondayOfWeek(selectedDate));
    }
  };

  const handleTimePickerConfirm = (selectedTime: Date) => {
    setIsTimePickerVisible(false);

    if (timePickerState.dayIndex >= 0 && timePickerState.field) {
      const formattedTime = moment(selectedTime).format('HH:mm');
      const updatedEntries = [...weekTimeEntries];
      updatedEntries[timePickerState.dayIndex] = {
        ...updatedEntries[timePickerState.dayIndex],
        [timePickerState.field]: formattedTime,
      };
      setWeekTimeEntries(updatedEntries);
      setWeekSummaryText(calculateWeekSummary(updatedEntries, paidTimeOffInputs));
    }
  };

  const openTimePickerForField = (dayIndex: number, fieldName: 'startTime' | 'finishTime') => {
    const currentEntry = weekTimeEntries[dayIndex];
    const currentTimeValue = currentEntry[fieldName];

    let initialTime = new Date();
    if (currentTimeValue) {
      const [hours, minutes] = currentTimeValue.split(':').map(Number);
      initialTime.setHours(hours, minutes, 0, 0);
    }

    setSelectedTimeForPicker(initialTime);
    setTimePickerState({ dayIndex, field: fieldName });
    setIsTimePickerVisible(true);
  };

  const adjustLunchDuration = (dayIndex: number, adjustment: number) => {
    const currentEntry = weekTimeEntries[dayIndex];
    const newLunchMinutes = Math.max(0, (currentEntry.lunchMinutes || 0) + adjustment);

    const updatedEntries = [...weekTimeEntries];
    updatedEntries[dayIndex] = { ...currentEntry, lunchMinutes: newLunchMinutes };
    setWeekTimeEntries(updatedEntries);

    const updatedLunchInputs = [...lunchDurationInputs];
    updatedLunchInputs[dayIndex] = (newLunchMinutes / 60).toString();
    setLunchDurationInputs(updatedLunchInputs);

    setWeekSummaryText(calculateWeekSummary(updatedEntries, paidTimeOffInputs));
  };

  const formatWeekDateRange = (mondayDate: Date): string => {
    const fridayDate = new Date(mondayDate);
    fridayDate.setDate(mondayDate.getDate() + 4);

    return `${moment(mondayDate).format('MMM DD')} - ${moment(fridayDate).format('MMM DD, YYYY')}`;
  };

  const handleFillDownFromMonday = () => {
    const mondayEntry = weekTimeEntries[0];
    if (!mondayEntry.startTime || !mondayEntry.finishTime) return;

    const updatedEntries = weekTimeEntries.map((entry, index) => {
      if (index === 0) return entry;
      return {
        ...entry,
        startTime: mondayEntry.startTime,
        finishTime: mondayEntry.finishTime,
        lunchMinutes: mondayEntry.lunchMinutes,
      };
    });

    setWeekTimeEntries(updatedEntries);

    const updatedLunchInputs = lunchDurationInputs.map((_, index) =>
      index === 0 ? lunchDurationInputs[0] : (mondayEntry.lunchMinutes / 60).toString(),
    );
    setLunchDurationInputs(updatedLunchInputs);

    setWeekSummaryText(calculateWeekSummary(updatedEntries, paidTimeOffInputs));
  };

  const shouldShowFillDownButton = (): boolean => {
    const mondayEntry = weekTimeEntries[0];
    const hasValidMondayTimes = Boolean(mondayEntry.startTime && mondayEntry.finishTime);
    const remainingDaysAreEmpty = weekTimeEntries
      .slice(1)
      .every(
        (entry) =>
          !entry.startTime &&
          !entry.finishTime &&
          (!entry.lunchMinutes || entry.lunchMinutes === 0),
      );

    return hasValidMondayTimes && remainingDaysAreEmpty;
  };

  const isDarkTheme = theme === 'dark';
  const backgroundColor = isDarkTheme ? '#222' : '#fff';
  const textColor = isDarkTheme ? '#fff' : '#222';

  if (isLoadingData) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={{ color: textColor }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: textColor }]}>Edit Week</Text>

        <TouchableOpacity
          onPress={() => setIsWeekPickerVisible(true)}
          style={styles.weekPickerButton}
          accessibilityRole="button"
          accessibilityLabel="Select week to edit"
        >
          <Text style={[styles.weekPickerButtonText, { color: textColor }]}>
            Week: {formatWeekDateRange(selectedWeekStartDate)}
          </Text>
        </TouchableOpacity>

        {shouldShowFillDownButton() && (
          <TouchableOpacity
            onPress={handleFillDownFromMonday}
            style={styles.fillDownButton}
            accessibilityRole="button"
            accessibilityLabel="Fill all days with Monday's times"
          >
            <Text style={styles.fillDownButtonText}>Fill Down from Monday</Text>
          </TouchableOpacity>
        )}

        {weekTimeEntries.map((entry, dayIndex) => (
          <DayEntryFormComponent
            key={entry.date}
            entry={entry}
            dayIndex={dayIndex}
            dayLabel={WEEKDAY_LABELS[dayIndex]}
            lunchDurationInputs={lunchDurationInputs}
            paidTimeOffInputs={paidTimeOffInputs}
            textColor={textColor}
            onTimeFieldPress={openTimePickerForField}
            onLunchAdjustment={adjustLunchDuration}
            onPaidTimeOffChange={(newInputs) => {
              setPaidTimeOffInputs(newInputs);
              setWeekSummaryText(calculateWeekSummary(weekTimeEntries, newInputs));
            }}
          />
        ))}

        <Text style={[styles.summaryText, { color: textColor }]}>{weekSummaryText}</Text>

        <Button title="Save Week" onPress={handleSaveWeekData} />
      </ScrollView>

      <DateTimePickerModal
        isVisible={isWeekPickerVisible}
        mode="date"
        onConfirm={handleWeekDateChange}
        onCancel={() => setIsWeekPickerVisible(false)}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      />

      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={handleTimePickerConfirm}
        onCancel={() => setIsTimePickerVisible(false)}
        date={selectedTimeForPicker}
        is24Hour={true}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      />
    </View>
  );
}

interface DayEntryFormProps {
  entry: TimeEntry;
  dayIndex: number;
  dayLabel: string;
  lunchDurationInputs: string[];
  paidTimeOffInputs: string[];
  textColor: string;
  onTimeFieldPress: (dayIndex: number, field: 'startTime' | 'finishTime') => void;
  onLunchAdjustment: (dayIndex: number, adjustment: number) => void;
  onPaidTimeOffChange: (newInputs: string[]) => void;
}

function DayEntryFormComponent({
  entry,
  dayIndex,
  dayLabel,
  lunchDurationInputs,
  paidTimeOffInputs,
  textColor,
  onTimeFieldPress,
  onLunchAdjustment,
  onPaidTimeOffChange,
}: DayEntryFormProps) {
  return (
    <View style={styles.dayEntryContainer}>
      <Text style={[styles.dayLabel, { color: textColor }]}>
        {dayLabel} ({entry.date})
      </Text>

      <View style={styles.timeFieldsRow}>
        <TouchableOpacity
          style={[styles.timeInputField, { borderColor: '#ccc' }]}
          onPress={() => onTimeFieldPress(dayIndex, 'startTime')}
          accessibilityRole="button"
          accessibilityLabel={`Select start time for ${dayLabel}`}
        >
          <Text style={{ color: textColor }}>{entry.startTime || 'Start'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.timeInputField, { borderColor: '#ccc' }]}
          onPress={() => onTimeFieldPress(dayIndex, 'finishTime')}
          accessibilityRole="button"
          accessibilityLabel={`Select finish time for ${dayLabel}`}
        >
          <Text style={{ color: textColor }}>{entry.finishTime || 'Finish'}</Text>
        </TouchableOpacity>
      </View>

      <LunchDurationControlComponent
        dayIndex={dayIndex}
        dayLabel={dayLabel}
        lunchMinutes={entry.lunchMinutes || 0}
        onAdjustment={onLunchAdjustment}
        textColor={textColor}
      />

      <PaidTimeOffSectionComponent
        dayIndex={dayIndex}
        paidTimeOffInputs={paidTimeOffInputs}
        onInputChange={onPaidTimeOffChange}
        textColor={textColor}
      />
    </View>
  );
}

interface LunchDurationControlProps {
  dayIndex: number;
  dayLabel: string;
  lunchMinutes: number;
  onAdjustment: (dayIndex: number, adjustment: number) => void;
  textColor: string;
}

function LunchDurationControlComponent({
  dayIndex,
  dayLabel,
  lunchMinutes,
  onAdjustment,
  textColor,
}: LunchDurationControlProps) {
  return (
    <View style={styles.lunchControlRow}>
      <TouchableOpacity
        style={styles.lunchAdjustmentButton}
        onPress={() => onAdjustment(dayIndex, -15)}
        accessibilityRole="button"
        accessibilityLabel={`Decrease lunch duration for ${dayLabel}`}
      >
        <Text style={styles.lunchAdjustmentButtonText}>-</Text>
      </TouchableOpacity>

      <Text style={[styles.lunchDurationDisplay, { color: textColor }]}>
        Lunch: {lunchMinutes}min
      </Text>

      <TouchableOpacity
        style={styles.lunchAdjustmentButton}
        onPress={() => onAdjustment(dayIndex, 15)}
        accessibilityRole="button"
        accessibilityLabel={`Increase lunch duration for ${dayLabel}`}
      >
        <Text style={styles.lunchAdjustmentButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

interface PaidTimeOffSectionProps {
  dayIndex: number;
  paidTimeOffInputs: string[];
  onInputChange: (newInputs: string[]) => void;
  textColor: string;
}

function PaidTimeOffSectionComponent({
  dayIndex,
  paidTimeOffInputs,
  onInputChange,
  textColor,
}: PaidTimeOffSectionProps) {
  const handlePaidTimeOffInputChange = (newValue: string) => {
    const updatedInputs = [...paidTimeOffInputs];
    updatedInputs[dayIndex] = newValue;
    onInputChange(updatedInputs);
  };

  return (
    <View style={styles.paidTimeOffRow}>
      <Text style={[styles.paidTimeOffLabel, { color: textColor }]}>PTO Hours:</Text>

      <TextInput
        style={[styles.paidTimeOffInput, { borderColor: '#ccc', color: textColor }]}
        value={paidTimeOffInputs[dayIndex] || ''}
        onChangeText={handlePaidTimeOffInputChange}
        placeholder="0"
        placeholderTextColor="#999"
        keyboardType="numeric"
        accessibilityLabel="Paid time off hours"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  weekPickerButton: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  weekPickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  fillDownButton: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#28a745',
    borderRadius: 8,
    alignItems: 'center',
  },
  fillDownButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dayEntryContainer: {
    marginBottom: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeFieldsRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  timeInputField: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  lunchControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  lunchAdjustmentButton: {
    width: 32,
    height: 32,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lunchAdjustmentButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lunchDurationDisplay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
  },
  paidTimeOffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paidTimeOffLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  paidTimeOffInput: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderRadius: 4,
    fontSize: 14,
    textAlign: 'center',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
  },
});
