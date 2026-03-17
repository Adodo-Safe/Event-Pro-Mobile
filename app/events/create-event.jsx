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
	View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import Button, { ActionButton } from '../../components/button';
import {
	EventCreationPickerField,
	EventCreationPickerModal,
	EventCreationSelectField,
	EventCreationSelectModal,
	EventCreationTextField,
	EventCreationUploadField,
} from '../../components/event-creation-form';

const STEP_FIELDS = [
	['firstName', 'lastName', 'email', 'eventName'],
	['eventDate', 'eventTime', 'eventLocation', 'streetAddress'],
	['city', 'countryState', 'eventRegion', 'eventCategory'],
	['eventBanner', 'otherDetails'],
];

const REGION_OPTIONS = [
	'North',
	'South',
	'East',
	'West',
	'Central',
];

const CATEGORY_OPTIONS = [
	'Conference',
	'Seminar',
	'Concert',
	'Workshop',
	'Festival',
];

export default function CreateEvent() {
	const router = useRouter();
	const scrollViewRef = useRef(null);
	const [currentStep, setCurrentStep] = useState(0);
	const [focusedField, setFocusedField] = useState('');
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const [submitError, setSubmitError] = useState('');
	const [selectConfig, setSelectConfig] = useState(null);
	const [pickerConfig, setPickerConfig] = useState(null);
	const [fieldErrors, setFieldErrors] = useState({});
	const [pickerValues, setPickerValues] = useState({
		eventDate: new Date(),
		eventTime: new Date(),
	});
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		eventName: '',
		eventDate: '',
		eventTime: '',
		eventLocation: '',
		streetAddress: '',
		city: '',
		countryState: '',
		eventRegion: '',
		eventCategory: '',
		eventBanner: '',
		eventBannerUri: '',
		otherDetails: '',
	});

	useEffect(() => {
		const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
		const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

		const showSub = Keyboard.addListener(showEvent, (event) => {
			setKeyboardHeight(event.endCoordinates?.height || 0);
		});

		const hideSub = Keyboard.addListener(hideEvent, () => {
			setKeyboardHeight(0);
		});

		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, []);

	const scrollToFocusedInput = (target) => {
		if (!target) return;

		setTimeout(() => {
			const responder = scrollViewRef.current?.getScrollResponder?.();
			responder?.scrollResponderScrollNativeHandleToKeyboard?.(target, 90, true);
		}, 120);
	};

	const formatDateValue = (value) => {
		return new Intl.DateTimeFormat('en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		}).format(value);
	};

	const formatTimeValue = (value) => {
		return new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
		}).format(value);
	};

	const formatPickerOutput = (field, value) => {
		return field === 'eventDate' ? formatDateValue(value) : formatTimeValue(value);
	};

	const updateFormData = (updates) => {
		setFormData((prev) => ({ ...prev, ...updates }));
		setSubmitError('');

		setFieldErrors((prev) => {
			let hasChange = false;
			const next = { ...prev };

			Object.keys(updates).forEach((key) => {
				if (next[key]) {
					next[key] = false;
					hasChange = true;
				}
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

		STEP_FIELDS[stepIndex].forEach((fieldName) => {
			const invalid = isFieldEmpty(fieldName);
			nextErrors[fieldName] = invalid;
			if (invalid) {
				hasError = true;
			}
		});

		setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
		return !hasError;
	};

	const handleFieldFocus = (fieldName, target) => {
		setFocusedField(fieldName);
		scrollToFocusedInput(target);
	};

	const handleFieldBlur = () => {
		setFocusedField('');
	};

	const handleNext = () => {
		if (!validateStep(currentStep)) {
			return;
		}

		setCurrentStep((prev) => Math.min(prev + 1, STEP_FIELDS.length - 1));
		setFocusedField('');
		setSubmitError('');
		scrollViewRef.current?.scrollTo({ y: 0, animated: true });
	};

	const handleBack = () => {
		if (currentStep === 0) {
			router.back();
			return;
		}

		setCurrentStep((prev) => Math.max(prev - 1, 0));
		setFocusedField('');
		setSubmitError('');
		scrollViewRef.current?.scrollTo({ y: 0, animated: true });
	};

	const handleOpenSelect = (field, title, options) => {
		setSelectConfig({ field, title, options });
	};

	const handleOpenPicker = (field, mode) => {
		const currentValue = pickerValues[field] || new Date();

		if (Platform.OS === 'android') {
			DateTimePickerAndroid.open({
				value: currentValue,
				mode,
				display: 'default',
				onChange: (event, selectedDate) => {
					if (event.type !== 'set' || !selectedDate) {
						return;
					}

					setPickerValues((prev) => ({ ...prev, [field]: selectedDate }));
					updateFormData({ [field]: formatPickerOutput(field, selectedDate) });
				},
			});
			return;
		}

		setPickerConfig({
			field,
			mode,
			value: currentValue,
			tempValue: currentValue,
		});
	};

	const handlePickerChange = (selectedDate) => {
		setPickerConfig((prev) => {
			if (!prev) {
				return prev;
			}

			return {
				...prev,
				tempValue: selectedDate,
			};
		});
	};

	const handlePickerConfirm = () => {
		if (!pickerConfig) {
			return;
		}

		const { field, tempValue } = pickerConfig;
		setPickerValues((prev) => ({ ...prev, [field]: tempValue }));
		updateFormData({ [field]: formatPickerOutput(field, tempValue) });
		setPickerConfig(null);
	};

	const handleSelectOption = (option) => {
		if (!selectConfig) {
			return;
		}

		updateFormData({ [selectConfig.field]: option });
		setSelectConfig(null);
	};

	const handlePickBanner = async () => {
		try {
			const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

			if (!permission.granted) {
				Alert.alert(
					'Permission needed',
					'Allow photo library access to upload an event banner.'
				);
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [16, 9],
				quality: 0.8,
			});

			if (result.canceled) {
				return;
			}

			const asset = result.assets?.[0];
			if (!asset?.uri) {
				return;
			}

			const bannerName = asset.fileName || asset.uri.split('/').pop() || 'Selected image';
			updateFormData({
				eventBanner: bannerName,
				eventBannerUri: asset.uri,
			});
		} catch {
			Alert.alert('Upload failed', 'Unable to select an image right now. Please try again.');
		}
	};

	const handleSubmit = () => {
		if (!validateStep(currentStep)) {
			setSubmitError('*Error: Please fill all columns*');
			return;
		}

		setSubmitError('');
		Alert.alert('Event created', 'Your event details have been captured successfully.');
	};

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<>
						<EventCreationTextField
							label="First Name"
							placeholder="First Name"
							value={formData.firstName}
							onChangeText={(value) => updateFormData({ firstName: value })}
							onFocus={(event) => handleFieldFocus('firstName', event?.target)}
							onBlur={handleFieldBlur}
							error={fieldErrors.firstName}
							focused={focusedField === 'firstName'}
						/>
						<EventCreationTextField
							label="Last Name"
							placeholder="Last Name"
							value={formData.lastName}
							onChangeText={(value) => updateFormData({ lastName: value })}
							onFocus={(event) => handleFieldFocus('lastName', event?.target)}
							onBlur={handleFieldBlur}
							error={fieldErrors.lastName}
							focused={focusedField === 'lastName'}
						/>
						<EventCreationTextField
							label="Email Address"
							placeholder="Email Address"
							value={formData.email}
							onChangeText={(value) => updateFormData({ email: value })}
							onFocus={(event) => handleFieldFocus('email', event?.target)}
							onBlur={handleFieldBlur}
							error={fieldErrors.email}
							focused={focusedField === 'email'}
							keyboardType="email-address"
							autoCapitalize="none"
						/>
						<EventCreationTextField
							label="Event Name"
							placeholder="Event Name"
							value={formData.eventName}
							onChangeText={(value) => updateFormData({ eventName: value })}
							onFocus={(event) => handleFieldFocus('eventName', event?.target)}
							onBlur={handleFieldBlur}
							error={fieldErrors.eventName}
							focused={focusedField === 'eventName'}
						/>
					</>
				);
			case 1:
				return (
					<>
						<EventCreationPickerField
							label="Event Date (Local Date)"
							placeholder="Event Date (Local Date)"
							value={formData.eventDate}
							onPress={() => handleOpenPicker('eventDate', 'date')}
							error={fieldErrors.eventDate}
							// iconName="calendar-outline"
						/>
						<EventCreationPickerField
							label="Event Time (Local Time)"
							placeholder="Event Time (Local Time)"
							value={formData.eventTime}
							onPress={() => handleOpenPicker('eventTime', 'time')}
							error={fieldErrors.eventTime}
							// iconName="time-outline"
						/>
						<EventCreationTextField
							label="Event Location"
							placeholder="Event Location"
							value={formData.eventLocation}
							onChangeText={(value) => updateFormData({ eventLocation: value })}
							onFocus={(event) => handleFieldFocus('eventLocation', event?.target)}
							onBlur={handleFieldBlur}
							error={fieldErrors.eventLocation}
							focused={focusedField === 'eventLocation'}
						/>
						<EventCreationTextField
							label="Street Address"
							placeholder="Street Address"
							value={formData.streetAddress}
							onChangeText={(value) => updateFormData({ streetAddress: value })}
							onFocus={(event) => handleFieldFocus('streetAddress', event?.target)}
							onBlur={handleFieldBlur}
							error={fieldErrors.streetAddress}
							focused={focusedField === 'streetAddress'}
						/>
					</>
				);
			case 2:
				return (
					<>
						<EventCreationTextField
							label="City"
							placeholder="City"
							value={formData.city}
							onChangeText={(value) => updateFormData({ city: value })}
							onFocus={(event) => handleFieldFocus('city', event?.target)}
							onBlur={handleFieldBlur}
							error={fieldErrors.city}
							focused={focusedField === 'city'}
						/>
						<EventCreationTextField
							label="Country/State"
							placeholder="Country/State"
							value={formData.countryState}
							onChangeText={(value) => updateFormData({ countryState: value })}
							onFocus={(event) => handleFieldFocus('countryState', event?.target)}
							onBlur={handleFieldBlur}
							error={fieldErrors.countryState}
							focused={focusedField === 'countryState'}
						/>
						<EventCreationSelectField
							label="Select Event Region"
							placeholder="Select Event Region"
							value={formData.eventRegion}
							onPress={() => handleOpenSelect('eventRegion', 'Select Event Region', REGION_OPTIONS)}
							error={fieldErrors.eventRegion}
						/>
						<EventCreationSelectField
							label="Event Category"
							placeholder="Category"
							value={formData.eventCategory}
							onPress={() => handleOpenSelect('eventCategory', 'Event Category', CATEGORY_OPTIONS)}
							error={fieldErrors.eventCategory}
						/>
					</>
				);
			default:
				return (
					<>
						<EventCreationUploadField
							label="Event Banner"
							value={formData.eventBanner}
							onPress={handlePickBanner}
							error={fieldErrors.eventBanner}
						/>
						{formData.eventBannerUri ? (
							<Image source={{ uri: formData.eventBannerUri }} style={styles.bannerPreview} />
						) : null}
						<EventCreationTextField
							label="Others"
							placeholder="Please include all necessary details for the event....."
							value={formData.otherDetails}
							onChangeText={(value) => updateFormData({ otherDetails: value })}
							onFocus={(event) => handleFieldFocus('otherDetails', event?.target)}
							onBlur={handleFieldBlur}
							error={fieldErrors.otherDetails}
							focused={focusedField === 'otherDetails'}
							multiline
							numberOfLines={4}
						/>
						{submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
					</>
				);
		}
	};

	const renderFooter = () => {
		if (currentStep === 0) {
			return (
				<ActionButton
					title="Next"
					onPress={handleNext}
					size="medium"
					style={[styles.primaryButton, styles.fullWidthButton]}
					textStyle={styles.primaryButtonText}
				/>
			);
		}

		if (currentStep < STEP_FIELDS.length - 1) {
			return (
				<View style={styles.actionRow}>
					<Button
						title="Back"
						onPress={handleBack}
						variant="secondary"
						size="medium"
						style={styles.secondaryButton}
						textStyle={styles.secondaryButtonText}
					/>
					<ActionButton
						title="Next"
						onPress={handleNext}
						size="medium"
						style={styles.primaryButton}
						textStyle={styles.primaryButtonText}
					/>
				</View>
			);
		}

		return (
			<ActionButton
				title="Create Event"
				onPress={handleSubmit}
				size="medium"
				style={[styles.primaryButton, styles.fullWidthButton]}
				textStyle={styles.primaryButtonText}
			/>
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
				contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardHeight + 32 }]}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
			>
				<Pressable style={styles.backIcon} onPress={handleBack} hitSlop={12}>
					<Ionicons name="arrow-back" size={18} color="#141414" />
				</Pressable>

				<View style={styles.header}>
					<Text style={styles.title}>Create an Event</Text>
					<Text style={styles.subtitle}>
						Ready to bring people together? Add your{`\n`}event details below.
					</Text>
				</View>

				<View style={styles.formCard}>
					{renderStepContent()}
					<View style={styles.footer}>{renderFooter()}</View>
				</View>
			</ScrollView>

			<EventCreationSelectModal
				visible={!!selectConfig}
				title={selectConfig?.title || 'Select an option'}
				options={selectConfig?.options || []}
				onClose={() => setSelectConfig(null)}
				onSelect={handleSelectOption}
			/>
			<EventCreationPickerModal
				visible={!!pickerConfig && Platform.OS === 'ios'}
				mode={pickerConfig?.mode || 'date'}
				value={pickerConfig?.tempValue || new Date()}
				onCancel={() => setPickerConfig(null)}
				onChange={handlePickerChange}
				onConfirm={handlePickerConfirm}
			/>
		</KeyboardAvoidingView>
	);
}

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
		fontFamily: 'medium',
		fontSize: 24,
		color: '#161616',
		marginBottom: 6,
	},
	subtitle: {
		fontFamily: 'light',
		fontSize: 12,
		lineHeight: 14,
		color: '#161616',
		textAlign: 'center',
	},
	formCard: {
		width: '100%',
		paddingBottom: 24,
		gap: 24,
	},
	bannerPreview: {
		width: '100%',
		height: 118,
		borderRadius: 10,
		marginBottom: 14,
	},
	footer: {
		marginTop: 10,
	},
	actionRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
	},
	primaryButton: {
		flex: 1,
		minHeight: 40,
		paddingVertical: 10,
		backgroundColor: '#062D23',
		borderRadius: 8,
	},
	secondaryButton: {
		flex: 1,
		minHeight: 40,
		paddingVertical: 10,
		backgroundColor: '#FFFFFF',
		borderColor: '#062D23',
		borderWidth: 1,
		borderRadius: 8,
	},
	fullWidthButton: {
		width: '100%',
	},
	primaryButtonText: {
		fontFamily: 'semibold',
		fontSize: 14,
		color: '#FFFFFF',
	},
	secondaryButtonText: {
		fontFamily: 'semibold',
		fontSize: 14,
		color: '#22453A',
	},
	submitError: {
		marginTop: 4,
		marginBottom: 12,
		fontFamily: 'regular',
		fontSize: 10,
		color: '#EF4444',
		textAlign: 'center',
	},
});
