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
import { Picker } from '@react-native-picker/picker';
import { ThemeContext } from './_layout';
import {
  WEEKDAY_LABELS,
  getMondayOfWeek,
  generateWeekDates,
  createEmptyWeekEntries,
  prepareWeekInputs,
  calculateWeekSummary,
} from '../utils/weekUtils';
export default function AddWeekScreen() {
  const routeParams = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const initialWeekDate = routeParams.week
    ? getMondayOfWeek(new Date(routeParams.week as string))
    : getMondayOfWeek(new Date());
  const [selectedWeekDate, setSelectedWeekDate] = useState(initialWeekDate);
  const [isWeekPickerVisible, setIsWeekPickerVisible] = useState(false);
  const [weekTimeEntries, setWeekTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekSummary, setWeekSummary] = useState('');
  const [lunchHourInputs, setLunchHourInputs] = useState<string[]>([]);
  const [paidTimeOffInputs, setPaidTimeOffInputs] = useState<string[]>([]);
  const [timePickerState, setTimePickerState] = useState<TimePicker>({ dayIndex: -1, field: null });
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [timePickerValue, setTimePickerValue] = useState<Date>(new Date());
  useEffect(() => {
    if (routeParams.week) {
      setSelectedWeekDate(getMondayOfWeek(new Date(routeParams.week as string)));
    }
  }, [routeParams.week]);
  useEffect(() => {
    initializeWeekData(selectedWeekDate);
  }, [selectedWeekDate]);
  const initializeWeekData = async (weekDate: Date) => {
    setIsLoading(true);
    const weekDates = generateWeekDates(weekDate);
    const emptyWeekEntries = createEmptyWeekEntries(weekDates);
    setWeekTimeEntries(emptyWeekEntries);
    const { lunchHourInputs, paidTimeOffInputs } = prepareWeekInputs(emptyWeekEntries);
    setLunchHourInputs(lunchHourInputs);
    setPaidTimeOffInputs(paidTimeOffInputs);
    setIsLoading(false);
    setWeekSummary(calculateWeekSummary(emptyWeekEntries, paidTimeOffInputs));
  };
  const handleSaveWeek = async () => {
    const existingEntries = await Storage.getEntries();
    const weekDates = generateWeekDates(selectedWeekDate);
    const hasExistingWeek = existingEntries.some((entry) => weekDates.includes(entry.date));
    if (hasExistingWeek) {
      Alert.alert('Week already exists', 'A week with these dates already exists.');
      return;
    }
    const processedEntries = processWeekEntries(weekTimeEntries, paidTimeOffInputs);
    const updatedEntries = [...existingEntries, ...processedEntries];
    await Storage.saveEntries(updatedEntries);
    Alert.alert('Added', 'New week created.');
    router.replace('/home');
  };
  const processWeekEntries = (entries: TimeEntry[], ptoInputs: string[]): TimeEntry[] => {
    return entries.map((entry, entryIndex) => {
      const ptoString = ptoInputs[entryIndex];
      let ptoValue: number | undefined = undefined;
      if (ptoString && ptoString !== '.' && ptoString !== '') {
        const parsedValue = parseFloat(ptoString);
        if (!isNaN(parsedValue)) ptoValue = parsedValue;
      }
      return {
        ...entry,
        paidTimeOffHours: ptoString && ptoString !== '' && ptoString !== '.' ? ptoValue : undefined,
      };
    });
  };
  const handleWeekDateChange = (selectedDate: Date) => {
    setIsWeekPickerVisible(false);
    if (selectedDate) {
      setSelectedWeekDate(getMondayOfWeek(selectedDate));
    }
  };
  const openTimePicker = (
    dayIndex: number,
    field: 'startTime' | 'finishTime',
    currentValue: string,
  ) => {
    setTimePickerState({ dayIndex, field });
    if (currentValue) {
      const [hours, minutes] = currentValue.split(':').map(Number);
      const timeDate = new Date();
      timeDate.setHours(hours, minutes, 0, 0);
      setTimePickerValue(timeDate);
    } else {
      setTimePickerValue(new Date());
    }
    setIsTimePickerVisible(true);
  };
  const closeTimePicker = () => {
    setIsTimePickerVisible(false);
    setTimePickerState({ dayIndex: -1, field: null });
  };
  const handleTimeSelection = (selectedTime: Date) => {
    if (timePickerState.dayIndex >= 0 && timePickerState.field) {
      const formattedTime = moment(selectedTime).format('HH:mm');
      updateTimeEntry(timePickerState.dayIndex, timePickerState.field, formattedTime);
    }
    closeTimePicker();
  };
  const updateTimeEntry = (
    dayIndex: number,
    field: keyof TimeEntry | 'isAnnualLeave' | 'paidTimeOffHours',
    value: string | boolean,
  ) => {
    const updatedEntries = [...weekTimeEntries];
    let updatedPtoInputs = [...paidTimeOffInputs];
    if (field === 'lunchMinutes') {
      updatedEntries[dayIndex][field] = value ? Math.round(parseFloat(value as string) * 60) : 0;
    } else if (field === 'tags') {
      updatedEntries[dayIndex][field] = value
        ? (value as string).split(',').map((tag) => tag.trim())
        : [];
    } else if (field === 'isAnnualLeave') {
      (updatedEntries[dayIndex] as any).isAnnualLeave = value;
      if (!value) {
        (updatedEntries[dayIndex] as any).paidTimeOffHours = undefined;
        updatedPtoInputs[dayIndex] = '';
      }
    } else if (field === 'paidTimeOffHours') {
      if (typeof value === 'string') {
        (updatedEntries[dayIndex] as any).paidTimeOffHours =
          value === '' || value === '.' ? value : parseFloat(value);
        updatedPtoInputs[dayIndex] = value;
      } else {
        (updatedEntries[dayIndex] as any).paidTimeOffHours = value;
        updatedPtoInputs[dayIndex] = value ? String(value) : '';
      }
    } else if (field === 'startTime' || field === 'finishTime' || field === 'notes') {
      updatedEntries[dayIndex][field] = value as string;
    }
    setWeekTimeEntries(updatedEntries);
    setPaidTimeOffInputs(updatedPtoInputs);
    setWeekSummary(calculateWeekSummary(updatedEntries, updatedPtoInputs));
  };
  const updateLunchHours = (dayIndex: number, newValue: string) => {
    const updatedLunchInputs = [...lunchHourInputs];
    updatedLunchInputs[dayIndex] = newValue;
    setLunchHourInputs(updatedLunchInputs);
    const updatedEntries = [...weekTimeEntries];
    updatedEntries[dayIndex].lunchMinutes = newValue ? Math.round(parseFloat(newValue) * 60) : 0;
    setWeekTimeEntries(updatedEntries);
    setWeekSummary(calculateWeekSummary(updatedEntries, paidTimeOffInputs));
  };
  const fillDownMondayValues = () => {
    const mondayEntry = weekTimeEntries[0];
    const filledEntries = weekTimeEntries.map((entry, dayIndex) =>
      dayIndex === 0
        ? entry
        : {
            ...entry,
            startTime: mondayEntry.startTime,
            finishTime: mondayEntry.finishTime,
            lunchMinutes: mondayEntry.lunchMinutes,
            paidTimeOffHours: (mondayEntry as any).paidTimeOffHours,
            isAnnualLeave: (mondayEntry as any).isAnnualLeave,
          },
    );
    const filledLunchInputs = lunchHourInputs.map((value, dayIndex) =>
      dayIndex === 0 ? value : lunchHourInputs[0],
    );
    const filledPtoInputs = paidTimeOffInputs.map((value, dayIndex) =>
      dayIndex === 0 ? value : paidTimeOffInputs[0],
    );
    setWeekTimeEntries(filledEntries);
    setLunchHourInputs(filledLunchInputs);
    setPaidTimeOffInputs(filledPtoInputs);
    setWeekSummary(calculateWeekSummary(filledEntries, filledPtoInputs));
  };
  if (isLoading) {
    return <Text>Loading...</Text>;
  }
  const mondayDate = getMondayOfWeek(selectedWeekDate);
  const weekDateLabel = formatWeekDateRange(mondayDate);
  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#222' : '#fff' }}>
      <ScrollView
        style={[styles.container, { backgroundColor: 'transparent' }]}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={[styles.title, { color: theme === 'dark' ? '#fff' : '#222' }]}>
          Add New Week
        </Text>
        <TouchableOpacity
          onPress={() => setIsWeekPickerVisible(true)}
          style={styles.weekPickerButton}
          accessibilityRole="button"
        >
          <Text style={styles.weekPickerText}>Select Week: {weekDateLabel}</Text>
        </TouchableOpacity>
        {isWeekPickerVisible && (
          <DateTimePickerModal
            isVisible={isWeekPickerVisible}
            mode="date"
            date={selectedWeekDate}
            onConfirm={handleWeekDateChange}
            onCancel={() => setIsWeekPickerVisible(false)}
            isDarkModeEnabled={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          />
        )}
        {weekTimeEntries.map((entry, dayIndex) => (
          <DayEntryForm
            key={entry.date}
            entry={entry}
            dayIndex={dayIndex}
            dayLabel={WEEKDAY_LABELS[dayIndex]}
            lunchHours={lunchHourInputs[dayIndex]}
            paidTimeOffHours={paidTimeOffInputs[dayIndex]}
            onTimeFieldPress={openTimePicker}
            onFieldChange={updateTimeEntry}
            onLunchChange={updateLunchHours}
          />
        ))}
        {shouldShowFillDownButton(weekTimeEntries) && (
          <TouchableOpacity
            style={styles.fillDownButton}
            onPress={fillDownMondayValues}
            accessibilityRole="button"
          >
            <Text style={styles.fillDownButtonText}>Fill Down</Text>
          </TouchableOpacity>
        )}
        <View style={styles.summaryContainer}>
          <Text style={[styles.summaryText, { color: theme === 'dark' ? '#fff' : '#222' }]}>
            Total hours: {weekSummary}
          </Text>
          <Button title="Add Week" onPress={handleSaveWeek} />
        </View>
      </ScrollView>
      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        date={timePickerValue}
        onConfirm={handleTimeSelection}
        onCancel={closeTimePicker}
        isDarkModeEnabled={false}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        minuteInterval={5}
        accessibilityLabel="Time picker"
      />
    </View>
  );
}
interface DayEntryFormProps {
  entry: TimeEntry;
  dayIndex: number;
  dayLabel: string;
  lunchHours: string;
  paidTimeOffHours: string;
  onTimeFieldPress: (
    dayIndex: number,
    field: 'startTime' | 'finishTime',
    currentValue: string,
  ) => void;
  onFieldChange: (
    dayIndex: number,
    field: keyof TimeEntry | 'isAnnualLeave' | 'paidTimeOffHours',
    value: string | boolean,
  ) => void;
  onLunchChange: (dayIndex: number, value: string) => void;
}
const DayEntryForm: React.FC<DayEntryFormProps> = ({
  entry,
  dayIndex,
  dayLabel,
  lunchHours,
  paidTimeOffHours,
  onTimeFieldPress,
  onFieldChange,
  onLunchChange,
}) => {
  const isAnnualLeave = (entry as any).isAnnualLeave || false;
  const lunchValue = lunchHours !== undefined && lunchHours !== '' ? parseFloat(lunchHours) : 0;
  return (
    <View style={styles.dayBlock}>
      <Text style={styles.dayLabel}>
        {dayLabel} ({entry.date})
      </Text>
      <View style={styles.timeFieldsRow}>
        <TouchableOpacity
          style={styles.timeField}
          onPress={() => onTimeFieldPress(dayIndex, 'startTime', entry.startTime)}
          accessible
          accessibilityLabel={`Select start time for ${dayLabel}`}
          disabled={isAnnualLeave}
        >
          <Text style={{ color: entry.startTime ? '#222' : '#888' }}>
            {entry.startTime || 'Start'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.timeField}
          onPress={() => onTimeFieldPress(dayIndex, 'finishTime', entry.finishTime)}
          accessible
          accessibilityLabel={`Select finish time for ${dayLabel}`}
          disabled={isAnnualLeave}
        >
          <Text style={{ color: entry.finishTime ? '#222' : '#888' }}>
            {entry.finishTime || 'Finish'}
          </Text>
        </TouchableOpacity>
        <LunchDurationControl
          value={lunchValue}
          isDisabled={isAnnualLeave}
          onChange={(newValue) => onLunchChange(dayIndex, newValue.toFixed(2))}
          dayLabel={dayLabel}
        />
      </View>
      <PaidTimeOffSection
        isAnnualLeave={isAnnualLeave}
        paidTimeOffHours={paidTimeOffHours}
        notes={entry.notes}
        onLeaveToggle={(value) => onFieldChange(dayIndex, 'isAnnualLeave', value)}
        onPtoHoursChange={(value) => onFieldChange(dayIndex, 'paidTimeOffHours', value)}
        onNotesChange={(value) => onFieldChange(dayIndex, 'notes', value)}
      />
    </View>
  );
};
interface LunchDurationControlProps {
  value: number;
  isDisabled: boolean;
  onChange: (newValue: number) => void;
  dayLabel: string;
}
const LunchDurationControl: React.FC<LunchDurationControlProps> = ({
  value,
  isDisabled,
  onChange,
  dayLabel,
}) => (
  <View style={styles.lunchControls}>
    <TouchableOpacity
      style={styles.lunchButton}
      onPress={() => onChange(Math.max(0, value - 0.25))}
      accessibilityLabel="Decrease lunch by 0.25 hours"
      disabled={isDisabled || value <= 0}
    >
      <Text style={styles.lunchButtonText}>-</Text>
    </TouchableOpacity>
    <TextInput
      style={styles.lunchInput}
      value={value.toFixed(2)}
      editable={false}
      accessibilityLabel={`Lunch duration for ${dayLabel}`}
    />
    <TouchableOpacity
      style={styles.lunchButton}
      onPress={() => onChange(Math.min(4, value + 0.25))}
      accessibilityLabel="Increase lunch by 0.25 hours"
      disabled={isDisabled || value >= 4}
    >
      <Text style={styles.lunchButtonText}>+</Text>
    </TouchableOpacity>
    <Text style={styles.hoursLabel}>h</Text>
  </View>
);
interface PaidTimeOffSectionProps {
  isAnnualLeave: boolean;
  paidTimeOffHours: string;
  notes?: string;
  onLeaveToggle: (value: boolean) => void;
  onPtoHoursChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}
const PaidTimeOffSection: React.FC<PaidTimeOffSectionProps> = ({
  isAnnualLeave,
  paidTimeOffHours,
  notes,
  onLeaveToggle,
  onPtoHoursChange,
  onNotesChange,
}) => (
  <View style={styles.paidTimeOffRow}>
    <Text style={styles.paidTimeOffLabel}>PTO:</Text>
    <Picker
      selectedValue={isAnnualLeave ? 'yes' : 'no'}
      style={styles.picker}
      onValueChange={(value) => onLeaveToggle(value === 'yes')}
    >
      <Picker.Item label="No" value="no" />
      <Picker.Item label="Yes" value="yes" />
    </Picker>
    {isAnnualLeave && (
      <>
        <TextInput
          style={styles.paidTimeOffInput}
          placeholder="PTO hrs"
          value={paidTimeOffHours}
          onChangeText={(value) => {
            if (/^\d*\.?\d*$/.test(value)) {
              onPtoHoursChange(value);
            }
          }}
          keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
          inputMode="decimal"
        />
        <TextInput
          style={styles.notesInput}
          placeholder="Notes"
          value={notes}
          onChangeText={onNotesChange}
          multiline
        />
      </>
    )}
  </View>
);
function shouldShowFillDownButton(entries: TimeEntry[]): boolean {
  const mondayEntry = entries[0];
  const hasCompleteMonday = Boolean(mondayEntry.startTime && mondayEntry.finishTime);
  const otherDaysEmpty = entries
    .slice(1)
    .every(
      (entry) =>
        !entry.startTime && !entry.finishTime && (!entry.lunchMinutes || entry.lunchMinutes === 0),
    );
  return hasCompleteMonday && otherDaysEmpty;
}
function formatWeekDateRange(mondayDate: Date): string {
  const fridayDate = new Date(mondayDate);
  fridayDate.setDate(mondayDate.getDate() + 4);
  return `${mondayDate.toISOString().slice(0, 10)} - ${fridayDate.toISOString().slice(0, 10)}`;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  weekPickerButton: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  weekPickerText: {
    textAlign: 'center',
    fontSize: 16,
  },
  dayBlock: {
    marginBottom: 18,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeFieldsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeField: {
    width: 90,
    height: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  lunchControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    flex: 1,
  },
  lunchButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
  },
  lunchButtonText: {
    fontSize: 18,
    lineHeight: 24,
    color: '#333',
  },
  lunchInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    textAlign: 'center',
    color: '#222',
  },
  hoursLabel: {
    marginLeft: 4,
  },
  paidTimeOffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  paidTimeOffLabel: {
    marginRight: 8,
  },
  picker: {
    width: 100,
    height: 36,
  },
  paidTimeOffInput: {
    width: 90,
    height: 36,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  notesInput: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlignVertical: 'top',
    marginTop: 4,
  },
  fillDownButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fillDownButtonText: {
    fontWeight: 'bold',
  },
  summaryContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});
