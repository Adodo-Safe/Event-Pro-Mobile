import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'https://eventpro-fxfv.onrender.com/api';
const PURPLE = '#6F00FF';
const PURPLE_LIGHT = '#F0E6FF';
const DARK = '#0F0F14';
const GRAY = '#6B7280';
const ERROR = '#EF4444';

const api = axios.create({ baseURL: BASE_URL });
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Inline Components ─────────────────────────────────────────────────────

const TextField = ({
  label, placeholder, value, onChangeText,
  onFocus, onBlur, error, focused,
  keyboardType, autoCapitalize, multiline, numberOfLines,
}) => (
  <View style={compStyles.fieldGroup}>
    <Text style={compStyles.label}>{label}</Text>
    <View style={[
      compStyles.inputWrapper,
      focused && compStyles.inputFocused,
      error && compStyles.inputError,
      multiline && compStyles.textAreaWrapper,
    ]}>
      <TextInput
        style={[compStyles.input, multiline && compStyles.textArea]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'auto'}
      />
    </View>
    {error ? <Text style={compStyles.errorText}>This field is required</Text> : null}
  </View>
);

const PickerField = ({ label, placeholder, value, onPress, error }) => (
  <View style={compStyles.fieldGroup}>
    <Text style={compStyles.label}>{label}</Text>
    <TouchableOpacity
      style={[compStyles.inputWrapper, compStyles.pickerField, error && compStyles.inputError]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[compStyles.pickerText, !value && compStyles.placeholderText]}>
        {value || placeholder}
      </Text>
      <Ionicons name="calendar-outline" size={18} color={PURPLE} />
    </TouchableOpacity>
    {error ? <Text style={compStyles.errorText}>This field is required</Text> : null}
  </View>
);

const SelectField = ({ label, placeholder, value, onPress, error }) => (
  <View style={compStyles.fieldGroup}>
    <Text style={compStyles.label}>{label}</Text>
    <TouchableOpacity
      style={[compStyles.inputWrapper, compStyles.pickerField, error && compStyles.inputError]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[compStyles.pickerText, !value && compStyles.placeholderText]}>
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={18} color={GRAY} />
    </TouchableOpacity>
    {error ? <Text style={compStyles.errorText}>This field is required</Text> : null}
  </View>
);

const UploadField = ({ label, value, onPress, error }) => (
  <View style={compStyles.fieldGroup}>
    <Text style={compStyles.label}>{label}</Text>
    <TouchableOpacity
      style={[compStyles.uploadField, error && compStyles.inputError]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="cloud-upload-outline" size={24} color={PURPLE} />
      <Text style={compStyles.uploadText}>
        {value || 'Tap to upload image'}
      </Text>
    </TouchableOpacity>
    {error ? <Text style={compStyles.errorText}>This field is required</Text> : null}
  </View>
);

const SelectModal = ({ visible, title, options, onClose, onSelect }) => {
  if (!visible) return null;
  return (
    <View style={compStyles.modalOverlay}>
      <TouchableOpacity style={compStyles.modalBg} onPress={onClose} />
      <View style={compStyles.modalBox}>
        <Text style={compStyles.modalTitle}>{title}</Text>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={compStyles.modalOption}
            onPress={() => onSelect(opt)}
          >
            <Text style={compStyles.modalOptionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── Constants ────────────────────────────────────────────────────────────

const STEP_FIELDS = [
  ['title', 'description'],
  ['eventDate', 'eventTime', 'location'],
  ['expectedAttendees', 'eventCategory', 'status'],
  ['eventBanner', 'otherDetails'],
];

const CATEGORY_OPTIONS = [
  'Conference',
  'Seminar',
  'Concert',
  'Workshop',
  'Festival',
  'Exhibition',
  'Networking',
  'Other',
];

const STATUS_OPTIONS = ['draft', 'published'];

const INITIAL_FORM_DATA = {
  title: '',
  description: '',
  eventDate: '',
  eventTime: '',
  location: '',
  expectedAttendees: '',
  eventCategory: '',
  status: 'draft',
  eventBanner: '',
  eventBannerUri: '',
  otherDetails: '',
};

const getErrorMessage = (error) => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message) && message.length > 0) return String(message[0]);
  if (typeof message === 'string' && message.trim()) return message;
  return 'Unable to create event right now. Please try again.';
};

// ─── Main Component ───────────────────────────────────────────────────────

export default function CreateEvent() {
  const router = useRouter();
  const scrollViewRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [focusedField, setFocusedField] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectConfig, setSelectConfig] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [pickerValues, setPickerValues] = useState({
    eventDate: new Date(),
    eventTime: new Date(),
  });
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const STEP_TITLES = [
    { title: 'Event Details', subtitle: 'Give your event a name and description.' },
    { title: 'Date & Location', subtitle: 'When and where is your event?' },
    { title: 'More Details', subtitle: 'Help attendees find your event.' },
    { title: 'Final Touch', subtitle: 'Add a banner and any extra info.' },
  ];

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const scrollToFocusedInput = (target) => {
    if (!target) return;
    setTimeout(() => {
      const responder = scrollViewRef.current?.getScrollResponder?.();
      responder?.scrollResponderScrollNativeHandleToKeyboard?.(target, 90, true);
    }, 120);
  };

  const formatDateValue = (value) => new Intl.DateTimeFormat('en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(value);

  const formatTimeValue = (value) => new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit',
  }).format(value);

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setSubmitError('');
    setFieldErrors(prev => {
      const next = { ...prev };
      let hasChange = false;
      Object.keys(updates).forEach(key => {
        if (next[key]) { next[key] = false; hasChange = true; }
      });
      return hasChange ? next : prev;
    });
  };

  const isFieldEmpty = (fieldName) => {
    const value = formData[fieldName];
    return !String(value ?? '').trim();
  };

  const validateStep = (stepIndex) => {
    const nextErrors = {};
    let hasError = false;
    STEP_FIELDS[stepIndex].forEach(fieldName => {
      const invalid = isFieldEmpty(fieldName);
      nextErrors[fieldName] = invalid;
      if (invalid) hasError = true;
    });
    setFieldErrors(prev => ({ ...prev, ...nextErrors }));
    return !hasError;
  };

  const handleOpenPicker = (field, mode) => {
    const currentValue = pickerValues[field] || new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: currentValue,
        mode,
        display: 'default',
        onChange: (event, selectedDate) => {
          if (event.type !== 'set' || !selectedDate) return;
          setPickerValues(prev => ({ ...prev, [field]: selectedDate }));
          updateFormData({
            [field]: field === 'eventDate'
              ? formatDateValue(selectedDate)
              : formatTimeValue(selectedDate)
          });
        },
      });
    }
  };

  const handlePickBanner = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow photo library access to upload a banner.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [16, 9],
  quality: 0.8,
});
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      const bannerName = asset.fileName || asset.uri.split('/').pop() || 'Selected image';
      updateFormData({ eventBanner: bannerName, eventBannerUri: asset.uri });
    } catch {
      Alert.alert('Upload failed', 'Unable to select image. Please try again.');
    }
  };

  const buildPayload = () => {
    const mergedDateTime = new Date(pickerValues.eventDate);
    mergedDateTime.setHours(
      pickerValues.eventTime.getHours(),
      pickerValues.eventTime.getMinutes(),
      0, 0
    );

    return {
      title: formData.title.trim(),
      description: `${formData.description.trim()}${formData.otherDetails ? '\n\n' + formData.otherDetails.trim() : ''}`,
      date: mergedDateTime.toISOString(),
      location: formData.location.trim(),
      expectedAttendees: parseInt(formData.expectedAttendees) || 0,
      status: formData.status,
    };
  };

  const handleNext = () => {
    if (isSubmitting) return;
    if (!validateStep(currentStep)) return;
    setCurrentStep(prev => Math.min(prev + 1, STEP_FIELDS.length - 1));
    setFocusedField('');
    setSubmitError('');
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleBack = () => {
    if (isSubmitting) return;
    if (currentStep === 0) { router.back(); return; }
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setFocusedField('');
    setSubmitError('');
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSubmit = async () => {
    const allValid = STEP_FIELDS.every((_, i) => validateStep(i));
    if (!allValid) {
      setSubmitError('Please fill all required fields.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);
    try {
      await api.post('/events', buildPayload());
      Alert.alert(
        formData.status === 'published' ? 'Event Published!' : 'Event Saved!',
        formData.status === 'published'
          ? 'Your event is now live and visible to attendees.'
          : 'Your event has been saved as a draft.',
        [{ text: 'OK', onPress: () => router.replace('/organizer/my-events') }]
      );
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <TextField
              label="Event Title *"
              placeholder="e.g. Tech Innovator Conference"
              value={formData.title}
              onChangeText={(v) => updateFormData({ title: v })}
              onFocus={(e) => { setFocusedField('title'); scrollToFocusedInput(e?.target); }}
              onBlur={() => setFocusedField('')}
              error={fieldErrors.title}
              focused={focusedField === 'title'}
            />
            <TextField
              label="Description *"
              placeholder="Tell attendees what your event is about..."
              value={formData.description}
              onChangeText={(v) => updateFormData({ description: v })}
              onFocus={(e) => { setFocusedField('description'); scrollToFocusedInput(e?.target); }}
              onBlur={() => setFocusedField('')}
              error={fieldErrors.description}
              focused={focusedField === 'description'}
              multiline
              numberOfLines={4}
            />
          </>
        );

      case 1:
        return (
          <>
            <PickerField
              label="Event Date *"
              placeholder="Select date"
              value={formData.eventDate}
              onPress={() => handleOpenPicker('eventDate', 'date')}
              error={fieldErrors.eventDate}
            />
            <PickerField
              label="Event Time *"
              placeholder="Select time"
              value={formData.eventTime}
              onPress={() => handleOpenPicker('eventTime', 'time')}
              error={fieldErrors.eventTime}
            />
            <TextField
              label="Location *"
              placeholder="e.g. Lagos Tech Hub, Victoria Island"
              value={formData.location}
              onChangeText={(v) => updateFormData({ location: v })}
              onFocus={(e) => { setFocusedField('location'); scrollToFocusedInput(e?.target); }}
              onBlur={() => setFocusedField('')}
              error={fieldErrors.location}
              focused={focusedField === 'location'}
            />
          </>
        );

      case 2:
        return (
          <>
            <TextField
              label="Expected Attendees *"
              placeholder="e.g. 300"
              value={formData.expectedAttendees}
              onChangeText={(v) => updateFormData({ expectedAttendees: v })}
              onFocus={(e) => { setFocusedField('expectedAttendees'); scrollToFocusedInput(e?.target); }}
              onBlur={() => setFocusedField('')}
              error={fieldErrors.expectedAttendees}
              focused={focusedField === 'expectedAttendees'}
              keyboardType="numeric"
            />
            <SelectField
              label="Event Category *"
              placeholder="Select category"
              value={formData.eventCategory}
              onPress={() => setSelectConfig({
                field: 'eventCategory',
                title: 'Event Category',
                options: CATEGORY_OPTIONS,
              })}
              error={fieldErrors.eventCategory}
            />
            <SelectField
              label="Status *"
              placeholder="Select status"
              value={formData.status}
              onPress={() => setSelectConfig({
                field: 'status',
                title: 'Event Status',
                options: STATUS_OPTIONS,
              })}
              error={fieldErrors.status}
            />
          </>
        );

      default:
        return (
          <>
            <UploadField
              label="Event Banner"
              value={formData.eventBanner}
              onPress={handlePickBanner}
              error={fieldErrors.eventBanner}
            />
            {formData.eventBannerUri ? (
              <Image
                source={{ uri: formData.eventBannerUri }}
                style={styles.bannerPreview}
              />
            ) : null}
            <TextField
              label="Additional Details"
              placeholder="Any extra information for attendees..."
              value={formData.otherDetails}
              onChangeText={(v) => updateFormData({ otherDetails: v })}
              onFocus={(e) => { setFocusedField('otherDetails'); scrollToFocusedInput(e?.target); }}
              onBlur={() => setFocusedField('')}
              error={fieldErrors.otherDetails}
              focused={focusedField === 'otherDetails'}
              multiline
              numberOfLines={4}
            />
            {submitError ? (
              <Text style={styles.submitError}>{submitError}</Text>
            ) : null}
          </>
        );
    }
  };

  const renderFooter = () => {
    const isLast = currentStep === STEP_FIELDS.length - 1;
    const isFirst = currentStep === 0;

    if (isFirst) {
      return (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleNext}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      );
    }

    if (!isLast) {
      return (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBack}
            disabled={isSubmitting}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleBack}
          disabled={isSubmitting}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={styles.primaryButtonText}>Create Event</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardHeight + 32 }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        {/* Back Button */}
        <Pressable style={styles.backIcon} onPress={handleBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={18} color={DARK} />
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create an Event</Text>
          <Text style={styles.subtitle}>
            Ready to bring people together?{'\n'}Add your event details below.
          </Text>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {STEP_FIELDS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                i === currentStep && styles.stepDotActive,
                i < currentStep && styles.stepDotDone,
              ]}
            >
              {i < currentStep ? (
                <Ionicons name="checkmark" size={10} color="#fff" />
              ) : (
                <Text style={[
                  styles.stepDotText,
                  (i === currentStep || i < currentStep) && styles.stepDotTextActive
                ]}>
                  {i + 1}
                </Text>
              )}
            </View>
          ))}
          <View style={styles.stepLine} />
        </View>

        {/* Step Title */}
        <View style={styles.stepTitle}>
          <Text style={styles.stepTitleText}>
            {STEP_TITLES[currentStep].title}
          </Text>
          <Text style={styles.stepSubtitleText}>
            {STEP_TITLES[currentStep].subtitle}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          {renderStepContent()}
          <View style={styles.footer}>{renderFooter()}</View>
        </View>

      </ScrollView>

      {/* Select Modal */}
      <SelectModal
        visible={!!selectConfig}
        title={selectConfig?.title || ''}
        options={selectConfig?.options || []}
        onClose={() => setSelectConfig(null)}
        onSelect={(option) => {
          updateFormData({ [selectConfig.field]: option });
          setSelectConfig(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Component Styles ─────────────────────────────────────────────────────

const compStyles = StyleSheet.create({
  fieldGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
    marginBottom: 8,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    minHeight: 52,
    justifyContent: 'center',
  },
  inputFocused: { borderColor: PURPLE },
  inputError: { borderColor: ERROR },
  textAreaWrapper: {
    minHeight: 100,
    paddingVertical: 12,
    justifyContent: 'flex-start',
  },
  input: {
    fontSize: 14,
    color: DARK,
    paddingVertical: 0,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: ERROR,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  pickerText: { fontSize: 14, color: DARK },
  placeholderText: { color: '#9CA3AF' },
  uploadField: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderStyle: 'dashed',
    backgroundColor: PURPLE_LIGHT,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  uploadText: { fontSize: 14, color: PURPLE, fontWeight: '600' },
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', zIndex: 999,
  },
  modalBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBox: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 20, width: 280, elevation: 10,
    zIndex: 1000,
  },
  modalTitle: {
    fontSize: 16, fontWeight: '800',
    color: DARK, marginBottom: 14,
  },
  modalOption: {
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 10, marginBottom: 4,
  },
  modalOptionText: { fontSize: 14, color: '#374151' },
});

// ─── Screen Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
  },
  backIcon: {
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    gap: 32,
  },
  stepLine: {
    position: 'absolute',
    top: '50%',
    left: '15%',
    right: '15%',
    height: 1,
    backgroundColor: '#E5E7EB',
    zIndex: -1,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepDotActive: {
    backgroundColor: PURPLE,
  },
  stepDotDone: {
    backgroundColor: '#10B981',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: GRAY,
  },
  stepDotTextActive: { color: '#fff' },

  // Step Title
  stepTitle: {
    marginBottom: 20,
  },
  stepTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    marginBottom: 4,
  },
  stepSubtitleText: {
    fontSize: 13,
    color: GRAY,
  },

  formCard: {
    width: '100%',
    paddingBottom: 24,
    gap: 4,
  },
  bannerPreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 14,
  },
  footer: { marginTop: 10 },

  submitError: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
    color: ERROR,
    textAlign: 'center',
  },

  // Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    paddingVertical: 12,
    backgroundColor: PURPLE,
    borderRadius: 12,
  },
  primaryButtonDisabled: { backgroundColor: '#C4B5FD' },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderColor: PURPLE,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: PURPLE,
  },
});