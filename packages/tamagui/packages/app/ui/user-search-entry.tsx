'use client';
import * as React from 'react';
import { Image } from 'react-native';
import { User } from 'app/api/graphql/types';
import { useRouter } from 'app/navigation';
import { YStack, XStack, Text } from 'tamagui';

type UserSearchEntryProps = {
  user: User;
};

export const UserSearchEntry = React.memo(function UserSearchEntryComponent({ user }: UserSearchEntryProps) {
  const { push } = useRouter();
  
  // Create safe versions of user data with fallbacks
  const displayName = user?.displayName || user?.username || 'User';
  const username = user?.username || 'username';
  const avatarUrl = user?.avatarUrl || 'https://via.placeholder.com/100';
  const userId = user?.id || '';
  const description = user?.description || '';
  
  const handlePress = React.useCallback(() => {
    if (userId) {
      push(`/profile/${userId}`);
    }
  }, [userId, push]);

  return (
    <XStack
      marginBottom="$4"
      flexDirection="row"
      alignItems="center"
      borderRadius="$3"
      backgroundColor="$gray8"
      padding="$2"
      pressStyle={{ opacity: 0.8 }}
      onPress={handlePress}
      cursor="pointer"
    >
      <Image
        source={{ uri: avatarUrl }}
        style={{ height: 56, width: 56, borderRadius: 28 }}
        alt={username}
      />

      <YStack marginLeft="$3" flex={1}>
        <Text numberOfLines={1} fontSize="$4" fontWeight="500" color="$white1">
          {displayName}
        </Text>
        <Text numberOfLines={1} fontSize="$3" color="$gray10">
          {`@${username}`}
        </Text>
      </YStack>

      {description ? (
        <YStack width="33%">
          <Text numberOfLines={1} fontSize="$2" color="$gray11">
            {description}
          </Text>
        </YStack>
      ) : null}
    </XStack>
  );
});
