import React, { useEffect, useState } from 'react';
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
import { TimeEntry } from '../types';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - ((day + 6) % 7);
  return new Date(d.setDate(diff));
}

export default function EditWeekScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const initialDate = params.week ? new Date(params.week as string) : new Date();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [showPicker, setShowPicker] = useState(false);
  const [weekEntries, setWeekEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [lunchInputs, setLunchInputs] = useState<string[]>([]);
  const [pickerState, setPickerState] = useState<{ idx: number; field: 'startTime' | 'finishTime' | null }>({ idx: -1, field: null });
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerValue, setPickerValue] = useState<Date>(new Date());
  // Track if this is a new week (add) or editing existing
  const [isEditMode, setIsEditMode] = useState(false);

  // Lunch options: 0 to 4 hours in 0.25 increments
  const lunchOptions = Array.from({ length: 17 }, (_, i) => (i * 0.25).toFixed(2));

  useEffect(() => {
    (async () => {
      setLoading(true);
      const monday = getMonday(selectedDate);
      const weekDates = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toISOString().slice(0, 10);
      });
      const entries = await Storage.getEntries();
      // Check if any entry for this week exists
      const weekHasData = weekDates.some(date => entries.some(e => e.date === date));
      setIsEditMode(weekHasData);
      let week;
      if (weekHasData) {
        // Editing: load existing entries for this week
        week = weekDates.map(date =>
          entries.find(e => e.date === date) || {
            id: date,
            date,
            startTime: '',
            finishTime: '',
            lunchMinutes: 0,
            notes: '',
          }
        );
      } else {
        // Adding: always blank
        week = weekDates.map(date => ({
          id: date,
          date,
          startTime: '',
          finishTime: '',
          lunchMinutes: 0,
          notes: '',
        }));
      }
      setWeekEntries(week);
      setLunchInputs(week.map(e => e.lunchMinutes ? (e.lunchMinutes / 60).toString() : ''));
      setLoading(false);
      updateSummary(week);
    })();
  }, [selectedDate]);

  const loadWeek = async (date: Date) => {
    setLoading(true);
    const monday = getMonday(date);
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
    setLunchInputs(week.map(e => e.lunchMinutes ? (e.lunchMinutes / 60).toString() : ''));
    setLoading(false);
    updateSummary(week);
  };

  const handleChange = (idx: number, field: keyof TimeEntry | 'isAnnualLeave' | 'ptoHours', value: string | boolean) => {
    const updated = [...weekEntries];
    if (field === 'lunchMinutes') {
      updated[idx][field] = value ? Math.round(parseFloat(value as string) * 60) : 0;
    } else if (field === 'tags') {
      updated[idx][field] = value ? (value as string).split(',').map((s) => s.trim()) : [];
    } else if (field === 'isAnnualLeave') {
      (updated[idx] as any).isAnnualLeave = value;
      if (!value) (updated[idx] as any).ptoHours = undefined;
    } else if (field === 'ptoHours') {
      (updated[idx] as any).ptoHours = value ? parseFloat(value as string) : undefined;
    } else if (field === 'startTime' || field === 'finishTime' || field === 'notes') {
      updated[idx][field] = value as string;
    }
    setWeekEntries(updated);
    updateSummary(updated);
  };

  const handleLunchChange = (idx: number, value: string) => {
    const newInputs = [...lunchInputs];
    newInputs[idx] = value;
    setLunchInputs(newInputs);
    // Also update weekEntries immediately for UI consistency
    const updated = [...weekEntries];
    updated[idx].lunchMinutes = value ? Math.round(parseFloat(value) * 60) : 0;
    setWeekEntries(updated);
    updateSummary(updated);
  };

  const updateSummary = (entries: TimeEntry[]) => {
    let total = 0;
    for (const e of entries) {
      if (e.startTime && e.finishTime) {
        const [sh, sm] = e.startTime.split(':').map(Number);
        const [eh, em] = e.finishTime.split(':').map(Number);
        const mins = eh * 60 + em - (sh * 60 + sm) - (e.lunchMinutes || 0);
        total += Math.max(0, mins);
      }
    }
    setSummary(`Total: ${(total / 60).toFixed(2)} hours`);
  };

  const handleSave = async () => {
    const entries = await Storage.getEntries();
    const monday = getMonday(selectedDate);
    const weekDates = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
    let updated;
    if (isEditMode) {
      // Update or add for this week only
      updated = [...entries];
      for (const day of weekEntries) {
        const idx = updated.findIndex(e => e.date === day.date);
        if (idx >= 0) updated[idx] = day;
        else updated.push(day);
      }
    } else {
      // Add new week: remove any existing entries for these dates, then add
      updated = entries.filter(e => !weekDates.includes(e.date));
      updated = [...updated, ...weekEntries];
    }
    await Storage.saveEntries(updated);
    Alert.alert('Saved', isEditMode ? 'Week entries updated.' : 'New week added.');
    router.replace('/home');
  };

  const handleDateChange = (_event: any, date?: Date) => {
    setShowPicker(false);
    if (date) setSelectedDate(date);
  };

  const openTimePicker = (idx: number, field: 'startTime' | 'finishTime', initial: string) => {
    setPickerState({ idx, field });
    if (initial) {
      const [h, m] = initial.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      setPickerValue(d);
    } else {
      setPickerValue(new Date());
    }
    setPickerVisible(true);
  };
  const closeTimePicker = () => {
    setPickerVisible(false);
    setPickerState({ idx: -1, field: null });
  };
  const handleTimePicked = (date: Date) => {
    if (pickerState.idx >= 0 && pickerState.field) {
      const formatted = moment(date).format('HH:mm');
      handleChange(pickerState.idx, pickerState.field, formatted);
    }
    closeTimePicker();
  };

  if (loading) return <Text>Loading...</Text>;

  const monday = getMonday(selectedDate);
  const weekLabel = `${monday.toISOString().slice(0, 10)} - ${(() => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + 4);
    return d.toISOString().slice(0, 10);
  })()}`;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.title}>Edit Week</Text>
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={styles.weekPickerBtn}
          accessibilityRole="button"
        >
          <Text style={styles.weekPickerText}>Select Week: {weekLabel}</Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePickerModal
            isVisible={showPicker}
            mode="date"
            date={selectedDate}
            onConfirm={handleDateChange}
            onCancel={() => setShowPicker(false)}
            isDarkModeEnabled={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          />
        )}
        {weekEntries.map((entry, idx) => {
          const isAnnualLeave = (entry as any).isAnnualLeave || false;
          const ptoHours = (entry as any).ptoHours || '';
          const isMonday = idx === 0;
          return (
            <React.Fragment key={entry.date}>
              <View style={styles.dayBlock}>
                <Text style={styles.dayLabel}>{DAYS[idx]} ({entry.date})</Text>
                <View style={styles.rowFields}>
                  <TouchableOpacity
                    style={[styles.inputShort, { justifyContent: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 8, height: 36 }]}
                    onPress={() => openTimePicker(idx, 'startTime', entry.startTime)}
                    accessible accessibilityLabel={`Select start time for ${DAYS[idx]}`}
                    disabled={!!(entry as any).isAnnualLeave}
                  >
                    <Text style={{ color: entry.startTime ? '#222' : '#888' }}>{entry.startTime || 'Start'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.inputShort, { justifyContent: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 8, height: 36 }]}
                    onPress={() => openTimePicker(idx, 'finishTime', entry.finishTime)}
                    accessible accessibilityLabel={`Select finish time for ${DAYS[idx]}`}
                    disabled={!!(entry as any).isAnnualLeave}
                  >
                    <Text style={{ color: entry.finishTime ? '#222' : '#888' }}>{entry.finishTime || 'Finish'}</Text>
                  </TouchableOpacity>
                  <Picker
                    selectedValue={lunchInputs[idx]}
                    style={[styles.inputShort, { height: 36 }]}
                    enabled={!isAnnualLeave}
                    onValueChange={v => handleLunchChange(idx, v)}
                    accessibilityLabel={`Select lunch duration for ${DAYS[idx]}`}
                  >
                    {lunchOptions.map(opt => (
                      <Picker.Item key={opt} label={`${parseFloat(opt)} h`} value={opt} />
                    ))}
                  </Picker>
                  <TextInput
                    style={styles.inputNotes}
                    placeholder="Notes"
                    value={entry.notes}
                    onChangeText={v => handleChange(idx, 'notes', v)}
                  />
                </View>
                <View style={styles.rowFields}>
                  <Text style={{ marginRight: 8 }}>Annual Leave:</Text>
                  <Picker
                    selectedValue={isAnnualLeave ? 'yes' : 'no'}
                    style={styles.picker}
                    onValueChange={v => handleChange(idx, 'isAnnualLeave', v === 'yes')}
                  >
                    <Picker.Item label="No" value="no" />
                    <Picker.Item label="Yes" value="yes" />
                  </Picker>
                  {isAnnualLeave && (
                    <TextInput
                      style={[styles.inputShort, { marginLeft: 8 }]}
                      placeholder="PTO hrs"
                      value={ptoHours ? String(ptoHours) : ''}
                      onChangeText={v => handleChange(idx, 'ptoHours', v)}
                      keyboardType="numeric"
                    />
                  )}
                </View>
              </View>
              {isMonday && weekEntries[0].startTime && weekEntries[0].finishTime && weekEntries.slice(1).every(e => !e.startTime && !e.finishTime && (!e.lunchMinutes || e.lunchMinutes === 0)) && (
                <TouchableOpacity
                  style={{ alignSelf: 'flex-end', marginBottom: 8, backgroundColor: '#e0e0e0', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 }}
                  onPress={() => {
                    const monday = weekEntries[0];
                    const filled = weekEntries.map((entry, idx) =>
                      idx === 0
                        ? entry
                        : {
                            ...entry,
                            startTime: monday.startTime,
                            finishTime: monday.finishTime,
                            lunchMinutes: monday.lunchMinutes,
                          }
                    );
                    const filledLunchInputs = lunchInputs.map((v, idx) =>
                      idx === 0 ? v : lunchInputs[0]
                    );
                    setWeekEntries(filled);
                    setLunchInputs(filledLunchInputs);
                    updateSummary(filled);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={{ fontWeight: 'bold' }}>Fill Down</Text>
                </TouchableOpacity>
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>
      <DateTimePickerModal
        isVisible={pickerVisible}
        mode="time"
        date={pickerValue}
        onConfirm={handleTimePicked}
        onCancel={closeTimePicker}
        isDarkModeEnabled={false}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        minuteInterval={5}
        accessibilityLabel="Time picker"
      />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', padding: 12, borderTopWidth: 1, borderColor: '#eee', zIndex: 10 }}>
        <Text style={styles.summary}>{summary}</Text>
        <Button title="Save Week" onPress={handleSave} accessibilityLabel="Save week entries" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: 'transparent' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
  weekPickerBtn: { marginBottom: 16, padding: 10, backgroundColor: '#e0e0e0', borderRadius: 8 },
  weekPickerText: { fontWeight: 'bold', fontSize: 16 },
  dayBlock: { marginBottom: 20, padding: 12, borderRadius: 8, backgroundColor: '#f5f5f5' },
  dayLabel: { fontWeight: 'bold', marginBottom: 8 },
  rowFields: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  inputShort: { width: 70, marginRight: 8 },
  inputNotes: { flex: 1, minWidth: 100 },
  picker: { width: 100, height: 36 },
  summary: { fontSize: 18, fontWeight: 'bold', marginVertical: 16, textAlign: 'center' },
});
