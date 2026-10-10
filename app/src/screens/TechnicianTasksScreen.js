import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import api, { getErrorMessage } from '../services/api';

export default function TechnicianTasksScreen({ navigation, route }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get('/tasks');
      if (res.data?.success) {
        setTasks(res.data.tasks || []);
      }
    } catch (err) {
      console.log('Error fetching tasks:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // The floating "+" on the tab bar navigates here with openAdd=true.
  useEffect(() => {
    if (route?.params?.openAdd) {
      setShowAddModal(true);
      navigation?.setParams({ openAdd: false });
    }
  }, [route?.params?.openAdd, navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleAddTask = async () => {
    if (!newTask.title?.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    if (submitting) return;
    const taskObj = {
      _id: `local_${Date.now()}`,
      title: newTask.title.trim(),
      notes: newTask.notes?.trim() || '',
      done: false,
      createdAt: new Date().toISOString(),
    };
    try {
      setSubmitting(true);
      setTasks((prev) => [taskObj, ...prev]);
      setShowAddModal(false);
      setNewTask({ title: '', notes: '' });

      const res = await api.post('/tasks', {
        title: taskObj.title,
        notes: taskObj.notes,
      });
      if (res.data?.success && res.data.task) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskObj._id ? res.data.task : t))
        );
      }
    } catch (e) {
      console.log('Backend task creation sync notice:', e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (task) => {
    // Optimistic update so the checkbox feels instant.
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, done: !t.done } : t))
    );
    try {
      await api.patch(`/tasks/${task._id}`, { done: !task.done });
    } catch (e) {
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, done: task.done } : t))
      );
      Alert.alert('Error', getErrorMessage(e, 'Could not update the task.'));
    }
  };

  const handleDelete = (task) => {
    Alert.alert('Delete Task', `Remove "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/tasks/${task._id}`);
            setTasks((prev) => prev.filter((t) => t._id !== task._id));
          } catch (e) {
            Alert.alert('Error', getErrorMessage(e, 'Could not delete the task.'));
          }
        },
      },
    ]);
  };

  const pendingTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  const renderTask = (task) => (
    <View key={task._id} style={styles.taskCard}>
      <TouchableOpacity style={styles.checkbox} onPress={() => handleToggle(task)}>
        <Ionicons
          name={task.done ? 'checkbox' : 'square-outline'}
          size={24}
          color={task.done ? '#48BB78' : '#A0AEC0'}
        />
      </TouchableOpacity>
      <View style={styles.taskBody}>
        <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>{task.title}</Text>
        {task.notes ? <Text style={styles.taskNotes}>{task.notes}</Text> : null}
        {task.dueDate ? (
          <Text style={styles.taskMeta}>
            Due {new Date(task.dueDate).toLocaleDateString()}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(task)}>
        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Tasks</Text>
          <Text style={styles.subtitle}>Personal to-do list</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={48} color="#A0AEC0" />
              <Text style={styles.emptyText}>No tasks yet. Tap + to add one.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>TO DO ({pendingTasks.length})</Text>
              {pendingTasks.length === 0 ? (
                <Text style={styles.groupEmpty}>All caught up 🎉</Text>
              ) : (
                pendingTasks.map(renderTask)
              )}

              {doneTasks.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 25 }]}>
                    COMPLETED ({doneTasks.length})
                  </Text>
                  {doneTasks.map(renderTask)}
                </>
              )}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Task</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Buy AC Gas Cylinder"
              placeholderTextColor="#999"
              value={newTask.title}
              onChangeText={(t) => setNewTask({ ...newTask, title: t })}
            />

            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
              placeholder="Any details..."
              placeholderTextColor="#999"
              multiline
              value={newTask.notes}
              onChangeText={(t) => setNewTask({ ...newTask, notes: t })}
            />

            <TouchableOpacity
              style={[styles.saveBtn, submitting && { opacity: 0.6 }]}
              onPress={handleAddTask}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>Add Task</Text>
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sectionLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  groupEmpty: {
    color: '#A0AEC0',
    fontSize: 14,
    marginBottom: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  checkbox: {
    marginRight: 12,
  },
  taskBody: {
    flex: 1,
  },
  taskTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#A0AEC0',
  },
  taskNotes: {
    color: '#718096',
    fontSize: 13,
    marginTop: 4,
  },
  taskMeta: {
    color: '#A0AEC0',
    fontSize: 12,
    marginTop: 6,
  },
  deleteBtn: {
    padding: 5,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#A0AEC0',
    marginTop: 12,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  inputLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
