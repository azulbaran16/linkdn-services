import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertProfileSchema, UpsertProfileInput, createWorkspaceSchema } from 'shared';
import { apiGet, apiPost, apiPut } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { ErrorMessage } from '../../components/ErrorMessage';
import { LoadingScreen } from '../../components/LoadingScreen';
import { colors, fontSize, spacing, borderRadius } from '../../theme';
import { ProviderStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<ProviderStackParamList, 'ProfileEditor'>;

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function ProfileEditorScreen({ navigation }: Props) {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Check if workspace exists
  const { data: workspaceData, isLoading: wsLoading } = useQuery({
    queryKey: ['workspace'],
    queryFn: () => apiGet<{ workspace: any }>('/api/workspaces/current').catch(() => null),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<{ categories: Category[] }>('/api/categories', false),
  });

  // Fetch existing profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiGet<{ profile: any; categories: Category[] }>('/api/profile'),
    enabled: !!workspaceData?.workspace,
  });

  const { control, handleSubmit, formState: { errors }, setValue, reset } = useForm<UpsertProfileInput>({
    resolver: zodResolver(upsertProfileSchema),
    defaultValues: {
      slug: '',
      displayName: '',
      city: '',
      description: '',
      categoryIds: [],
      contactEmail: '',
      contactPhone: '',
      portfolioLinks: [],
      logoUrl: '',
    },
  });

  // Populate form with existing data
  useEffect(() => {
    if (profileData?.profile) {
      const p = profileData.profile;
      reset({
        slug: p.slug || '',
        displayName: p.displayName || '',
        city: p.city || '',
        description: p.description || '',
        categoryIds: profileData.categories?.map((c: Category) => c.id) || [],
        contactEmail: p.contactEmail || '',
        contactPhone: p.contactPhone || '',
        portfolioLinks: p.portfolioLinks || [],
        logoUrl: p.logoUrl || '',
      });
      setSelectedCategories(profileData.categories?.map((c: Category) => c.id) || []);
    }
  }, [profileData, reset]);

  // Create workspace mutation
  const createWorkspaceMutation = useMutation({
    mutationFn: (data: { type: 'PERSON' | 'COMPANY'; name: string }) =>
      apiPost('/api/workspaces', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
    },
  });

  // Upsert profile mutation
  const profileMutation = useMutation({
    mutationFn: (data: UpsertProfileInput) => apiPut('/api/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
      refreshUser();
      Alert.alert('Perfil guardado', 'Tu perfil ha sido actualizado exitosamente.');
      navigation.goBack();
    },
  });

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const next = prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId];
      setValue('categoryIds', next, { shouldValidate: true });
      return next;
    });
  };

  const onSubmit = async (data: UpsertProfileInput) => {
    setError('');
    try {
      // Create workspace if needed
      if (!workspaceData?.workspace) {
        await createWorkspaceMutation.mutateAsync({
          type: 'PERSON',
          name: data.displayName,
        });
      }
      await profileMutation.mutateAsync({ ...data, categoryIds: selectedCategories });
    } catch (err: any) {
      setError(err.message || 'Error al guardar el perfil');
    }
  };

  // Auto-generate slug from display name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60);
  };

  if (wsLoading || profileLoading) return <LoadingScreen />;

  const isLoading = createWorkspaceMutation.isPending || profileMutation.isPending;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {error ? <ErrorMessage message={error} /> : null}

        <Controller
          control={control}
          name="displayName"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nombre de negocio"
              placeholder="Ej: Maria Estilista"
              value={value}
              onChangeText={(text) => {
                onChange(text);
                // Auto-generate slug if slug is empty or was auto-generated
                const currentSlug = control._formValues.slug;
                const autoSlug = generateSlug(control._formValues.displayName);
                if (!currentSlug || currentSlug === autoSlug) {
                  setValue('slug', generateSlug(text));
                }
              }}
              error={errors.displayName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="slug"
          render={({ field: { onChange, value } }) => (
            <Input
              label="URL del perfil (slug)"
              placeholder="mi-negocio"
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.slug?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="city"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Ciudad"
              placeholder="Ej: Bogota"
              value={value}
              onChangeText={onChange}
              error={errors.city?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Descripcion"
              placeholder="Describe tu negocio o servicio..."
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={4}
              style={{ height: 100, textAlignVertical: 'top' }}
              error={errors.description?.message}
            />
          )}
        />

        {/* Categories */}
        <Text style={styles.label}>Categorias</Text>
        {errors.categoryIds?.message && (
          <Text style={styles.errorText}>{errors.categoryIds.message}</Text>
        )}
        <View style={styles.categoriesContainer}>
          {categoriesData?.categories?.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => toggleCategory(cat.id)}
              style={[
                styles.categoryChip,
                selectedCategories.includes(cat.id) && styles.categoryChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategories.includes(cat.id) && styles.categoryChipTextSelected,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Controller
          control={control}
          name="contactEmail"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Correo de contacto (opcional)"
              placeholder="contacto@negocio.com"
              value={value || ''}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.contactEmail?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="contactPhone"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Telefono de contacto (opcional)"
              placeholder="300 123 4567"
              value={value || ''}
              onChangeText={onChange}
              keyboardType="phone-pad"
              error={errors.contactPhone?.message}
            />
          )}
        />

        <Button
          title="Guardar perfil"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  categoryChipTextSelected: {
    color: colors.white,
  },
});
