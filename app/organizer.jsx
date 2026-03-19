import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../components/button';
import {
  deleteOrganizer,
  listOrganizers,
  resetOrganizerPassword,
  signUpOrganizer,
  updateOrganizerStatus,
} from '../services/api';

const DEFAULT_AVATAR = require('../assets/images/icon.png');
const ITEMS_PER_PAGE = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORGANIZER_STATUS_OPTIONS = ['Active', 'Pending', 'Inactive'];

const normalizeStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();

  if (normalized === 'active') {
    return 'Active';
  }

  if (normalized === 'pending') {
    return 'Pending';
  }

  if (normalized === 'inactive' || normalized === 'disabled' || !normalized) {
    return 'Inactive';
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const extractOrganizerRecords = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.organizers)) {
    return payload.organizers;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  return [];
};

const normalizeOrganizer = (organizer, index) => {
  const firstName = String(organizer?.firstName || '').trim();
  const lastName = String(organizer?.lastName || '').trim();
  const fallbackName = String(organizer?.name || '').trim();
  const fullName = `${firstName} ${lastName}`.trim() || fallbackName || 'Unknown Organizer';
  const role = String(organizer?.role || 'Organizer').trim() || 'Organizer';
  const email = String(organizer?.email || 'No email').trim() || 'No email';
  const avatarUri = organizer?.avatarUrl || organizer?.avatar || organizer?.profilePicture;
  const backendId = organizer?.id || organizer?._id;

  return {
    id: backendId || `org-${index}`,
    backendId: backendId ? String(backendId) : '',
    canManage: Boolean(backendId),
    name: fullName,
    email,
    role,
    status: normalizeStatus(organizer?.status),
    avatar: avatarUri ? { uri: avatarUri } : DEFAULT_AVATAR,
  };
};

const getOrganizerErrorMessage = (error) => {
  const message = error?.response?.data?.message;

  if (Array.isArray(message) && message.length > 0) {
    return String(message[0]);
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (error?.response?.status === 401) {
    return 'Unauthorized. Please sign in with an admin account.';
  }

  return 'Unable to load organizer accounts right now. Please try again.';
};

const getAddOrganizerErrorMessage = (error) => {
  const message = error?.response?.data?.message;

  if (Array.isArray(message) && message.length > 0) {
    return String(message[0]);
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return 'You do not have permission to add organizers with this account.';
  }

  return 'Unable to create organizer right now. Please try again.';
};

const getEditOrganizerErrorMessage = (error) => {
  const message = error?.response?.data?.message;

  if (Array.isArray(message) && message.length > 0) {
    return String(message[0]);
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return 'You do not have permission to edit organizers with this account.';
  }

  return 'Unable to update organizer right now. Please try again.';
};

const getDeleteOrganizerErrorMessage = (error) => {
  const message = error?.response?.data?.message;

  if (Array.isArray(message) && message.length > 0) {
    return String(message[0]);
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return 'You do not have permission to delete organizers with this account.';
  }

  if (error?.response?.status === 404) {
    return 'Organizer account was not found on the server.';
  }

  return 'Unable to delete organizer right now. Please try again.';
};

const OrganizerAccounts = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [organizers, setOrganizers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [isAddOrganizerVisible, setIsAddOrganizerVisible] = useState(false);
  const [isAddingOrganizer, setIsAddingOrganizer] = useState(false);
  const [addOrganizerError, setAddOrganizerError] = useState('');
  const [isEditOrganizerVisible, setIsEditOrganizerVisible] = useState(false);
  const [isEditingOrganizer, setIsEditingOrganizer] = useState(false);
  const [editingOrganizer, setEditingOrganizer] = useState(null);
  const [editOrganizerError, setEditOrganizerError] = useState('');
  const [deletingOrganizerId, setDeletingOrganizerId] = useState('');
  const [editOrganizerForm, setEditOrganizerForm] = useState({
    status: 'Active',
    password: '',
  });
  const [newOrganizer, setNewOrganizer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const fetchOrganizers = async () => {
    setIsLoading(true);
    setFetchError('');

    try {
      const response = await listOrganizers();
      const records = extractOrganizerRecords(response?.data);
      const normalized = records.map((item, index) => normalizeOrganizer(item, index));
      setOrganizers(normalized);
    } catch (error) {
      setOrganizers([]);
      setFetchError(getOrganizerErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return '#10B981';
      case 'Pending':
        return '#F59E0B';
      case 'Inactive':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const filteredOrganizers = useMemo(
    () =>
      organizers.filter((org) =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.email.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [organizers, searchQuery]
  );

  const pageCount = Math.max(1, Math.ceil(filteredOrganizers.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  const paginatedOrganizers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrganizers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrganizers, currentPage]);

  const resetAddOrganizerForm = () => {
    setNewOrganizer({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    });
    setAddOrganizerError('');
  };

  const handleOpenAddOrganizer = () => {
    resetAddOrganizerForm();
    setIsAddOrganizerVisible(true);
  };

  const handleCloseAddOrganizer = () => {
    if (isAddingOrganizer) {
      return;
    }

    setIsAddOrganizerVisible(false);
    resetAddOrganizerForm();
  };

  const updateNewOrganizerField = (field, value) => {
    setNewOrganizer((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (addOrganizerError) {
      setAddOrganizerError('');
    }
  };

  const validateNewOrganizer = () => {
    if (!newOrganizer.firstName.trim()) {
      setAddOrganizerError('First name is required.');
      return false;
    }

    if (!newOrganizer.lastName.trim()) {
      setAddOrganizerError('Last name is required.');
      return false;
    }

    const emailValue = newOrganizer.email.trim().toLowerCase();
    if (!emailValue || !EMAIL_REGEX.test(emailValue)) {
      setAddOrganizerError('Enter a valid email address.');
      return false;
    }

    if (newOrganizer.password.length < 6) {
      setAddOrganizerError('Password must be at least 6 characters.');
      return false;
    }

    return true;
  };

  const handleAddOrganizer = async () => {
    if (isAddingOrganizer) {
      return;
    }

    if (!validateNewOrganizer()) {
      return;
    }

    setIsAddingOrganizer(true);
    setAddOrganizerError('');

    try {
      await signUpOrganizer(
        newOrganizer.firstName.trim(),
        newOrganizer.lastName.trim(),
        newOrganizer.email.trim().toLowerCase(),
        newOrganizer.password
      );

      setIsAddOrganizerVisible(false);
      resetAddOrganizerForm();
      Alert.alert('Organizer added', 'Organizer account has been created successfully.');
      await fetchOrganizers();
    } catch (error) {
      setAddOrganizerError(getAddOrganizerErrorMessage(error));
    } finally {
      setIsAddingOrganizer(false);
    }
  };

  const resetEditOrganizerForm = () => {
    setEditOrganizerForm({
      status: 'Active',
      password: '',
    });
    setEditOrganizerError('');
  };

  const handleOpenEditOrganizer = (organizer) => {
    if (!organizer?.canManage || !organizer?.backendId) {
      Alert.alert(
        'Action unavailable',
        'This organizer record cannot be edited because it has no backend identifier.'
      );
      return;
    }

    setEditingOrganizer(organizer);
    setEditOrganizerForm({
      status: normalizeStatus(organizer.status),
      password: '',
    });
    setEditOrganizerError('');
    setIsEditOrganizerVisible(true);
  };

  const handleCloseEditOrganizer = () => {
    if (isEditingOrganizer) {
      return;
    }

    setIsEditOrganizerVisible(false);
    setEditingOrganizer(null);
    resetEditOrganizerForm();
  };

  const updateEditOrganizerField = (field, value) => {
    setEditOrganizerForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (editOrganizerError) {
      setEditOrganizerError('');
    }
  };

  const validateEditOrganizer = () => {
    if (!ORGANIZER_STATUS_OPTIONS.includes(editOrganizerForm.status)) {
      setEditOrganizerError('Select a valid organizer status.');
      return false;
    }

    if (editOrganizerForm.password.trim() && editOrganizerForm.password.trim().length < 6) {
      setEditOrganizerError('New password must be at least 6 characters.');
      return false;
    }

    return true;
  };

  const handleSaveOrganizerChanges = async () => {
    if (isEditingOrganizer || !editingOrganizer?.backendId) {
      return;
    }

    if (!validateEditOrganizer()) {
      return;
    }

    const statusChanged =
      editOrganizerForm.status.toLowerCase() !== String(editingOrganizer.status || '').toLowerCase();
    const nextPassword = editOrganizerForm.password.trim();
    const hasPasswordReset = Boolean(nextPassword);

    if (!statusChanged && !hasPasswordReset) {
      setEditOrganizerError('No changes to save.');
      return;
    }

    setIsEditingOrganizer(true);
    setEditOrganizerError('');

    try {
      if (statusChanged) {
        await updateOrganizerStatus(editingOrganizer.backendId, editOrganizerForm.status.toLowerCase());
      }

      if (hasPasswordReset) {
        await resetOrganizerPassword(editingOrganizer.backendId, nextPassword);
      }

      setIsEditOrganizerVisible(false);
      setEditingOrganizer(null);
      resetEditOrganizerForm();
      Alert.alert('Organizer updated', 'Organizer account has been updated successfully.');
      await fetchOrganizers();
    } catch (error) {
      setEditOrganizerError(getEditOrganizerErrorMessage(error));
    } finally {
      setIsEditingOrganizer(false);
    }
  };

  const executeDeleteOrganizer = async (organizer) => {
    if (!organizer?.backendId || deletingOrganizerId) {
      return;
    }

    setDeletingOrganizerId(organizer.backendId);

    try {
      await deleteOrganizer(organizer.backendId);
      Alert.alert('Organizer deleted', 'Organizer account has been deleted successfully.');
      await fetchOrganizers();
    } catch (error) {
      Alert.alert('Delete failed', getDeleteOrganizerErrorMessage(error));
    } finally {
      setDeletingOrganizerId('');
    }
  };

  const handleDeleteOrganizer = (organizer) => {
    if (!organizer?.canManage || !organizer?.backendId) {
      Alert.alert(
        'Action unavailable',
        'This organizer record cannot be deleted because it has no backend identifier.'
      );
      return;
    }

    Alert.alert(
      'Delete organizer',
      `Are you sure you want to delete ${organizer.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            executeDeleteOrganizer(organizer);
          },
        },
      ]
    );
  };

  const renderOrganizerRow = ({ item }) => {
    const isDeletingThisRow = Boolean(deletingOrganizerId) && deletingOrganizerId === item.backendId;
    const isActionsDisabled = !item.canManage || isEditingOrganizer || Boolean(deletingOrganizerId);

    return (
      <View style={styles.tableRow}>
        <View style={styles.profileCell}>
          {item.avatar && (
            <Image source={item.avatar} style={styles.avatar} />
          )}
        </View>
        <View style={styles.nameCell}>
          <Text style={styles.cellText}>{item.name}</Text>
        </View>
        <View style={styles.emailCell}>
          <Text style={[styles.cellText, styles.emailText]}>{item.email}</Text>
        </View>
        <View style={styles.roleCell}>
          <Text style={styles.cellText}>{item.role}</Text>
        </View>
        <View style={styles.statusCell}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.actionCell}>
          <TouchableOpacity
            onPress={() => handleOpenEditOrganizer(item)}
            disabled={isActionsDisabled}
          >
            <Text
              style={[
                styles.actionText,
                isActionsDisabled ? styles.disabledActionText : null,
              ]}
            >
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteOrganizer(item)}
            disabled={isActionsDisabled}
          >
            <Text
              style={[
                styles.actionText,
                styles.deleteText,
                isActionsDisabled ? styles.disabledActionText : null,
              ]}
            >
              {isDeletingThisRow ? 'Deleting...' : 'Delete'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <View style={styles.profileCell}>
        <Text style={styles.headerText}>Profile</Text>
      </View>
      <View style={styles.nameCell}>
        <Text style={styles.headerText}>Name</Text>
      </View>
      <View style={styles.emailCell}>
        <Text style={styles.headerText}>Email</Text>
      </View>
      <View style={styles.roleCell}>
        <Text style={styles.headerText}>Role</Text>
      </View>
      <View style={styles.statusCell}>
        <Text style={styles.headerText}>Status</Text>
      </View>
      <View style={styles.actionCell}>
        <Text style={styles.headerText}>Action</Text>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      <TouchableOpacity
        style={[styles.pageButton, currentPage === 1 ? styles.disabledPageButton : null]}
        onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
      >
        <Text style={styles.pageText}>Prev</Text>
      </TouchableOpacity>

      {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
        <TouchableOpacity
          key={`page-${page}`}
          style={[styles.pageButton, page === currentPage ? styles.activePageButton : null]}
          onPress={() => setCurrentPage(page)}
        >
          <Text style={[styles.pageText, page === currentPage ? styles.activePageText : null]}>{page}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.nextButton, currentPage === pageCount ? styles.disabledPageButton : null]}
        onPress={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
        disabled={currentPage === pageCount}
      >
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.headerSection}>
        <TouchableOpacity style={styles.backButtonWrap} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Organizer Accounts</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Image
          source={require('../assets/images/email-icon.png')}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Add Organizer Button */}
      <ActionButton
        title="+ Add Organizer"
        onPress={handleOpenAddOrganizer}
        style={styles.addButton}
        textStyle={styles.addButtonText}
      />

      {/* Table Section */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={styles.tableContainer}>
          {renderTableHeader()}

          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="small" color="#6F00FF" />
              <Text style={styles.stateText}>Loading organizers...</Text>
            </View>
          ) : null}

          {!isLoading && fetchError ? (
            <View style={styles.stateContainer}>
              <Text style={styles.errorText}>{fetchError}</Text>
              <ActionButton
                title="Retry"
                onPress={fetchOrganizers}
                style={styles.retryButton}
                textStyle={styles.retryText}
              />
            </View>
          ) : null}

          {!isLoading && !fetchError ? (
            <FlatList
              data={paginatedOrganizers}
              renderItem={renderOrganizerRow}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              nestedScrollEnabled={true}
              ListEmptyComponent={
                <View style={styles.stateContainer}>
                  <Text style={styles.stateText}>No organizers found.</Text>
                </View>
              }
            />
          ) : null}
        </View>
      </ScrollView>

      {/* Pagination */}
      {!isLoading && !fetchError && filteredOrganizers.length > 0 ? renderPagination() : null}

      <Modal
        visible={isEditOrganizerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseEditOrganizer}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Organizer</Text>
            <Text style={styles.modalHelperText}>
              Update status and optionally set a new password.
            </Text>

            <View style={styles.organizerMetaCard}>
              <Text style={styles.organizerMetaName}>{editingOrganizer?.name || 'Organizer'}</Text>
              <Text style={styles.organizerMetaEmail}>{editingOrganizer?.email || ''}</Text>
            </View>

            <Text style={styles.modalFieldLabel}>Status</Text>
            <View style={styles.statusOptionsRow}>
              {ORGANIZER_STATUS_OPTIONS.map((statusOption) => {
                const isSelected = editOrganizerForm.status === statusOption;

                return (
                  <TouchableOpacity
                    key={statusOption}
                    style={[
                      styles.statusOptionButton,
                      isSelected ? styles.statusOptionButtonActive : null,
                    ]}
                    onPress={() => updateEditOrganizerField('status', statusOption)}
                    disabled={isEditingOrganizer}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        isSelected ? styles.statusOptionTextActive : null,
                      ]}
                    >
                      {statusOption}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalFieldLabel}>Reset password (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Leave blank to keep current password"
              placeholderTextColor="#9CA3AF"
              value={editOrganizerForm.password}
              onChangeText={(value) => updateEditOrganizerField('password', value)}
              secureTextEntry
            />

            {editOrganizerError ? <Text style={styles.modalErrorText}>{editOrganizerError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={handleCloseEditOrganizer}
                disabled={isEditingOrganizer}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalSubmitButton,
                  isEditingOrganizer ? styles.modalDisabledButton : null,
                ]}
                onPress={handleSaveOrganizerChanges}
                disabled={isEditingOrganizer}
              >
                <Text style={styles.modalSubmitText}>
                  {isEditingOrganizer ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isAddOrganizerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseAddOrganizer}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Organizer</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="First Name"
              placeholderTextColor="#9CA3AF"
              value={newOrganizer.firstName}
              onChangeText={(value) => updateNewOrganizerField('firstName', value)}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Last Name"
              placeholderTextColor="#9CA3AF"
              value={newOrganizer.lastName}
              onChangeText={(value) => updateNewOrganizerField('lastName', value)}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={newOrganizer.email}
              onChangeText={(value) => updateNewOrganizerField('email', value)}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Temporary Password"
              placeholderTextColor="#9CA3AF"
              value={newOrganizer.password}
              onChangeText={(value) => updateNewOrganizerField('password', value)}
              secureTextEntry
            />

            {addOrganizerError ? <Text style={styles.modalErrorText}>{addOrganizerError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={handleCloseAddOrganizer}
                disabled={isAddingOrganizer}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalSubmitButton,
                  isAddingOrganizer ? styles.modalDisabledButton : null,
                ]}
                onPress={handleAddOrganizer}
                disabled={isAddingOrganizer}
              >
                <Text style={styles.modalSubmitText}>
                  {isAddingOrganizer ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  backButtonWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    fontSize: 28,
    color: '#1F2937',
    lineHeight: 30,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  addButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#6F00FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tableContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 14,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 14,
    alignItems: 'center',
  },
  profileCell: {
    width: 60,
    paddingHorizontal: 8,
  },
  nameCell: {
    width: 100,
    paddingHorizontal: 8,
  },
  emailCell: {
    width: 120,
    paddingHorizontal: 8,
  },
  roleCell: {
    width: 80,
    paddingHorizontal: 8,
  },
  statusCell: {
    width: 85,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  actionCell: {
    width: 95,
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  cellText: {
    fontSize: 12,
    color: '#1F2937',
  },
  emailText: {
    fontSize: 11,
    color: '#6B7280',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  actionText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 2,
  },
  deleteText: {
    color: '#EF4444',
  },
  disabledActionText: {
    opacity: 0.45,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  pageButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  pageText: {
    fontSize: 14,
    color: '#1F2937',
  },
  nextButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
  },
  nextText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  activePageButton: {
    backgroundColor: '#6F00FF',
    borderColor: '#6F00FF',
  },
  activePageText: {
    color: '#FFFFFF',
  },
  disabledPageButton: {
    opacity: 0.45,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    paddingHorizontal: 18,
    gap: 10,
  },
  stateText: {
    fontSize: 13,
    color: '#4B5563',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalHelperText: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 10,
  },
  organizerMetaCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  organizerMetaName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  organizerMetaEmail: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  modalFieldLabel: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  statusOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  statusOptionButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  statusOptionButtonActive: {
    borderColor: '#6F00FF',
    backgroundColor: '#F3E8FF',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  statusOptionTextActive: {
    color: '#5B21B6',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  modalErrorText: {
    marginTop: 10,
    fontSize: 13,
    color: '#DC2626',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalButton: {
    minWidth: 94,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  modalSubmitButton: {
    backgroundColor: '#6F00FF',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalDisabledButton: {
    opacity: 0.65,
  },
});

export default OrganizerAccounts;
