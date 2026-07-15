import React, {useRef, useState} from 'react';

import {Image, View} from 'react-native';

import {launchImageLibrary} from 'react-native-image-picker';

import {
  Avatar,
  BottomSheet,
  Box,
  Button,
  Icon,
  IconName,
  Screen,
  Text,
  TextInput,
  TouchableOpacityBox,
} from '@components';
import {useAuthUpdateProfile} from '@domain';
import {AppStackScreenProps} from '@routes';
import {toastService, useAuthCredentials} from '@services';

import {
  ImageViewer,
  ImageViewerTarget,
} from '../Chat/components/ImageViewer';
import {useCameraCapture} from '../Chat/components/useCameraCapture';

const AVATAR_SIZE = 96;

/**
 * Editar meu perfil: nome + foto (tirar na hora, escolher da galeria ou
 * remover). Cargo/email são somente leitura (gerenciados pela empresa).
 * Salvar persiste nas credenciais — o avatar atualiza no app todo.
 */
export function EditProfileScreen({
  navigation,
}: AppStackScreenProps<'EditProfileScreen'>) {
  const {authCredentials, saveCredentials} = useAuthCredentials();
  const user = authCredentials?.user;

  const [name, setName] = useState(user?.name ?? '');
  /** Foto em edição (preview) — só persiste ao salvar. */
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [photoTarget, setPhotoTarget] = useState<ImageViewerTarget | null>(
    null,
  );

  const avatarRef = useRef<View>(null);
  const captureFromCamera = useCameraCapture();

  const {updateProfile, isLoading} = useAuthUpdateProfile({
    onSuccess: async updatedUser => {
      if (authCredentials) {
        await saveCredentials({...authCredentials, user: updatedUser});
      }
      toastService.show('Perfil atualizado.');
      navigation.goBack();
    },
    onError: error => toastService.show(error.message, 'error'),
  });

  const trimmedName = name.trim();
  const hasChanges =
    !!user &&
    (trimmedName !== user.name || avatarUrl !== user.avatarUrl);

  async function handleTakePhoto() {
    setSheetOpen(false);
    const uri = await captureFromCamera();
    if (uri) {
      setAvatarUrl(uri);
    }
  }

  async function handlePickFromGallery() {
    setSheetOpen(false);
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });
    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      toastService.show('Não foi possível abrir a galeria.', 'error');
      return;
    }
    const uri = result.assets?.[0]?.uri;
    if (uri) {
      setAvatarUrl(uri);
    }
  }

  /** Ver a foto atual em tela cheia (shared element a partir do avatar). */
  function handleViewPhoto() {
    setSheetOpen(false);
    const uri = avatarUrl;
    if (!uri || !user) {
      return;
    }
    avatarRef.current?.measureInWindow((x, y, width, height) => {
      const base = {
        uri,
        frame: {x, y, width, height},
        cornerRadius: AVATAR_SIZE / 2,
        title: user.name,
        subtitle: 'Foto de perfil',
      };
      Image.getSize(
        uri,
        (imageWidth, imageHeight) =>
          setPhotoTarget({...base, imageWidth, imageHeight}),
        () =>
          setPhotoTarget({...base, imageWidth: width, imageHeight: height}),
      );
    });
  }

  function handleSave() {
    if (!user || !trimmedName) {
      return;
    }
    updateProfile(user, {name: trimmedName, avatarUrl});
  }

  const sheetOptions: {
    icon: IconName;
    label: string;
    onPress: () => void;
    danger?: boolean;
  }[] = [
    ...(avatarUrl
      ? [
          {
            icon: 'search' as IconName,
            label: 'Ver foto',
            onPress: handleViewPhoto,
          },
        ]
      : []),
    {icon: 'camera', label: 'Tirar foto', onPress: handleTakePhoto},
    {
      icon: 'image',
      label: 'Escolher da galeria',
      onPress: handlePickFromGallery,
    },
    ...(avatarUrl
      ? [
          {
            icon: 'trash' as IconName,
            label: 'Remover foto',
            onPress: () => {
              setSheetOpen(false);
              setAvatarUrl(undefined);
            },
            danger: true,
          },
        ]
      : []),
  ];

  if (!user) {
    return (
      <Screen canGoBack onBackPress={navigation.goBack} title="Editar perfil">
        <Box flex={1} />
      </Screen>
    );
  }

  return (
    <Screen
      canGoBack
      onBackPress={navigation.goBack}
      title="Editar perfil"
      scrollable>
      {/* Foto */}
      <Box alignItems="center" paddingVertical="s20">
        <TouchableOpacityBox
          onPress={() => setSheetOpen(true)}
          activeOpacity={0.8}>
          <Box ref={avatarRef} collapsable={false}>
            <Avatar
              label={user.initials}
              color={user.avatarColor}
              photoUri={avatarUrl}
              shape="circle"
              size={AVATAR_SIZE}
            />
          </Box>
          <Box
            position="absolute"
            right={-2}
            bottom={-2}
            width={32}
            height={32}
            alignItems="center"
            justifyContent="center"
            backgroundColor="primary"
            borderWidth={2}
            borderColor="background"
            style={$cameraBadge}>
            <Icon name="camera" size={16} color="primaryContrast" />
          </Box>
        </TouchableOpacityBox>
        <TouchableOpacityBox
          onPress={() => setSheetOpen(true)}
          activeOpacity={0.7}>
          <Text
            variant="paragraphSecondary"
            fontWeight="600"
            color="primary"
            marginTop="s12">
            Alterar foto
          </Text>
        </TouchableOpacityBox>
      </Box>

      {/* Nome */}
      <TextInput
        label="Nome"
        value={name}
        onChangeText={setName}
        placeholder="Seu nome"
        autoCapitalize="words"
      />

      {/* Somente leitura */}
      <Box
        backgroundColor="card"
        borderWidth={1}
        borderColor="separator"
        borderRadius="br16"
        overflow="hidden"
        marginTop="s20">
        <Box
          padding="s16"
          borderBottomWidth={1}
          borderColor="separator">
          <Text variant="captionSmall" fontWeight="600">
            Cargo
          </Text>
          <Text variant="body" marginTop="s2">
            {user.role}
          </Text>
        </Box>
        <Box padding="s16">
          <Text variant="captionSmall" fontWeight="600">
            Email
          </Text>
          <Text variant="body" marginTop="s2">
            {user.email}
          </Text>
        </Box>
      </Box>
      <Text
        variant="captionSmall"
        color="textTertiary"
        marginTop="s8"
        paddingHorizontal="s4">
        Cargo e email são gerenciados pela empresa.
      </Text>

      <Button
        title="Salvar"
        onPress={handleSave}
        loading={isLoading}
        disabled={!trimmedName || !hasChanges}
        marginTop="s24"
        marginBottom="s24"
      />

      {/* Opções da foto */}
      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Foto de perfil">
        {sheetOptions.map(option => (
          <TouchableOpacityBox
            key={option.label}
            onPress={option.onPress}
            activeOpacity={0.7}
            flexDirection="row"
            alignItems="center"
            gap="s14"
            paddingVertical="s12">
            <Icon
              name={option.icon}
              size={22}
              color={option.danger ? 'danger' : 'text'}
            />
            <Text variant="body" color={option.danger ? 'danger' : 'text'}>
              {option.label}
            </Text>
          </TouchableOpacityBox>
        ))}
      </BottomSheet>

      <ImageViewer target={photoTarget} onClose={() => setPhotoTarget(null)} />
    </Screen>
  );
}

const $cameraBadge = {borderRadius: 16};
