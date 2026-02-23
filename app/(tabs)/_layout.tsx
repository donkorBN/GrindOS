import { Tabs } from 'expo-router';
import { Home, BarChart3, Settings, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { scheduleHalfHourCheckIn } from '@/utils/notifications';
import AddTaskModal from '@/components/AddTaskModal';
import { useTasks } from '@/providers/TaskProvider';

export default function TabLayout() {
  const colors = useThemeColors();
  const { addTask } = useTasks();
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    scheduleHalfHourCheckIn();
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
            borderTopWidth: 1,
            height: 70,
            paddingBottom: 10,
          },
        }}
      >
        <Tabs.Screen
          name="(today)"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                <Home size={22} color={color} fill={focused ? color : 'transparent'} />
                {focused && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="action"
          options={{
            title: 'Add',
            tabBarIcon: ({ color }) => (
              <View style={[styles.centerBtn, { backgroundColor: colors.accent }]}>
                <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            ),
          }}
          listeners={() => ({
            tabPress: (e) => {
              e.preventDefault(); // prevent routing
              setShowAddModal(true);
            },
          })}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                <BarChart3 size={22} color={color} />
                {focused && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                <Settings size={22} color={color} />
                {focused && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
              </View>
            ),
          }}
        />
      </Tabs>

      <AddTaskModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addTask}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 6,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  centerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#4A90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
