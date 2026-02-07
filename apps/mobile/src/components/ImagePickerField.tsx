import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '../theme';

interface ImagePickerFieldProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  aspectRatio?: [number, number];
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const PADDING = 20; // screenPadding
const GAP = spacing.sm;

async function compressAndConvertToBase64(uri: string): Promise<string> {
  // Resize to max 800px wide, compress as JPEG 0.6
  const manipulated = await manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    { compress: 0.6, format: SaveFormat.JPEG }
  );

  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
    encoding: 'base64',
  });

  return `data:image/jpeg;base64,${base64}`;
}

export function ImagePickerField({
  images,
  onChange,
  maxImages = 1,
  label,
  aspectRatio = [16, 9],
}: ImagePickerFieldProps) {
  const [loading, setLoading] = useState(false);
  const isSingle = maxImages === 1;

  // Calculate image dimensions
  const availableWidth = SCREEN_WIDTH - PADDING * 2;
  const imageWidth = isSingle
    ? availableWidth
    : (availableWidth - GAP) / 2;
  const imageHeight = imageWidth * (aspectRatio[1] / aspectRatio[0]);

  const canAddMore = images.length < maxImages;

  const requestPermission = async (): Promise<boolean> => {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso necesario',
        'Necesitamos acceso a tu galeria para seleccionar fotos.',
      );
      return false;
    }
    return true;
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso necesario',
        'Necesitamos acceso a tu camara para tomar fotos.',
      );
      return false;
    }
    return true;
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: aspectRatio,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ExpoImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: aspectRatio,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri: string) => {
    setLoading(true);
    try {
      const base64 = await compressAndConvertToBase64(uri);
      if (isSingle) {
        onChange([base64]);
      } else {
        onChange([...images, base64]);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo procesar la imagen. Intenta de nuevo.');
      console.error('Image processing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showPickerOptions = () => {
    Alert.alert('Agregar foto', 'Elige una opcion', [
      { text: 'Tomar foto', onPress: takePhoto },
      { text: 'Elegir de galeria', onPress: pickFromGallery },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const renderImage = (uri: string, index: number) => (
    <View key={index} style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
      <Image
        source={{ uri }}
        style={[styles.image, { borderRadius: borderRadius.md }]}
        resizeMode="cover"
      />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeImage(index)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="close" size={16} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderAddButton = () => (
    <TouchableOpacity
      style={[
        styles.addButton,
        {
          width: isSingle ? availableWidth : imageWidth,
          height: imageHeight,
          borderRadius: borderRadius.md,
        },
      ]}
      onPress={showPickerOptions}
      activeOpacity={0.7}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" />
      ) : (
        <>
          <MaterialIcons name="add-a-photo" size={32} color={colors.primary} />
          <Text style={styles.addButtonText}>
            {isSingle ? 'Agregar foto' : `Agregar (${images.length}/${maxImages})`}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Single mode: show image or add button */}
      {isSingle && (
        <>
          {images.length > 0 ? (
            <View>
              {renderImage(images[0], 0)}
              <TouchableOpacity
                style={styles.changeButton}
                onPress={showPickerOptions}
                disabled={loading}
              >
                <MaterialIcons name="edit" size={16} color={colors.white} />
                <Text style={styles.changeButtonText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            renderAddButton()
          )}
        </>
      )}

      {/* Multiple mode: grid of images + add button */}
      {!isSingle && (
        <View style={styles.grid}>
          {images.map((uri, index) => renderImage(uri, index))}
          {canAddMore && renderAddButton()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
    ...shadows.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeButton: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.ms,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  changeButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  addButton: {
    borderWidth: 2,
    borderColor: colors.neutral200,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral50,
    gap: spacing.sm,
  },
  addButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
});
