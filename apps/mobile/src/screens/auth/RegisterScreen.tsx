import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from 'shared';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { ErrorMessage } from '../../components/ErrorMessage';
import { colors, fontSize, fontWeight, spacing, borderRadius, screenPadding } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthStack';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const hasGoogleConfig = !!(GOOGLE_WEB_CLIENT_ID || GOOGLE_IOS_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID);

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register, socialLogin } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest(
    hasGoogleConfig
      ? {
          webClientId: GOOGLE_WEB_CLIENT_ID,
          iosClientId: GOOGLE_IOS_CLIENT_ID,
          androidClientId: GOOGLE_ANDROID_CLIENT_ID,
        }
      : { clientId: 'placeholder' }
  );

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        handleGoogleLogin(idToken);
      }
    }
  }, [googleResponse]);

  const handleGoogleLogin = async (idToken: string) => {
    setSocialLoading(true);
    setError('');
    try {
      await socialLogin('GOOGLE', idToken);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar con Google');
    } finally {
      setSocialLoading(false);
    }
  };

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', name: '' },
  });

  const onSubmit = async (data: RegisterInput) => {
    setError('');
    setLoading(true);
    try {
      await register(data.email, data.password, data.name);
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {error ? <ErrorMessage message={error} /> : null}

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nombre completo"
              placeholder="Tu nombre"
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Correo electronico"
              placeholder="tu@correo.com"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Contrasena"
              placeholder="Minimo 8 caracteres"
              value={value}
              onChangeText={onChange}
              secureTextEntry
              error={errors.password?.message}
            />
          )}
        />

        <Button
          title="Crear cuenta"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={{ marginTop: spacing.sm }}
        />

        {/* Social Login Separator */}
        {(hasGoogleConfig || Platform.OS === 'ios') && (
          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>o registrate con</Text>
            <View style={styles.separatorLine} />
          </View>
        )}

        {/* Google Button */}
        {hasGoogleConfig && (
          <Pressable
            style={styles.socialButton}
            onPress={() => googlePromptAsync()}
            disabled={socialLoading}
          >
            <MaterialIcons name="g-mobiledata" size={24} color={colors.neutral900} />
            <Text style={styles.socialButtonText}>Continuar con Google</Text>
          </Pressable>
        )}

        {/* Apple Button - iOS only */}
        {Platform.OS === 'ios' && (
          <Pressable
            style={[styles.socialButton, styles.appleSocialButton]}
            onPress={() => {
              setError('Inicio con Apple pronto disponible');
            }}
            disabled={socialLoading}
          >
            <MaterialIcons name="apple" size={24} color={colors.white} />
            <Text style={[styles.socialButtonText, styles.appleSocialText]}>Continuar con Apple</Text>
          </Pressable>
        )}

        <Button
          title="Ya tengo cuenta"
          onPress={() => navigation.goBack()}
          variant="ghost"
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: {
    flexGrow: 1,
    ...screenPadding,
    justifyContent: 'center',
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral200,
  },
  separatorText: {
    fontSize: fontSize.sm,
    color: colors.neutral500,
    marginHorizontal: spacing.ms,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral200,
    backgroundColor: colors.white,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  socialButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.neutral900,
  },
  appleSocialButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  appleSocialText: {
    color: colors.white,
  },
});
