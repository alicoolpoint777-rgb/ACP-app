import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import CustomerHomeScreen from '../screens/CustomerHomeScreen';
import CustomerServicesScreen from '../screens/CustomerServicesScreen';
import CustomerOrdersScreen from '../screens/CustomerOrdersScreen';
import CustomerProfileScreen from '../screens/CustomerProfileScreen';

const Tab = createBottomTabNavigator();

export default function CustomerTabs() {
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#002B5B', // Deep Navy Blue
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Services') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'My Orders') iconName = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'Profile & Support') iconName = focused ? 'person' : 'person-outline';
          
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: '#007BFF', // Bright Blue
        tabBarInactiveTintColor: '#A0AEC0', // Light Gray
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        }
      })}
    >
      <Tab.Screen name="Home" component={CustomerHomeScreen} />
      <Tab.Screen name="Services" component={CustomerServicesScreen} />
      <Tab.Screen name="My Orders" component={CustomerOrdersScreen} />
      <Tab.Screen name="Profile & Support" component={CustomerProfileScreen} />
    </Tab.Navigator>
  );
}
