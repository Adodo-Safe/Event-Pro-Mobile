import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export function EventCreationTextField({
	label,
	placeholder,
	value,
	onChangeText,
	onFocus,
	onBlur,
	error,
	focused,
	keyboardType,
	autoCapitalize = 'sentences',
	multiline = false,
	numberOfLines = 1,
}) {
	return (
		<View style={styles.fieldBlock}>
			<Text style={styles.fieldLabel}>{label}</Text>
			<TextInput
				style={[
					styles.fieldInput,
					focused && !error ? styles.fieldInputFocused : null,
					error ? styles.fieldInputError : null,
					multiline ? styles.fieldInputMultiline : null,
				]}
				placeholder={placeholder}
				placeholderTextColor="#B0B0B0"
				value={value}
				onChangeText={onChangeText}
				onFocus={onFocus}
				onBlur={onBlur}
				keyboardType={keyboardType}
				autoCapitalize={autoCapitalize}
				multiline={multiline}
				numberOfLines={numberOfLines}
				textAlignVertical={multiline ? 'top' : 'center'}
			/>
		</View>
	);
}

export function EventCreationSelectField({ label, placeholder, value, onPress, error }) {
	return (
		<View style={styles.fieldBlock}>
			<Text style={styles.fieldLabel}>{label}</Text>
			<Pressable
				style={[styles.fieldInput, styles.selectField, error ? styles.fieldInputError : null]}
				onPress={onPress}
			>
				<Text style={[styles.selectText, !value ? styles.placeholderText : null]} numberOfLines={1}>
					{value || placeholder}
				</Text>
				<Ionicons name="chevron-down" size={16} color="#6B7280" />
			</Pressable>
		</View>
	);
}

export function EventCreationUploadField({ label, value, onPress, error }) {
	return (
		<View style={styles.fieldBlock}>
			<Text style={styles.fieldLabel}>{label}</Text>
			<Pressable
				style={[styles.fieldInput, styles.selectField, error ? styles.fieldInputError : null]}
				onPress={onPress}
			>
				<Text style={[styles.selectText, !value ? styles.placeholderText : null]} numberOfLines={1}>
					{value || 'Upload image'}
				</Text>
				<MaterialIcons name="image" size={16} color="#1F2937" />
			</Pressable>
		</View>
	);
}

export function EventCreationPickerField({ label, placeholder, value, onPress, error, iconName }) {
	return (
		<View style={styles.fieldBlock}>
			<Text style={styles.fieldLabel}>{label}</Text>
			<Pressable
				style={[styles.fieldInput, styles.selectField, error ? styles.fieldInputError : null]}
				onPress={onPress}
			>
				<Text style={[styles.selectText, !value ? styles.placeholderText : null]} numberOfLines={1}>
					{value || placeholder}
				</Text>
				<Ionicons name={iconName} size={16} color="#1F2937" />
			</Pressable>
		</View>
	);
}

export function EventCreationSelectModal({ visible, title, options, onClose, onSelect }) {
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.modalRoot}>
				<Pressable style={styles.modalBackdrop} onPress={onClose} />
				<View style={styles.modalCard}>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>{title}</Text>
						<Pressable onPress={onClose} hitSlop={10}>
							<Ionicons name="close" size={20} color="#1F2937" />
						</Pressable>
					</View>
					{options.map((option) => (
						<Pressable
							key={option}
							style={styles.modalOption}
							onPress={() => onSelect(option)}
						>
							<Text style={styles.modalOptionText}>{option}</Text>
						</Pressable>
					))}
				</View>
			</View>
		</Modal>
	);
}

export function EventCreationPickerModal({ visible, mode, value, onCancel, onChange, onConfirm }) {
	if (!visible || !value) {
		return null;
	}

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
			<View style={styles.modalRoot}>
				<Pressable style={styles.modalBackdrop} onPress={onCancel} />
				<View style={styles.modalCard}>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>{mode === 'date' ? 'Select Date' : 'Select Time'}</Text>
						<Pressable onPress={onCancel} hitSlop={10}>
							<Ionicons name="close" size={20} color="#1F2937" />
						</Pressable>
					</View>
					<DateTimePicker
						value={value}
						mode={mode}
						display="spinner"
						onChange={(_, selectedDate) => {
							if (selectedDate) {
								onChange(selectedDate);
							}
						}}
						style={styles.pickerWheel}
					/>
					<View style={styles.pickerActions}>
						<Pressable style={styles.pickerSecondaryAction} onPress={onCancel}>
							<Text style={styles.pickerSecondaryActionText}>Cancel</Text>
						</Pressable>
						<Pressable style={styles.pickerPrimaryAction} onPress={onConfirm}>
							<Text style={styles.pickerPrimaryActionText}>Done</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	fieldBlock: {
		marginBottom: 14,
	},
	fieldLabel: {
		fontFamily: 'regular',
		fontSize: 11,
		color: '#6C6C6C',
		marginBottom: 8,
	},
	fieldInput: {
		minHeight: 42,
		borderWidth: 1,
		borderColor: '#9B9B9B',
		borderRadius: 8,
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontFamily: 'regular',
		fontSize: 12,
		color: '#202020',
	},
	fieldInputFocused: {
		borderColor: '#003D2E',
	},
	fieldInputError: {
		borderColor: '#EF4444',
	},
	fieldInputMultiline: {
		minHeight: 82,
	},
	selectField: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	selectText: {
		flex: 1,
		marginRight: 10,
		fontFamily: 'regular',
		fontSize: 12,
		color: '#202020',
	},
	placeholderText: {
		color: '#B0B0B0',
	},
	modalRoot: {
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	modalBackdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.35)',
	},
	modalCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 18,
		elevation: 8,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	modalTitle: {
		fontFamily: 'semibold',
		fontSize: 16,
		color: '#181818',
	},
	modalOption: {
		paddingVertical: 14,
		borderTopWidth: 1,
		borderTopColor: '#EFEFEF',
	},
	modalOptionText: {
		fontFamily: 'regular',
		fontSize: 14,
		color: '#1F2937',
	},
	pickerWheel: {
		alignSelf: 'center',
	},
	pickerActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 10,
		marginTop: 12,
	},
	pickerPrimaryAction: {
		backgroundColor: '#003D2E',
		paddingHorizontal: 18,
		paddingVertical: 10,
		borderRadius: 10,
	},
	pickerSecondaryAction: {
		backgroundColor: '#FFFFFF',
		borderColor: '#D1D5DB',
		borderWidth: 1,
		paddingHorizontal: 18,
		paddingVertical: 10,
		borderRadius: 10,
	},
	pickerPrimaryActionText: {
		fontFamily: 'semibold',
		fontSize: 14,
		color: '#FFFFFF',
	},
	pickerSecondaryActionText: {
		fontFamily: 'semibold',
		fontSize: 14,
		color: '#1F2937',
	},
});