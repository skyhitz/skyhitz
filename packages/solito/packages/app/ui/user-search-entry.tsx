'use client';
import * as React from 'react';
import { Text, View, Image, Pressable } from 'react-native';
import { User } from 'app/api/graphql/types';
import { useRouter } from 'solito/navigation';

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
    <Pressable
      onPress={handlePress}
      className="mb-4 flex-row items-center rounded-lg bg-gray-800 p-2"
    >
      <Image
        source={{ uri: avatarUrl }}
        className="h-14 w-14 rounded-full"
        alt={username}
      />

      <View className="ml-3 flex-1">
        <Text numberOfLines={1} className="text-base font-medium text-white">
          {displayName}
        </Text>
        <Text numberOfLines={1} className="text-sm text-gray-400">
          {`@${username}`}
        </Text>
      </View>

      {description ? (
        <View className="w-1/3">
          <Text numberOfLines={1} className="text-xs text-gray-300">
            {description}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
});
