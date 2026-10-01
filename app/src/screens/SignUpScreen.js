import React, { useEffect, useRef, useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import VectorIllustration from '../components/VectorIllustration';
import { AuthContext } from '../context/AuthContext';
import { configureGoogleSignin, signInWithGoogle, isGoogleSignInCancelled } from '../services/googleAuth';

export default function SignUpScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const { signup, googleLogin } = useContext(AuthContext);

  useEffect(() => {
    configureGoogleSignin();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 200, 
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleGoogleLogin = async () => {
    if (googleLoading || loading) return;
    setGoogleLoading(true);
    try {
      const { idToken } = await signInWithGoogle();
      const res = await googleLogin(idToken);
      if (!res.success) {
        Alert.alert('Google Login Failed', res.message);
      }
    } catch (error) {
      console.log('Google Sign-In Error:', error);
      if (isGoogleSignInCancelled(error)) return;
      Alert.alert('Google Sign-In Failed', error.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (loading || googleLoading) return;

    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing Details', 'Please enter your name, email, and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await signup(name.trim(), email.trim().toLowerCase(), password);
      if (!res.success) {
        // Check if account already exists
        const errorMsg = (res.message || '').toLowerCase();
        if (errorMsg.includes('already exists') || errorMsg.includes('already registered')) {
          Alert.alert(
            'Account Already Exists',
            'An account with this email already exists. Please log in.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Log In', 
                style: 'default',
                onPress: () => navigation.navigate('Login') 
              }
            ]
          );
        } else {
          Alert.alert('Signup Failed', res.message || 'Could not create account. Please try again.');
        }
      }
      // If success, AuthContext sets isAuthenticated = true,
      // which automatically loads CustomerStack without needing manual login!
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.topSection}>
        <VectorIllustration />
        <Text style={styles.headerText}>Create Your Account{'\n'}and Simplify Your{'\n'}Workday</Text>
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.title}>Sign up</Text>
        <View style={styles.loginRow}>
          <Text style={styles.grayText}>Already Have An Account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Log In</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
            
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input}
                placeholder="Enter your email address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && { opacity: 0.8 }]} 
              onPress={handleSignUp}
              disabled={loading || googleLoading}
            >
              {loading ? (
                <ActivityIndicator color={colors.textLight} />
              ) : (
                <Text style={styles.buttonText}>Sign up</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Or Continue With</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialButtonLight} 
                onPress={handleGoogleLogin}
                disabled={loading || googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#333" size="small" />
                ) : (
                  <Text style={styles.socialButtonTextDark}>Google</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  topSection: {
    flex: 0.8,
    padding: 30,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.surface,
    lineHeight: 36,
  },
  bottomSection: {
    flex: 2,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },
  grayText: {
    color: '#888',
    fontSize: 14,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 15 : 5,
  },
  input: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.primary,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  buttonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E5EC',
  },
  dividerText: {
    color: '#999',
    paddingHorizontal: 10,
    fontSize: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flex: 0.47,
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  socialButtonLight: {
    flex: 0.47,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E5EC',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  socialButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  socialButtonTextDark: {
    color: '#333',
    fontWeight: 'bold',
  }
});
