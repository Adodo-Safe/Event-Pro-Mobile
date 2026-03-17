import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import { ActionButton } from '../components/button';

const OrganizerAccounts = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Mock data for organizers
  const [organizers, setOrganizers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Admin',
      status: 'Active',
      avatar: require('../assets/images/icon.png'),
    },
    {
      id: 2,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Organizer',
      status: 'Pending',
      avatar: require('../assets/images/icon.png'),
    },
    {
      id: 3,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Viewer',
      status: 'Inactive',
      avatar: require('../assets/images/icon.png'),
    },
    {
      id: 4,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Admin',
      status: 'Active',
      avatar: require('../assets/images/icon.png'),
    },
  ]);

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

  const filteredOrganizers = organizers.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderOrganizerRow = ({ item }) => (
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
        <TouchableOpacity>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
      <TouchableOpacity style={styles.pageButton}>
        <Text style={styles.pageText}>1</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.pageButton}>
        <Text style={styles.pageText}>2</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.pageButton}>
        <Text style={styles.pageText}>3</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.nextButton}>
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backButton}>← </Text>
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
        onPress={() => {
          // Handle add organizer
        }}
        style={styles.addButton}
        textStyle={styles.addButtonText}
      />

      {/* Table Section */}
      <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          <FlatList
            data={filteredOrganizers}
            renderItem={renderOrganizerRow}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            nestedScrollEnabled={true}
          />
        </View>
      </ScrollView>

      {/* Pagination */}
      {renderPagination()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    fontSize: 24,
    color: '#1F2937',
    marginRight: 12,
  },
  pageTitle: {
    fontSize: 24,
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
    marginBottom: 16,
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
    marginBottom: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tableContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
    alignItems: 'center',
  },
  profileCell: {
    width: 60,
    paddingHorizontal: 12,
  },
  nameCell: {
    width: 120,
    paddingHorizontal: 8,
  },
  emailCell: {
    width: 150,
    paddingHorizontal: 8,
  },
  roleCell: {
    width: 100,
    paddingHorizontal: 8,
  },
  statusCell: {
    width: 100,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  actionCell: {
    width: 100,
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  cellText: {
    fontSize: 14,
    color: '#1F2937',
  },
  emailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 4,
  },
  deleteText: {
    color: '#EF4444',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
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
});

export default OrganizerAccounts;
